import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { BACKEND_URL } from '../lib/api';


function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCart();
  }, []);
  
  const fetchCart = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/cart`, {
        withCredentials: true
      });
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemove = async (cartItemId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/cart/${cartItemId}`, {
        withCredentials: true
      });
      setCartItems(cartItems.filter(item => item.cart_item_id !== cartItemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };
  
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await axios.patch(
        `${BACKEND_URL}/api/cart/${cartItemId}`,
        { quantity: newQuantity },
        { withCredentials: true }
      );
      setCartItems(cartItems.map(item => 
        item.cart_item_id === cartItemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  if (loading) {
    return (
      <div className="min-h-screen theme-page flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen theme-page pb-10">
      <Navbar />
      
      <div className="theme-shell pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" data-testid="cart-title">Shopping Cart</h1>
          
          {cartItems.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-slate-600 mb-6">Start designing and add items to your cart</p>
              <button
                onClick={() => navigate('/customize')}
                className="rounded-full bg-indigo-600 text-white px-8 py-3 font-bold shadow-lg hover:scale-105 transition-all"
              >
                Start Designing
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map(item => (
                <div key={item.cart_item_id} className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{item.product_name || item.product_id}</h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>Color: <span className="inline-block w-4 h-4 rounded-full border border-slate-300 align-middle ml-1" style={{backgroundColor: item.product_color}}></span></p>
                        <p>Size: <span className="font-medium">{item.size}</span></p>
                        <p className="font-bold text-lg text-indigo-600">₹{item.price}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="px-4 font-bold" data-testid={`quantity-${item.cart_item_id}`}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                          className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold"
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemove(item.cart_item_id)}
                        className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                        data-testid={`remove-${item.cart_item_id}`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Summary */}
              <div className="glass rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Subtotal</span>
                  <span className="text-lg">₹{total}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium">Shipping</span>
                  <span className="text-lg">₹50</span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center mb-6">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-indigo-600" data-testid="cart-total">₹{total + 50}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full rounded-full bg-indigo-600 text-white px-8 py-4 font-bold text-lg shadow-lg hover:scale-105 transition-all"
                  data-testid="checkout-button"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CartPage;

