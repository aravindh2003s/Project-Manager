from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Response, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import aiofiles
from PIL import Image
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
raw_mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
mongo_url = ''.join(raw_mongo_url.split())
if not mongo_url:
    raise RuntimeError('MONGO_URL is missing or invalid')

db_name = (os.environ.get('DB_NAME') or 'desire_collection').strip()
if not db_name:
    db_name = 'desire_collection'

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Ensure uploads directory exists
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# ============= MODELS =============
class User(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    role: str = "user"
    created_at: datetime

class SessionData(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

class Product(BaseModel):
    product_id: str
    name: str
    type: str  # tshirt, hoodie, oversized-tshirt, sweatshirt, crop-top
    colors: List[str]
    sizes: List[str]
    base_price: float
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: str

class DesignElement(BaseModel):
    id: str
    type: str  # image, text, sticker
    content: str
    position: Dict[str, float]
    size: Dict[str, float]
    rotation: float = 0
    layer: int = 0

class Design(BaseModel):
    design_id: str
    user_id: str
    product_id: str
    product_color: str
    elements: List[DesignElement]
    preview_url: Optional[str] = None
    created_at: datetime

class CartItem(BaseModel):
    cart_item_id: str
    user_id: str
    design_id: str
    product_id: str
    product_color: str
    size: str
    quantity: int
    price: float
    created_at: datetime

class Order(BaseModel):
    order_id: str
    user_id: str
    items: List[Dict[str, Any]]
    total_amount: float
    shipping_address: Dict[str, str]
    payment_id: Optional[str] = None
    status: str = "pending"  # pending, paid, processing, shipped, delivered
    created_at: datetime

class Sticker(BaseModel):
    sticker_id: str
    user_id: Optional[str] = None
    name: str
    image_url: str
    category: str = "custom"  # custom, emoji, shape, quote, icon
    is_public: bool = False
    created_at: datetime

class ContactMessage(BaseModel):
    message_id: str
    name: str
    email: EmailStr
    message: str
    status: str = "new"  # new, read, replied
    created_at: datetime

# ============= AUTH HELPER =============
async def get_current_user(request: Request, authorization: Optional[str] = Header(None)) -> User:
    """Get current user from session_token cookie or Authorization header"""
    session_token = None
    
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and authorization:
        if authorization.startswith("Bearer "):
            session_token = authorization.replace("Bearer ", "")
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert datetime if needed
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)



async def get_optional_user(request: Request, authorization: Optional[str] = Header(None)) -> Optional[User]:
    """Best-effort auth: return None if user is not authenticated."""
    try:
        return await get_current_user(request, authorization)
    except HTTPException:
        return None
def get_cookie_config(request: Request):
    """Use secure cookies only on HTTPS/non-local hosts for local dev compatibility."""
    forwarded_proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.url.hostname or ""
    is_local = host in {"localhost", "127.0.0.1"}
    is_https = forwarded_proto == "https"

    secure = is_https and not is_local
    samesite = "none" if secure else "lax"
    return secure, samesite
# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/register")
async def register(request: Request, response: Response):
    """Register new user with email and password"""
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, password, and name are required")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    import bcrypt
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password": hashed_password.decode('utf-8'),
        "picture": None,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    secure, samesite = get_cookie_config(request)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Return user data (without password)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    return {"success": True, "user": user}

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    """Login with email and password"""
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    # Find user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    import bcrypt
    if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    secure, samesite = get_cookie_config(request)
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    # Return user data (without password)
    user_data = {k: v for k, v in user.items() if k != "password"}
    return {"success": True, "user": user_data}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"success": True}

