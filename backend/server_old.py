from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
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
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'desi-food-kart-secret-key-2024')
JWT_ALGORITHM = "HS256"

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app without a prefix
app = FastAPI()

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

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: str
    addresses: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Category Models
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    image: str
    order: int = 0

# Menu Item Models
class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category_id: str
    category_name: str
    image: str
    is_veg: bool
    spice_level: int  # 0: None, 1: Mild, 2: Medium, 3: Hot, 4: Extra Hot
    is_available: bool = True
    special_offer: Optional[float] = None  # discount percentage
    rating: float = 4.5
    prep_time: int = 20  # in minutes

# Cart Models
class CartItemAdd(BaseModel):
    menu_item_id: str
    quantity: int = 1

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    menu_item_id: str
    quantity: int
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemResponse(BaseModel):
    id: str
    menu_item: MenuItem
    quantity: int

# Order Models
class OrderItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    delivery_address: str
    items: List[OrderItem]
    total_amount: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"  # pending, confirmed, preparing, out_for_delivery, delivered, cancelled
    delivery_address: str
    payment_session_id: Optional[str] = None
    payment_status: str = "pending"  # pending, paid, failed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Payment Models
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    order_id: Optional[str] = None
    amount: float
    currency: str = "inr"
    status: str = "initiated"  # initiated, completed, failed, expired
    payment_status: str = "pending"  # pending, paid, failed
    metadata: Optional[Dict] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str


# ==================== HELPER FUNCTIONS ====================

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
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

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        return verify_jwt_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hashed_password.decode('utf-8')
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user.id, user.email)
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(credentials.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_jwt_token(user['id'], user['email'])
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "phone": user['phone']
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user = await db.users.find_one({"id": user_data['user_id']}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ==================== MENU ROUTES ====================

@api_router.get("/menu/categories")
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories

@api_router.get("/menu/items")
async def get_menu_items(
    category_id: Optional[str] = None,
    is_veg: Optional[bool] = None,
    spice_level: Optional[int] = None,
    search: Optional[str] = None
):
    query = {"is_available": True}
    
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

@api_router.get("/menu/items/{item_id}")
async def get_menu_item(item_id: str):
    item = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@api_router.get("/menu/featured")
async def get_featured_items():
    # Get items with special offers
    items = await db.menu_items.find(
        {"is_available": True, "special_offer": {"$gt": 0}},
        {"_id": 0}
    ).limit(6).to_list(6)
    return items


# ==================== CART ROUTES ====================

@api_router.get("/cart")
async def get_cart(authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    cart_items = await db.cart_items.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Populate menu item details
    result = []
    for cart_item in cart_items:
        menu_item = await db.menu_items.find_one({"id": cart_item['menu_item_id']}, {"_id": 0})
        if menu_item:
            result.append({
                "id": cart_item['id'],
                "menu_item": menu_item,
                "quantity": cart_item['quantity']
            })
    
    return result

@api_router.post("/cart/add")
async def add_to_cart(item: CartItemAdd, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    # Check if menu item exists
    menu_item = await db.menu_items.find_one({"id": item.menu_item_id}, {"_id": 0})
    if not menu_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Check if item already in cart
    existing_item = await db.cart_items.find_one({
        "user_id": user_id,
        "menu_item_id": item.menu_item_id
    }, {"_id": 0})
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item['quantity'] + item.quantity
        await db.cart_items.update_one(
            {"id": existing_item['id']},
            {"$set": {"quantity": new_quantity}}
        )
        return {"message": "Cart updated", "cart_item_id": existing_item['id']}
    else:
        # Add new item
        cart_item = CartItem(
            user_id=user_id,
            menu_item_id=item.menu_item_id,
            quantity=item.quantity
        )
        cart_doc = cart_item.model_dump()
        cart_doc['added_at'] = cart_doc['added_at'].isoformat()
        await db.cart_items.insert_one(cart_doc)
        return {"message": "Item added to cart", "cart_item_id": cart_item.id}

@api_router.put("/cart/update/{cart_item_id}")
async def update_cart_item(cart_item_id: str, quantity: int, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
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
async def remove_from_cart(cart_item_id: str, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    result = await db.cart_items.delete_one({"id": cart_item_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    await db.cart_items.delete_many({"user_id": user_id})
    return {"message": "Cart cleared"}


# ==================== ORDER ROUTES ====================

@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    # Create order
    order = Order(
        user_id=user_id,
        items=order_data.items,
        total_amount=order_data.total_amount,
        delivery_address=order_data.delivery_address,
        status="pending",
        payment_status="pending"
    )
    
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    order_doc['updated_at'] = order_doc['updated_at'].isoformat()
    
    await db.orders.insert_one(order_doc)
    
    return {"order_id": order.id, "message": "Order created successfully"}

@api_router.get("/orders")
async def get_orders(authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    orders = await db.orders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    order = await db.orders.find_one(
        {"id": order_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/checkout")
async def create_checkout_session(
    checkout_data: CheckoutRequest,
    request: Request,
    authorization: str = Header(None)
):
    user_data = get_current_user(authorization)
    user_id = user_data['user_id']
    
    # Get order details
    order = await db.orders.find_one({"id": checkout_data.order_id, "user_id": user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['payment_status'] == 'paid':
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Initialize Stripe checkout
    host_url = checkout_data.origin_url
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{host_url}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(order['total_amount']),
        currency="inr",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": checkout_data.order_id,
            "user_id": user_id
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    payment_transaction = PaymentTransaction(
        session_id=session.session_id,
        user_id=user_id,
        order_id=checkout_data.order_id,
        amount=order['total_amount'],
        currency="inr",
        status="initiated",
        payment_status="pending",
        metadata={"order_id": checkout_data.order_id}
    )
    
    payment_doc = payment_transaction.model_dump()
    payment_doc['created_at'] = payment_doc['created_at'].isoformat()
    payment_doc['updated_at'] = payment_doc['updated_at'].isoformat()
    
    await db.payment_transactions.insert_one(payment_doc)
    
    # Update order with payment session ID
    await db.orders.update_one(
        {"id": checkout_data.order_id},
        {"$set": {"payment_session_id": session.session_id}}
    )
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, authorization: str = Header(None)):
    user_data = get_current_user(authorization)
    
    # Check if already processed
    payment = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment session not found")
    
    # If already completed, return cached status
    if payment['payment_status'] == 'paid':
        return {
            "status": "completed",
            "payment_status": "paid",
            "order_id": payment.get('order_id')
        }
    
    # Poll Stripe for status
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment transaction
    update_data = {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )
    
    # Update order status if paid
    if checkout_status.payment_status == 'paid' and payment['payment_status'] != 'paid':
        order_id = payment.get('order_id')
        if order_id:
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "confirmed",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Clear user's cart
            await db.cart_items.delete_many({"user_id": payment['user_id']})
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "order_id": payment.get('order_id')
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        logger.info(f"Webhook event: {webhook_response.event_type}, Session: {webhook_response.session_id}")
        
        # Update payment transaction
        if webhook_response.payment_status:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ==================== ROOT ROUTE ====================

@api_router.get("/")
async def root():
    return {"message": "Desi Food Kart API", "status": "running"}


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
