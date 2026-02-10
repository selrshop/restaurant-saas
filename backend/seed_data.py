import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_saas_platform():
    print("Starting SaaS platform seeding...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.restaurants.delete_many({})
    await db.categories.delete_many({})
    await db.menu_items.delete_many({})
    await db.orders.delete_many({})
    await db.cart_items.delete_many({})
    
    print("Cleared existing data")
    
    # Create users
    hashed_password = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    users = [
        {
            "id": "user-admin-1",
            "email": "admin@restaurantsaas.com",
            "password": hashed_password,
            "name": "Super Admin",
            "phone": "9999999999",
            "role": "super_admin",
            "addresses": [],
            "created_at": "2024-01-01T00:00:00"
        },
        {
            "id": "user-owner-1",
            "email": "owner1@desifoodkart.com",
            "password": hashed_password,
            "name": "Rajesh Kumar",
            "phone": "9876543210",
            "role": "restaurant_owner",
            "restaurant_id": "restaurant-1",
            "addresses": [],
            "created_at": "2024-01-05T00:00:00"
        },
        {
            "id": "user-owner-2",
            "email": "owner2@spicydelights.com",
            "password": hashed_password,
            "name": "Priya Sharma",
            "phone": "9876543211",
            "role": "restaurant_owner",
            "restaurant_id": "restaurant-2",
            "addresses": [],
            "created_at": "2024-01-10T00:00:00"
        },
        {
            "id": "user-customer-1",
            "email": "customer@example.com",
            "password": hashed_password,
            "name": "Amit Patel",
            "phone": "9988776655",
            "role": "customer",
            "addresses": ["123 Main Street, Mumbai, Maharashtra"],
            "created_at": "2024-02-01T00:00:00"
        }
    ]
    
    await db.users.insert_many(users)
    print(f"Created {len(users)} users (admin@restaurantsaas.com, owner1@desifoodkart.com, owner2@spicydelights.com, customer@example.com - all password: password123)")
    
    # Create restaurants
    restaurants = [
        {
            "id": "restaurant-1",
            "owner_id": "user-owner-1",
            "name": "Desi Food Kart",
            "slug": "desi-food-kart",
            "subdomain": "desifood",
            "description": "Authentic North Indian cuisine with a modern twist",
            "cuisine_types": ["North Indian", "Punjabi", "Tandoori"],
            "address": "456 Food Street, Delhi",
            "phone": "011-12345678",
            "logo": "https://images.pexels.com/photos/9266190/pexels-photo-9266190.jpeg",
            "cover_image": "https://images.pexels.com/photos/9266190/pexels-photo-9266190.jpeg",
            "status": "active",
            "subscription_plan": "premium",
            "commission_rate": 10.0,
            "created_at": "2024-01-05T00:00:00",
            "updated_at": "2024-01-05T00:00:00"
        },
        {
            "id": "restaurant-2",
            "owner_id": "user-owner-2",
            "name": "Spicy Delights",
            "slug": "spicy-delights",
            "subdomain": "spicy",
            "description": "Fiery South Indian flavors that tantalize your taste buds",
            "cuisine_types": ["South Indian", "Chettinad", "Kerala"],
            "address": "789 Spice Lane, Chennai",
            "phone": "044-98765432",
            "logo": "https://images.pexels.com/photos/8753657/pexels-photo-8753657.jpeg",
            "cover_image": "https://images.pexels.com/photos/8753657/pexels-photo-8753657.jpeg",
            "status": "active",
            "subscription_plan": "basic",
            "commission_rate": 12.0,
            "created_at": "2024-01-10T00:00:00",
            "updated_at": "2024-01-10T00:00:00"
        }
    ]
    
    await db.restaurants.insert_many(restaurants)
    print(f"Created {len(restaurants)} restaurants")
    
    # Categories for Restaurant 1 (Desi Food Kart)
    categories_r1 = [
        {
            "id": "cat-r1-1",
            "restaurant_id": "restaurant-1",
            "name": "Biryani & Rice",
            "description": "Aromatic rice dishes",
            "image": "https://images.pexels.com/photos/12737799/pexels-photo-12737799.jpeg",
            "order": 1
        },
        {
            "id": "cat-r1-2",
            "restaurant_id": "restaurant-1",
            "name": "Curries",
            "description": "Rich and flavorful",
            "image": "https://images.pexels.com/photos/9266190/pexels-photo-9266190.jpeg",
            "order": 2
        },
        {
            "id": "cat-r1-3",
            "restaurant_id": "restaurant-1",
            "name": "Tandoori",
            "description": "Grilled perfection",
            "image": "https://images.pexels.com/photos/9027521/pexels-photo-9027521.jpeg",
            "order": 3
        }
    ]
    
    # Categories for Restaurant 2 (Spicy Delights)
    categories_r2 = [
        {
            "id": "cat-r2-1",
            "restaurant_id": "restaurant-2",
            "name": "Dosas",
            "description": "Crispy South Indian crepes",
            "image": "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg",
            "order": 1
        },
        {
            "id": "cat-r2-2",
            "restaurant_id": "restaurant-2",
            "name": "Curries",
            "description": "Spicy gravies",
            "image": "https://images.pexels.com/photos/8753657/pexels-photo-8753657.jpeg",
            "order": 2
        }
    ]
    
    all_categories = categories_r1 + categories_r2
    await db.categories.insert_many(all_categories)
    print(f"Created {len(all_categories)} categories")
    
    # Menu items for Restaurant 1 with variants
    menu_items_r1 = [
        {
            "id": "item-r1-1",
            "restaurant_id": "restaurant-1",
            "name": "Chicken Biryani",
            "description": "Fragrant basmati rice with tender chicken",
            "category_id": "cat-r1-1",
            "category_name": "Biryani & Rice",
            "image": "https://images.pexels.com/photos/12737799/pexels-photo-12737799.jpeg",
            "is_veg": False,
            "spice_level": 2,
            "variants": [
                {"name": "Half", "price": 199.0, "available": True},
                {"name": "Full", "price": 349.0, "available": True},
                {"name": "Family Pack", "price": 649.0, "available": True}
            ],
            "is_available": True,
            "rating": 4.7,
            "prep_time": 30,
            "created_at": "2024-01-06T00:00:00"
        },
        {
            "id": "item-r1-2",
            "restaurant_id": "restaurant-1",
            "name": "Paneer Butter Masala",
            "description": "Cottage cheese in rich tomato gravy",
            "category_id": "cat-r1-2",
            "category_name": "Curries",
            "image": "https://images.pexels.com/photos/11118336/pexels-photo-11118336.jpeg",
            "is_veg": True,
            "spice_level": 1,
            "variants": [
                {"name": "Half", "price": 179.0, "available": True},
                {"name": "Full", "price": 299.0, "available": True}
            ],
            "is_available": True,
            "rating": 4.8,
            "prep_time": 20,
            "created_at": "2024-01-06T00:00:00"
        },
        {
            "id": "item-r1-3",
            "restaurant_id": "restaurant-1",
            "name": "Tandoori Chicken",
            "description": "Marinated chicken grilled in tandoor",
            "category_id": "cat-r1-3",
            "category_name": "Tandoori",
            "image": "https://images.pexels.com/photos/9027521/pexels-photo-9027521.jpeg",
            "is_veg": False,
            "spice_level": 3,
            "variants": [
                {"name": "Quarter", "price": 149.0, "available": True},
                {"name": "Half", "price": 279.0, "available": True},
                {"name": "Full", "price": 499.0, "available": True}
            ],
            "is_available": True,
            "rating": 4.9,
            "prep_time": 25,
            "created_at": "2024-01-06T00:00:00"
        }
    ]
    
    # Menu items for Restaurant 2 with variants
    menu_items_r2 = [
        {
            "id": "item-r2-1",
            "restaurant_id": "restaurant-2",
            "name": "Masala Dosa",
            "description": "Crispy crepe with spiced potato filling",
            "category_id": "cat-r2-1",
            "category_name": "Dosas",
            "image": "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg",
            "is_veg": True,
            "spice_level": 2,
            "variants": [
                {"name": "Single", "price": 89.0, "available": True},
                {"name": "Double", "price": 159.0, "available": True}
            ],
            "is_available": True,
            "rating": 4.6,
            "prep_time": 15,
            "created_at": "2024-01-11T00:00:00"
        },
        {
            "id": "item-r2-2",
            "restaurant_id": "restaurant-2",
            "name": "Chettinad Chicken Curry",
            "description": "Fiery chicken curry with aromatic spices",
            "category_id": "cat-r2-2",
            "category_name": "Curries",
            "image": "https://images.pexels.com/photos/8753657/pexels-photo-8753657.jpeg",
            "is_veg": False,
            "spice_level": 4,
            "variants": [
                {"name": "Half", "price": 219.0, "available": True},
                {"name": "Full", "price": 389.0, "available": True}
            ],
            "is_available": True,
            "rating": 4.8,
            "prep_time": 25,
            "created_at": "2024-01-11T00:00:00"
        }
    ]
    
    all_menu_items = menu_items_r1 + menu_items_r2
    await db.menu_items.insert_many(all_menu_items)
    print(f"Created {len(all_menu_items)} menu items with variants")
    
    print("\n=== SaaS Platform Seeding Complete ===")
    print("\nTest Credentials:")
    print("Super Admin: admin@restaurantsaas.com / password123")
    print("Restaurant Owner 1: owner1@desifoodkart.com / password123")
    print("Restaurant Owner 2: owner2@spicydelights.com / password123")
    print("Customer: customer@example.com / password123")
    print("\nRestaurants:")
    print("1. Desi Food Kart (slug: desi-food-kart)")
    print("2. Spicy Delights (slug: spicy-delights)")

if __name__ == "__main__":
    asyncio.run(seed_saas_platform())
    client.close()