# ============= PRODUCT ENDPOINTS =============
@api_router.get("/products", response_model=List[Product])
async def get_products():
    """Get all products"""
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    """Get product by ID"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ============= DESIGN ENDPOINTS =============
@api_router.post("/designs")
async def create_design(
    design_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create or update a design"""
    design_id = design_data.get("design_id") or f"design_{uuid.uuid4().hex[:12]}"
    
    design_doc = {
        "design_id": design_id,
        "user_id": current_user.user_id,
        "product_id": design_data["product_id"],
        "product_color": design_data["product_color"],
        "elements": design_data.get("elements", []),
        "preview_url": design_data.get("preview_url"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert
    await db.designs.update_one(
        {"design_id": design_id},
        {"$set": design_doc},
        upsert=True
    )
    
    return {"success": True, "design_id": design_id}

@api_router.get("/designs")
async def get_user_designs(current_user: User = Depends(get_current_user)):
    """Get user's saved designs"""
    designs = await db.designs.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    return designs

@api_router.get("/designs/{design_id}")
async def get_design(design_id: str, current_user: User = Depends(get_current_user)):
    """Get specific design"""
    design = await db.designs.find_one({"design_id": design_id, "user_id": current_user.user_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return design

@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user-owned design and related cart items"""
    result = await db.designs.delete_one({"design_id": design_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")

    # Keep cart clean if this design was added before checkout.
    await db.cart_items.delete_many({"design_id": design_id, "user_id": current_user.user_id})

    return {"success": True, "design_id": design_id}

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """Upload an image for design"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate filename
    file_ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4().hex[:12]}.{file_ext}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Return URL
    return {"success": True, "url": f"/uploads/{filename}"}

# ============= STICKER ENDPOINTS =============
@api_router.post("/stickers/remove-bg")
async def remove_background(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Remove background from image using local model (rembg)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    fallback_mode = False
    try:
        from rembg import remove
        output = remove(content)
    except ModuleNotFoundError:
        # Graceful fallback when rembg is not installed in the runtime.
        logging.warning("rembg not installed. Returning original image without background removal.")
        output = content
        fallback_mode = True
    except Exception as e:
        logging.exception("Background removal failed")
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    filename = f"sticker_{uuid.uuid4().hex[:12]}.png"
    file_path = UPLOADS_DIR / filename

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(output)

    sticker_id = f"sticker_{uuid.uuid4().hex[:12]}"
    sticker_doc = {
        "sticker_id": sticker_id,
        "user_id": current_user.user_id if current_user else None,
        "name": file.filename,
        "image_url": f"/uploads/{filename}",
        "category": "custom",
        "is_public": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stickers.insert_one(sticker_doc)

    return {"success": True, "url": f"/uploads/{filename}", "sticker_id": sticker_id, "fallback_mode": fallback_mode}
@api_router.get("/stickers")
async def get_stickers(current_user: User = Depends(get_current_user)):
    """Get user's stickers and public stickers"""
    stickers = await db.stickers.find(
        {"$or": [{"user_id": current_user.user_id}, {"is_public": True}]},
        {"_id": 0}
    ).to_list(100)
    return stickers

# ============= CART ENDPOINTS =============
@api_router.post("/cart/quick-add")
async def quick_add_to_cart(cart_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Quick add item to cart from product page"""
    cart_item_id = f"cart_{uuid.uuid4().hex[:12]}"
    
    cart_doc = {
        "cart_item_id": cart_item_id,
        "user_id": current_user.user_id,
        "design_id": None,  # No custom design
        "product_id": cart_data["product_id"],
        "product_color": cart_data.get("product_color", "#FFFFFF"),
        "size": cart_data.get("size", "M"),
        "quantity": cart_data.get("quantity", 1),
        "price": cart_data["price"],
        "product_name": cart_data.get("product_name", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cart_items.insert_one(cart_doc)
    return {"success": True, "cart_item_id": cart_item_id}

@api_router.post("/cart")
async def add_to_cart(cart_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Add item to cart"""
    cart_item_id = f"cart_{uuid.uuid4().hex[:12]}"
    
    cart_doc = {
        "cart_item_id": cart_item_id,
        "user_id": current_user.user_id,
        "design_id": cart_data["design_id"],
        "product_id": cart_data["product_id"],
        "product_color": cart_data["product_color"],
        "size": cart_data["size"],
        "quantity": cart_data.get("quantity", 1),
        "price": cart_data["price"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cart_items.insert_one(cart_doc)
    return {"success": True, "cart_item_id": cart_item_id}

@api_router.get("/cart")
async def get_cart(current_user: User = Depends(get_current_user)):
    """Get user's cart"""
    cart_items = await db.cart_items.find({"user_id": current_user.user_id}, {"_id": 0}).to_list(100)
    return cart_items

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, current_user: User = Depends(get_current_user)):
    """Remove item from cart"""
    result = await db.cart_items.delete_one({"cart_item_id": cart_item_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"success": True}

@api_router.patch("/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, update_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Update cart item quantity"""
    result = await db.cart_items.update_one(
        {"cart_item_id": cart_item_id, "user_id": current_user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    return {"success": True}

# ============= ORDER ENDPOINTS =============
@api_router.post("/orders/create")
async def create_order(order_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create order and Razorpay order"""
    # TODO: Implement Razorpay order creation when API keys are provided
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    
    order_doc = {
        "order_id": order_id,
        "user_id": current_user.user_id,
        "items": order_data["items"],
        "total_amount": order_data["total_amount"],
        "shipping_address": order_data["shipping_address"],
        "payment_id": None,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Clear cart
    await db.cart_items.delete_many({"user_id": current_user.user_id})
    
    return {"success": True, "order_id": order_id, "razorpay_order_id": f"razorpay_{order_id}"}

@api_router.post("/orders/{order_id}/verify-payment")
async def verify_payment(order_id: str, payment_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Verify Razorpay payment"""
    # TODO: Implement Razorpay payment verification when API keys are provided
    
    await db.orders.update_one(
        {"order_id": order_id, "user_id": current_user.user_id},
        {"$set": {"payment_id": payment_data.get("razorpay_payment_id"), "status": "paid"}}
    )
    
    return {"success": True}

@api_router.get("/orders")
async def get_orders(current_user: User = Depends(get_current_user)):
    """Get user's orders"""
    orders = await db.orders.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user's order"""
    result = await db.orders.delete_one({"order_id": order_id, "user_id": current_user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}
# ============= HELP BOT ENDPOINT =============
@api_router.post("/help/chat")
async def help_chat(chat_data: Dict[str, str]):
    """Simple customer support bot response endpoint."""
    message = (chat_data.get("message") or "").strip().lower()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    canned_responses = {
        "order": "You can track your order in your profile under My Orders.",
        "return": "Returns are accepted for manufacturing defects within 7 days of delivery.",
        "payment": "We support cards, UPI, net banking, and popular wallets.",
        "delivery": "Standard delivery is 5-7 business days. Express is 2-3 business days.",
        "design": "Use Save Design in Customize page. Your saved designs appear in Profile.",
        "sticker": "Use Sticker Maker to upload an image. We remove the background and return a downloadable sticker.",
        "contact": "You can reach support via support@vibestitch.com or +91-1234-567-890.",
    }

    reply = "Thanks for your message. Our support team will get back to you shortly."
    for key, text in canned_responses.items():
        if key in message:
            reply = text
            break

    return {"success": True, "reply": reply}
# ============= CONTACT ENDPOINT =============
@api_router.post("/contact")
async def submit_contact(contact_data: Dict[str, str]):
    """Submit contact form"""
    name = (contact_data.get("name") or "").strip()
    email = (contact_data.get("email") or "").strip()
    message = (contact_data.get("message") or "").strip()

    if not name or not email or not message:
        raise HTTPException(status_code=400, detail="name, email and message are required")

    message_id = f"msg_{uuid.uuid4().hex[:12]}"

    message_doc = {
        "message_id": message_id,
        "name": name,
        "email": email,
        "message": message,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.contact_messages.insert_one(message_doc)
    return {"success": True, "message_id": message_id}

# ============= ADMIN ENDPOINTS =============
@api_router.get("/admin/orders")
async def admin_get_orders(current_user: User = Depends(get_current_user)):
    """Get all orders (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.get("/admin/users")
async def admin_get_users(current_user: User = Depends(get_current_user)):
    """Get all users (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/messages")
async def admin_get_messages(current_user: User = Depends(get_current_user)):
    """Get all contact messages (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return messages

app.include_router(api_router)

# Mount uploads directory for static file serving
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
def get_allowed_origins():
    raw = os.environ.get("CORS_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=get_allowed_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    """Initialize database with sample products"""
    # Check if products exist
    count = await db.products.count_documents({})
    if count == 0:
        # Insert sample products - 15+ collections
        products = [
            # T-Shirts Collection
            {
                "product_id": "prod_tshirt_basic_white",
                "name": "Classic White T-Shirt",
                "type": "tshirt",
                "colors": ["#FFFFFF", "#000000", "#4F46E5", "#EC4899", "#F59E0B"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 499.0,
                "description": "Premium cotton, perfect for daily wear",
                "category": "T-Shirts",
                "image_url": "https://images.unsplash.com/photo-1659592987637-c766206e72b8?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_tshirt_vintage",
                "name": "Vintage Graphic Tee",
                "type": "tshirt",
                "colors": ["#1F2937", "#7C3AED", "#DC2626", "#059669"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 599.0,
                "description": "Retro-inspired design with soft fabric",
                "category": "T-Shirts",
                "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_tshirt_pocket",
                "name": "Pocket T-Shirt",
                "type": "tshirt",
                "colors": ["#64748B", "#4F46E5", "#0891B2", "#F59E0B"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 549.0,
                "description": "Casual style with front pocket detail",
                "category": "T-Shirts",
                "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            
            # Hoodies Collection
            {
                "product_id": "prod_hoodie_classic",
                "name": "Classic Pullover Hoodie",
                "type": "hoodie",
                "colors": ["#000000", "#1F2937", "#4F46E5", "#DC2626", "#059669"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 1299.0,
                "description": "Warm and cozy with adjustable hood",
                "category": "Hoodies",
                "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_hoodie_zip",
                "name": "Zip-Up Hoodie",
                "type": "hoodie",
                "colors": ["#1F2937", "#4F46E5", "#64748B", "#0891B2"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 1399.0,
                "description": "Full-zip design with side pockets",
                "category": "Hoodies",
                "image_url": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_hoodie_oversized",
                "name": "Oversized Hoodie",
                "type": "hoodie",
                "colors": ["#64748B", "#000000", "#4F46E5", "#EC4899"],
                "sizes": ["M", "L", "XL", "XXL"],
                "base_price": 1499.0,
                "description": "Trendy oversized fit for comfort",
                "category": "Hoodies",
                "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            
            # Oversized T-Shirts Collection
            {
                "product_id": "prod_oversized_basic",
                "name": "Oversized Basic Tee",
                "type": "oversized-tshirt",
                "colors": ["#FFFFFF", "#000000", "#F3F4F6", "#EC4899", "#4F46E5"],
                "sizes": ["M", "L", "XL", "XXL"],
                "base_price": 699.0,
                "description": "Relaxed fit with dropped shoulders",
                "category": "Oversized",
                "image_url": "https://images.unsplash.com/photo-1765248148573-6933525c1dee?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_oversized_streetwear",
                "name": "Streetwear Oversized Tee",
                "type": "oversized-tshirt",
                "colors": ["#000000", "#1F2937", "#4F46E5", "#7C3AED"],
                "sizes": ["M", "L", "XL", "XXL"],
                "base_price": 799.0,
                "description": "Urban style with extra length",
                "category": "Oversized",
                "image_url": "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_oversized_graphic",
                "name": "Oversized Graphic Tee",
                "type": "oversized-tshirt",
                "colors": ["#FFFFFF", "#F3F4F6", "#FEF3C7", "#DBEAFE"],
                "sizes": ["M", "L", "XL", "XXL"],
                "base_price": 849.0,
                "description": "Bold prints on oversized canvas",
                "category": "Oversized",
                "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            
            # Sweatshirts Collection
            {
                "product_id": "prod_sweat_crewneck",
                "name": "Crewneck Sweatshirt",
                "type": "sweatshirt",
                "colors": ["#1F2937", "#4F46E5", "#059669", "#DC2626", "#F59E0B"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 999.0,
                "description": "Classic crewneck for all seasons",
                "category": "Sweatshirts",
                "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_sweat_vintage",
                "name": "Vintage Wash Sweatshirt",
                "type": "sweatshirt",
                "colors": ["#78716C", "#57534E", "#6B7280", "#64748B"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 1099.0,
                "description": "Distressed look with soft interior",
                "category": "Sweatshirts",
                "image_url": "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_sweat_embroidered",
                "name": "Embroidered Sweatshirt",
                "type": "sweatshirt",
                "colors": ["#000000", "#4F46E5", "#7C3AED", "#EC4899"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 1199.0,
                "description": "Premium embroidery details",
                "category": "Sweatshirts",
                "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            
            # Crop Tops Collection
            {
                "product_id": "prod_crop_basic",
                "name": "Basic Crop Top",
                "type": "crop-top",
                "colors": ["#FFFFFF", "#000000", "#EC4899", "#F59E0B", "#4F46E5"],
                "sizes": ["XS", "S", "M", "L"],
                "base_price": 599.0,
                "description": "Essential crop with perfect fit",
                "category": "Crop Tops",
                "image_url": "https://images.unsplash.com/photo-1763750581713-6946ff32e63b?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_crop_athletic",
                "name": "Athletic Crop Top",
                "type": "crop-top",
                "colors": ["#000000", "#1F2937", "#4F46E5", "#059669"],
                "sizes": ["XS", "S", "M", "L"],
                "base_price": 649.0,
                "description": "Sports-inspired design",
                "category": "Crop Tops",
                "image_url": "https://images.unsplash.com/photo-1544441892-794166f1e3be?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            {
                "product_id": "prod_crop_ribbed",
                "name": "Ribbed Crop Top",
                "type": "crop-top",
                "colors": ["#FFFFFF", "#EC4899", "#7C3AED", "#F59E0B"],
                "sizes": ["XS", "S", "M", "L"],
                "base_price": 699.0,
                "description": "Textured ribbed fabric",
                "category": "Crop Tops",
                "image_url": "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?crop=entropy&cs=srgb&fm=jpg&q=85"
            },
            
            # Premium Collection
            {
                "product_id": "prod_premium_polo",
                "name": "Premium Polo Shirt",
                "type": "tshirt",
                "colors": ["#FFFFFF", "#000000", "#1F2937", "#4F46E5"],
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "base_price": 899.0,
                "description": "Elegant polo for smart casual",
                "category": "Premium",
                "image_url": "https://images.unsplash.com/photo-1589310243389-96a5483213a8?crop=entropy&cs=srgb&fm=jpg&q=85"
            }
        ]
        await db.products.insert_many(products)
        logger.info(f"Inserted {len(products)} sample products")
    
    # Create admin user if not exists
    admin = await db.users.find_one({"role": "admin"}, {"_id": 0})
    if not admin:
        import bcrypt
        admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@vibestitch.com",
            "name": "Admin User",
            "password": admin_password.decode('utf-8'),
            "picture": None,
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created: admin@vibestitch.com / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()







