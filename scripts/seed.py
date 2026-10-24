"""
Seed script to populate database with >= 100 realistic products and categories.
Run with: uv run python scripts/seed.py
"""
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import random
from app.db.session import SessionLocal, engine
from app.models.category import Category
from app.models.product import Product
from app.db.base import Base

CATEGORIES_DATA = [
    {"name": "Electronics", "description": "Laptops, phones, audio, and accessories"},
    {"name": "Home & Kitchen", "description": "Appliances, cookware, and home essentials"},
    {"name": "Clothing & Apparel", "description": "Men, women, and kids fashion"},
    {"name": "Sports & Outdoors", "description": "Fitness equipment, camping gear, and activewear"},
    {"name": "Books & Stationery", "description": "Novels, textbooks, notebooks, and office supplies"},
    {"name": "Beauty & Personal Care", "description": "Skincare, haircare, and personal grooming"},
]

ADJECTIVES = [
    "Ultra", "Pro", "Smart", "Eco", "Premium", "Compact", "Wireless",
    "Portable", "Durable", "Ergonomic", "Modern", "Classic", "Deluxe",
    "Heavy-Duty", "Lightweight", "Waterproof"
]

NOUNS = [
    ("Headphones", "High-fidelity audio device with noise cancellation"),
    ("Smartwatch", "Tracks heart rate, sleep, steps and notifications"),
    ("Backpack", "Spacious water-resistant backpack for work and travel"),
    ("Coffee Maker", "Automatic drip coffee maker with programmable timer"),
    ("Mechanical Keyboard", "RGB backlit tactile mechanical keyboard for gaming and typing"),
    ("Gaming Mouse", "High-DPI precision optical gaming mouse"),
    ("Yoga Mat", "Non-slip eco-friendly cushioned workout mat"),
    ("Desk Lamp", "LED adjustable brightness eye-care desk lamp"),
    ("Blender", "High-speed countertop smoothie and soup blender"),
    ("Running Shoes", "Breathable lightweight athletic sneakers"),
    ("Stainless Water Bottle", "Insulated vacuum bottle keeps drinks cold for 24h"),
    ("Bluetooth Speaker", "Powerful 360-degree bass portable outdoor speaker"),
    ("Air Purifier", "True HEPA filtration system for home and office"),
    ("Standing Desk", "Height adjustable electric motorized work desk"),
    ("Office Chair", "Mesh ergonomic chair with lumbar support"),
    ("Cookware Set", "Non-stick pots and pans set for everyday cooking"),
    ("Electric Toothbrush", "Sonic cleaning technology with replacement brush heads"),
    ("Wireless Charger", "Fast inductive charging pad for smartphones"),
]


def seed_data(count: int = 120):
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Create Categories if not exist
        print("Seeding categories...")
        cat_map = {}
        for cat_info in CATEGORIES_DATA:
            cat = db.query(Category).filter(Category.name == cat_info["name"]).first()
            if not cat:
                cat = Category(name=cat_info["name"], description=cat_info["description"])
                db.add(cat)
                db.commit()
                db.refresh(cat)
            cat_map[cat.name] = cat.id

        category_ids = list(cat_map.values())

        # 2. Check existing products count
        current_count = db.query(Product).count()
        print(f"Current product count: {current_count}")

        needed = max(0, count - current_count)
        if needed == 0:
            print(f"Database already contains {current_count} products (>= {count}).")
            return

        print(f"Adding {needed} new products to reach >= {count}...")
        for i in range(needed):
            adj = random.choice(ADJECTIVES)
            noun, base_desc = random.choice(NOUNS)
            product_name = f"{adj} {noun} #{current_count + i + 1}"
            price = round(random.uniform(9.99, 1299.99), 2)
            stock = random.randint(5, 500)
            category_id = random.choice(category_ids)
            image_url = f"https://picsum.photos/seed/product_{current_count + i + 1}/400/400"
            description = f"{base_desc}. Designed with premium materials for maximum durability."

            product = Product(
                name=product_name,
                description=description,
                price=price,
                stock=stock,
                category_id=category_id,
                image_url=image_url,
            )
            db.add(product)

        db.commit()
        total_after = db.query(Product).count()
        print(f"Successfully seeded! Total products in database: {total_after}")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data(count=120)
