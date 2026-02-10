from fastapi import FastAPI, APIRouter, HTTPException, Request, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'restaurant-saas-secret-2024')
JWT_ALGORITHM = "HS256"

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_key')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', 'rzp_test_secret')
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Create the main app
app = FastAPI(title="Restaurant SaaS Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== MODELS ====================

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str = "customer"  # customer, restaurant_owner, super_admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: str
    role: str = "customer"
    restaurant_id: Optional[str] = None  # For restaurant owners
    addresses: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Restaurant Models
class RestaurantCreate(BaseModel):
    name: str
    slug: str
    subdomain: Optional[str] = None
    description: str
    cuisine_types: List[str]
    address: str
    phone: str
    logo: Optional[str] = None
    cover_image: Optional[str] = None

class Restaurant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    name: str
    slug: str
    subdomain: Optional[str] = None
    description: str
    cuisine_types: List[str]
    address: str
    phone: str
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    status: str = "pending"  # pending, active, suspended
    subscription_plan: str = "free"
    razorpay_account_id: Optional[str] = None
    commission_rate: float = 10.0  # Platform commission percentage
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Menu Item Variant Model
class MenuItemVariant(BaseModel):
    name: str  # Half, Full, Mini, Family Pack
    price: float
    available: bool = True

# Menu Item Models
class MenuItemCreate(BaseModel):
    name: str
    description: str
    category_id: str
    image: str
    is_veg: bool
    spice_level: int
    variants: List[MenuItemVariant]  # NEW: Support for variants
    prep_time: int = 20

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: str
    category_id: str
    category_name: str
    image: str
    is_veg: bool
    spice_level: int
    variants: List[MenuItemVariant]
    is_available: bool = True
    rating: float = 4.5
    prep_time: int = 20
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: str
    image: str

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    restaurant_id: str
    name: str
    description: str
    image: str
    order: int = 0

# Cart Models
class CartItemAdd(BaseModel):
    menu_item_id: str
    variant_name: str  # Which variant to add
    quantity: int = 1

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    menu_item_id: str
    variant_name: str
    quantity: int
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Order Models
class OrderItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    variant_name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    restaurant_id: str
    delivery_address: str
    items: List[OrderItem]
    total_amount: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    restaurant_id: str
    items: List[OrderItem]
    total_amount: float
    commission_amount: float
    restaurant_amount: float
    status: str = "pending"
    delivery_address: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Subscription Plan Models
class SubscriptionPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    price: float
    duration_days: int
    max_menu_items: int
    features: List[str]


# ==================== HELPER FUNCTIONS ====================

def create_jwt_token(user_id: str, email: str, role: str, restaurant_id: Optional[str] = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "restaurant_id": restaurant_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        return verify_jwt_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

async def require_role(required_roles: List[str], user_data: dict = Depends(get_current_user)):
    if user_data['role'] not in required_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user_data


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_password.decode('utf-8')
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    token = create_jwt_token(user.id, user.email, user.role, user.restaurant_id)
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user['id'], user['email'], user['role'], user.get('restaurant_id'))
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "phone": user['phone'],
            "role": user['role'],
            "restaurant_id": user.get('restaurant_id')
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(user_data: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_data['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ==================== RESTAURANT ROUTES ====================

@api_router.post("/restaurants/create")
async def create_restaurant(restaurant_data: RestaurantCreate, user_data: dict = Depends(get_current_user)):
    if user_data['role'] != 'restaurant_owner':
        raise HTTPException(status_code=403, detail="Only restaurant owners can create restaurants")
    
    # Check if slug already exists
    existing = await db.restaurants.find_one({"slug": restaurant_data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Restaurant slug already exists")
    
    restaurant = Restaurant(
        owner_id=user_data['user_id'],
        **restaurant_data.model_dump()
    )
    
    restaurant_doc = restaurant.model_dump()
    restaurant_doc['created_at'] = restaurant_doc['created_at'].isoformat()
    restaurant_doc['updated_at'] = restaurant_doc['updated_at'].isoformat()
    
    await db.restaurants.insert_one(restaurant_doc)
    
    # Update user's restaurant_id
    await db.users.update_one(
        {"id": user_data['user_id']},
        {"$set": {"restaurant_id": restaurant.id}}
    )
    
    return {"restaurant_id": restaurant.id, "message": "Restaurant created successfully. Pending approval."}

@api_router.get("/restaurants")
async def get_restaurants(status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = "active"  # By default, show only active restaurants
    
    restaurants = await db.restaurants.find(query, {"_id": 0}).to_list(1000)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@api_router.get("/restaurants/slug/{slug}")
async def get_restaurant_by_slug(slug: str):
    restaurant = await db.restaurants.find_one({"slug": slug}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@api_router.get("/restaurants/my/restaurant")
async def get_my_restaurant(user_data: dict = Depends(get_current_user)):
    if user_data['role'] != 'restaurant_owner':
        raise HTTPException(status_code=403, detail="Only restaurant owners can access this")
    
    restaurant = await db.restaurants.find_one({"owner_id": user_data['user_id']}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@api_router.put("/restaurants/{restaurant_id}/update")
async def update_restaurant(
    restaurant_id: str,
    update_data: RestaurantCreate,
    user_data: dict = Depends(get_current_user)
):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = update_data.model_dump()
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": update_dict}
    )
    
    return {"message": "Restaurant updated successfully"}


# ==================== ADMIN ROUTES ====================

@api_router.put("/admin/restaurants/{restaurant_id}/approve")
async def approve_restaurant(restaurant_id: str, user_data: dict = Depends(get_current_user)):
    if user_data['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail="Only super admin can approve restaurants")
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Restaurant approved successfully"}

@api_router.put("/admin/restaurants/{restaurant_id}/suspend")
async def suspend_restaurant(restaurant_id: str, user_data: dict = Depends(get_current_user)):
    if user_data['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail="Only super admin can suspend restaurants")
    
    await db.restaurants.update_one(
        {"id": restaurant_id},
        {"$set": {"status": "suspended", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Restaurant suspended successfully"}

@api_router.get("/admin/analytics")
async def get_admin_analytics(user_data: dict = Depends(get_current_user)):
    if user_data['role'] != 'super_admin':
        raise HTTPException(status_code=403, detail="Only super admin can access analytics")
    
    total_restaurants = await db.restaurants.count_documents({})
    active_restaurants = await db.restaurants.count_documents({"status": "active"})
    pending_restaurants = await db.restaurants.count_documents({"status": "pending"})
    total_orders = await db.orders.count_documents({})
    
    # Calculate total revenue and commissions
    orders = await db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    total_commission = sum(order.get('commission_amount', 0) for order in orders)
    
    return {
        "total_restaurants": total_restaurants,
        "active_restaurants": active_restaurants,
        "pending_restaurants": pending_restaurants,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_commission": total_commission
    }


# ==================== MENU ROUTES (Restaurant-Scoped) ====================

@api_router.get("/restaurants/{restaurant_id}/menu/categories")
async def get_restaurant_categories(restaurant_id: str):
    categories = await db.categories.find({"restaurant_id": restaurant_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.post("/restaurants/{restaurant_id}/menu/categories")
async def create_category(
    restaurant_id: str,
    category_data: CategoryCreate,
    user_data: dict = Depends(get_current_user)
):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    category = Category(
        restaurant_id=restaurant_id,
        **category_data.model_dump()
    )
    
    category_doc = category.model_dump()
    await db.categories.insert_one(category_doc)
    
    return {"category_id": category.id, "message": "Category created successfully"}

@api_router.get("/restaurants/{restaurant_id}/menu/items")
async def get_restaurant_menu_items(
    restaurant_id: str,
    category_id: Optional[str] = None,
    is_veg: Optional[bool] = None,
    spice_level: Optional[int] = None,
    search: Optional[str] = None
):
    query = {"restaurant_id": restaurant_id, "is_available": True}
    
    if category_id:
        query["category_id"] = category_id
    if is_veg is not None:
        query["is_veg"] = is_veg
    if spice_level is not None:
        query["spice_level"] = {"$lte": spice_level}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    items = await db.menu_items.find(query, {"_id": 0}).to_list(1000)
    return items

@api_router.post("/restaurants/{restaurant_id}/menu/items")
async def create_menu_item(
    restaurant_id: str,
    item_data: MenuItemCreate,
    user_data: dict = Depends(get_current_user)
):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get category name
    category = await db.categories.find_one({"id": item_data.category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    menu_item = MenuItem(
        restaurant_id=restaurant_id,
        category_name=category['name'],
        **item_data.model_dump()
    )
    
    menu_item_doc = menu_item.model_dump()
    menu_item_doc['created_at'] = menu_item_doc['created_at'].isoformat()
    
    # Convert variants to dict
    menu_item_doc['variants'] = [v.model_dump() if hasattr(v, 'model_dump') else v for v in menu_item_doc['variants']]
    
    await db.menu_items.insert_one(menu_item_doc)
    
    return {"item_id": menu_item.id, "message": "Menu item created successfully"}

@api_router.get("/restaurants/{restaurant_id}/menu/items/{item_id}")
async def get_menu_item(restaurant_id: str, item_id: str):
    item = await db.menu_items.find_one({"id": item_id, "restaurant_id": restaurant_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    cart_items = await db.cart_items.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    result = []
    for cart_item in cart_items:
        menu_item = await db.menu_items.find_one({"id": cart_item['menu_item_id']}, {"_id": 0})
        if menu_item:
            result.append({
                "id": cart_item['id'],
                "menu_item": menu_item,
                "variant_name": cart_item['variant_name'],
                "quantity": cart_item['quantity'],
                "restaurant_id": cart_item['restaurant_id']
            })
    
    return result

@api_router.post("/cart/add")
async def add_to_cart(item: CartItemAdd, user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    menu_item = await db.menu_items.find_one({"id": item.menu_item_id}, {"_id": 0})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Verify variant exists
    variant_exists = any(v['name'] == item.variant_name for v in menu_item['variants'])
    if not variant_exists:
        raise HTTPException(status_code=400, detail="Invalid variant")
    
    # Check if item already in cart with same variant
    existing_item = await db.cart_items.find_one({
        "user_id": user_id,
        "menu_item_id": item.menu_item_id,
        "variant_name": item.variant_name
    }, {"_id": 0})
    
    if existing_item:
        new_quantity = existing_item['quantity'] + item.quantity
        await db.cart_items.update_one(
            {"id": existing_item['id']},
            {"$set": {"quantity": new_quantity}}
        )
        return {"message": "Cart updated", "cart_item_id": existing_item['id']}
    else:
        cart_item = CartItem(
            user_id=user_id,
            restaurant_id=menu_item['restaurant_id'],
            menu_item_id=item.menu_item_id,
            variant_name=item.variant_name,
            quantity=item.quantity
        )
        cart_doc = cart_item.model_dump()
        cart_doc['added_at'] = cart_doc['added_at'].isoformat()
        await db.cart_items.insert_one(cart_doc)
        return {"message": "Item added to cart", "cart_item_id": cart_item.id}

@api_router.put("/cart/update/{cart_item_id}")
async def update_cart_item(cart_item_id: str, quantity: int, user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    result = await db.cart_items.update_one(
        {"id": cart_item_id, "user_id": user_id},
        {"$set": {"quantity": quantity}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Cart item updated"}

@api_router.delete("/cart/remove/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    result = await db.cart_items.delete_one({"id": cart_item_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    await db.cart_items.delete_many({"user_id": user_id})
    return {"message": "Cart cleared"}


# ==================== ORDER ROUTES ====================

@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    # Get restaurant to calculate commission
    restaurant = await db.restaurants.find_one({"id": order_data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    commission_amount = order_data.total_amount * (restaurant['commission_rate'] / 100)
    restaurant_amount = order_data.total_amount - commission_amount
    
    order = Order(
        user_id=user_id,
        restaurant_id=order_data.restaurant_id,
        items=order_data.items,
        total_amount=order_data.total_amount,
        commission_amount=commission_amount,
        restaurant_amount=restaurant_amount,
        delivery_address=order_data.delivery_address,
        status="pending",
        payment_status="pending"
    )
    
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    order_doc['updated_at'] = order_doc['updated_at'].isoformat()
    order_doc['items'] = [item.model_dump() if hasattr(item, 'model_dump') else item for item in order_doc['items']]
    
    await db.orders.insert_one(order_doc)
    
    return {"order_id": order.id, "message": "Order created successfully"}

@api_router.get("/orders")
async def get_orders(user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    orders = await db.orders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user_data: dict = Depends(get_current_user)):
    user_id = user_data['user_id']
    
    order = await db.orders.find_one(
        {"id": order_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@api_router.get("/restaurants/{restaurant_id}/orders")
async def get_restaurant_orders(restaurant_id: str, user_data: dict = Depends(get_current_user)):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    orders = await db.orders.find(
        {"restaurant_id": restaurant_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return orders

@api_router.get("/restaurants/{restaurant_id}/analytics")
async def get_restaurant_analytics(restaurant_id: str, user_data: dict = Depends(get_current_user)):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    total_orders = await db.orders.count_documents({"restaurant_id": restaurant_id})
    completed_orders = await db.orders.count_documents({"restaurant_id": restaurant_id, "payment_status": "paid"})
    
    orders = await db.orders.find({"restaurant_id": restaurant_id, "payment_status": "paid"}, {"_id": 0}).to_list(10000)
    total_revenue = sum(order.get('restaurant_amount', 0) for order in orders)
    
    menu_items_count = await db.menu_items.count_documents({"restaurant_id": restaurant_id})
    
    return {
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue,
        "menu_items_count": menu_items_count
    }

@api_router.put("/restaurants/{restaurant_id}/orders/{order_id}/status")
async def update_order_status(
    restaurant_id: str,
    order_id: str,
    status: str,
    user_data: dict = Depends(get_current_user)
):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    if user_data['role'] != 'super_admin' and restaurant['owner_id'] != user_data['user_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    valid_statuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.orders.update_one(
        {"id": order_id, "restaurant_id": restaurant_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Order status updated successfully"}


# ==================== PAYMENT ROUTES (Razorpay) ====================

@api_router.post("/payments/create-order")
async def create_payment_order(order_id: str, user_data: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user_data['user_id']}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['payment_status'] == 'paid':
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Create Razorpay order
    amount_in_paise = int(order['total_amount'] * 100)
    
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": 1
        })
        
        # Update order with razorpay order ID
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"razorpay_order_id": razorpay_order['id']}}
        )
        
        return {
            "razorpay_order_id": razorpay_order['id'],
            "amount": amount_in_paise,
            "currency": "INR",
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment order creation failed")

@api_router.post("/payments/verify")
async def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user_data: dict = Depends(get_current_user)
):
    try:
        # Verify payment signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        # Update order
        order = await db.orders.find_one({"razorpay_order_id": razorpay_order_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        await db.orders.update_one(
            {"id": order['id']},
            {"$set": {
                "payment_status": "paid",
                "razorpay_payment_id": razorpay_payment_id,
                "status": "confirmed",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Clear user's cart
        await db.cart_items.delete_many({"user_id": user_data['user_id']})
        
        return {"status": "success", "order_id": order['id']}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")


# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {
        "message": "Restaurant SaaS Platform API",
        "version": "2.0",
        "status": "running"
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
