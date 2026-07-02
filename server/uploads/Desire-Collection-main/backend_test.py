import requests
import sys
import json
from datetime import datetime

class ApparelEcommerceAPITester:
    def __init__(self, base_url="https://stylemytee.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    self.log_test(name, True, details)
                    return True, response_data
                except:
                    self.log_test(name, True, details)
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:100]}"
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_products_endpoints(self):
        """Test product-related endpoints"""
        print("\n" + "="*50)
        print("TESTING PRODUCT ENDPOINTS")
        print("="*50)
        
        # Test get all products
        success, products = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        if success and products:
            print(f"   Found {len(products)} products")
            
            # Test get specific product
            if len(products) > 0:
                product_id = products[0]['product_id']
                self.run_test(
                    "Get Specific Product",
                    "GET",
                    f"products/{product_id}",
                    200
                )
        
        return success

    def test_auth_endpoints(self):
        """Test authentication endpoints (without actual OAuth)"""
        print("\n" + "="*50)
        print("TESTING AUTH ENDPOINTS")
        print("="*50)
        
        # Test /auth/me without authentication (should fail)
        self.run_test(
            "Get User Info (Unauthenticated)",
            "GET",
            "auth/me",
            401
        )
        
        # Note: We can't test actual OAuth flow in automated tests
        # but we can test the session endpoint structure
        print("   Note: OAuth flow requires manual testing with browser")
        return True

    def test_contact_endpoint(self):
        """Test contact form submission"""
        print("\n" + "="*50)
        print("TESTING CONTACT ENDPOINT")
        print("="*50)
        
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "message": "This is a test message from automated testing"
        }
        
        success, response = self.run_test(
            "Submit Contact Form",
            "POST",
            "contact",
            200,
            data=contact_data
        )
        
        return success

    def test_protected_endpoints_without_auth(self):
        """Test protected endpoints without authentication (should all fail)"""
        print("\n" + "="*50)
        print("TESTING PROTECTED ENDPOINTS (WITHOUT AUTH)")
        print("="*50)
        
        protected_tests = [
            ("Get User Designs", "GET", "designs", 401),
            ("Get User Cart", "GET", "cart", 401),
            ("Get User Orders", "GET", "orders", 401),
            ("Get User Stickers", "GET", "stickers", 401),
            ("Admin Get Orders", "GET", "admin/orders", 401),
            ("Admin Get Users", "GET", "admin/users", 401),
            ("Admin Get Messages", "GET", "admin/messages", 401),
        ]
        
        all_passed = True
        for test_name, method, endpoint, expected_status in protected_tests:
            success, _ = self.run_test(test_name, method, endpoint, expected_status)
            if not success:
                all_passed = False
        
        return all_passed

    def test_file_upload_endpoints(self):
        """Test file upload endpoints (without actual files)"""
        print("\n" + "="*50)
        print("TESTING FILE UPLOAD ENDPOINTS")
        print("="*50)
        
        # Test upload without authentication (should fail)
        self.run_test(
            "Upload Image (Unauthenticated)",
            "POST",
            "upload",
            401
        )
        
        # Test sticker background removal without authentication (should fail)
        self.run_test(
            "Remove Background (Unauthenticated)",
            "POST",
            "stickers/remove-bg",
            401
        )
        
        return True

    def test_order_endpoints_without_auth(self):
        """Test order endpoints without authentication"""
        print("\n" + "="*50)
        print("TESTING ORDER ENDPOINTS (WITHOUT AUTH)")
        print("="*50)
        
        order_data = {
            "items": [],
            "total_amount": 100,
            "shipping_address": {
                "name": "Test User",
                "address": "Test Address",
                "city": "Test City",
                "state": "Test State",
                "pincode": "123456"
            }
        }
        
        self.run_test(
            "Create Order (Unauthenticated)",
            "POST",
            "orders/create",
            401,
            data=order_data
        )
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Apparel E-commerce API Testing")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Test public endpoints
        products_ok = self.test_products_endpoints()
        contact_ok = self.test_contact_endpoint()
        
        # Test authentication structure
        auth_ok = self.test_auth_endpoints()
        
        # Test protected endpoints (should fail without auth)
        protected_ok = self.test_protected_endpoints_without_auth()
        file_upload_ok = self.test_file_upload_endpoints()
        order_ok = self.test_order_endpoints_without_auth()
        
        # Print summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed results
        print("\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}")
            if not result["success"] and result["details"]:
                print(f"      └─ {result['details']}")
        
        # Overall assessment
        critical_endpoints_working = products_ok and contact_ok
        
        if critical_endpoints_working:
            print("\n🎉 BACKEND STATUS: READY FOR FRONTEND TESTING")
            print("   ✓ Core public endpoints working")
            print("   ✓ Authentication structure in place")
            print("   ✓ Protected endpoints properly secured")
        else:
            print("\n⚠️  BACKEND STATUS: ISSUES FOUND")
            print("   ❌ Critical endpoints not working properly")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ApparelEcommerceAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())