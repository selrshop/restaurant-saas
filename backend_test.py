import requests
import sys
import json
from datetime import datetime

class FoodOrderingAPITester:
    def __init__(self, base_url="https://vue-desi-order.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected: {expected_status})"
                try:
                    error_data = response.json()
                    details += f", Response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "phone": f"9876543{timestamp[-3:]}"
        }
        
        response = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        if not self.token:
            return False
            
        # Try to get current user info to verify token works
        response = self.run_test("Get Current User", "GET", "auth/me", 200)
        return response is not None

    def test_menu_categories(self):
        """Test getting menu categories"""
        response = self.run_test("Get Categories", "GET", "menu/categories", 200)
        if response and isinstance(response, list):
            self.log_test("Categories Data Structure", len(response) > 0, f"Found {len(response)} categories")
            return response
        return None

    def test_menu_items(self):
        """Test getting menu items"""
        response = self.run_test("Get Menu Items", "GET", "menu/items", 200)
        if response and isinstance(response, list):
            self.log_test("Menu Items Data Structure", len(response) > 0, f"Found {len(response)} items")
            return response
        return None

    def test_featured_items(self):
        """Test getting featured items"""
        response = self.run_test("Get Featured Items", "GET", "menu/featured", 200)
        if response and isinstance(response, list):
            self.log_test("Featured Items Data Structure", True, f"Found {len(response)} featured items")
            return response
        return None

    def test_cart_operations(self, menu_items):
        """Test cart operations"""
        if not self.token or not menu_items:
            self.log_test("Cart Operations", False, "No auth token or menu items")
            return False

        # Get empty cart
        self.run_test("Get Empty Cart", "GET", "cart", 200)

        # Add item to cart
        if menu_items:
            item_id = menu_items[0]['id']
            add_data = {"menu_item_id": item_id, "quantity": 2}
            response = self.run_test("Add to Cart", "POST", "cart/add", 200, add_data)
            
            if response:
                # Get cart with items
                cart_response = self.run_test("Get Cart with Items", "GET", "cart", 200)
                if cart_response and len(cart_response) > 0:
                    cart_item_id = cart_response[0]['id']
                    
                    # Update cart item quantity
                    self.run_test("Update Cart Item", "PUT", f"cart/update/{cart_item_id}?quantity=3", 200)
                    
                    # Remove item from cart
                    self.run_test("Remove from Cart", "DELETE", f"cart/remove/{cart_item_id}", 200)
                    
                    return True
        return False

    def test_order_creation(self, menu_items):
        """Test order creation"""
        if not self.token or not menu_items:
            self.log_test("Order Creation", False, "No auth token or menu items")
            return None

        # First add item to cart
        item_id = menu_items[0]['id']
        add_data = {"menu_item_id": item_id, "quantity": 1}
        self.run_test("Add Item for Order", "POST", "cart/add", 200, add_data)

        # Create order
        order_data = {
            "delivery_address": "123 Test Street, Test City, 12345",
            "items": [{
                "menu_item_id": item_id,
                "menu_item_name": menu_items[0]['name'],
                "quantity": 1,
                "price": menu_items[0]['price']
            }],
            "total_amount": menu_items[0]['price']
        }
        
        response = self.run_test("Create Order", "POST", "orders/create", 200, order_data)
        if response and 'order_id' in response:
            order_id = response['order_id']
            
            # Get order details
            self.run_test("Get Order Details", "GET", f"orders/{order_id}", 200)
            
            # Get user orders
            self.run_test("Get User Orders", "GET", "orders", 200)
            
            return order_id
        return None

    def test_payment_checkout(self, order_id):
        """Test payment checkout session creation"""
        if not self.token or not order_id:
            self.log_test("Payment Checkout", False, "No auth token or order ID")
            return None

        checkout_data = {
            "order_id": order_id,
            "origin_url": "https://vue-desi-order.preview.emergentagent.com"
        }
        
        response = self.run_test("Create Checkout Session", "POST", "payments/checkout", 200, checkout_data)
        if response and 'session_id' in response:
            session_id = response['session_id']
            
            # Test payment status check
            self.run_test("Get Payment Status", "GET", f"payments/status/{session_id}", 200)
            
            return session_id
        return None

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Food Ordering API Tests...")
        print("=" * 50)

        # Test basic connectivity
        self.test_root_endpoint()

        # Test authentication
        if self.test_user_registration():
            self.test_user_login()
        else:
            print("❌ Registration failed, skipping authenticated tests")
            return self.get_summary()

        # Test menu endpoints
        categories = self.test_menu_categories()
        menu_items = self.test_menu_items()
        self.test_featured_items()

        # Test cart operations
        if menu_items:
            self.test_cart_operations(menu_items)
            
            # Test order creation
            order_id = self.test_order_creation(menu_items)
            
            # Test payment
            if order_id:
                self.test_payment_checkout(order_id)

        return self.get_summary()

    def get_summary(self):
        """Get test summary"""
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print("⚠️  Some tests failed. Check details above.")
            
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = FoodOrderingAPITester()
    summary = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if summary["success_rate"] == 100 else 1

if __name__ == "__main__":
    sys.exit(main())