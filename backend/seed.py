import random
from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Category, Product, Customer, Sale
from utils.security import get_password_hash

# Set random seed for consistency
random.seed(42)

CATEGORIES_DATA = {
    "Electronics": [
        ("Laptop Pro 15", 1299.99),
        ("Smartphone Neo", 799.99),
        ("Noise-Cancelling Headphones", 249.99),
        ("Smart Watch Series 5", 199.99),
        ("Wireless Charger Pad", 39.99),
        ("Ultra-Wide Monitor 34", 449.99)
    ],
    "Clothing": [
        ("Classic Denim Jacket", 89.99),
        ("Cotton Slim-Fit Chinos", 49.99),
        ("Performance Running Shoes", 119.99),
        ("Minimalist Leather Boots", 159.99),
        ("Organic Cotton Hoodie", 59.99),
        ("Graphic Tee Set", 29.99)
    ],
    "Home & Kitchen": [
        ("Stainless Steel Air Fryer", 119.99),
        ("Single-Serve Coffee Maker", 89.99),
        ("Robot Vacuum Cleaner", 249.99),
        ("Professional Blender", 149.99),
        ("Non-Stick Ceramic Pan Set", 129.99),
        ("Electric Gooseneck Kettle", 69.99)
    ],
    "Sports & Outdoors": [
        ("High-Density Yoga Mat", 29.99),
        ("Adjustable Dumbbells (Pair)", 199.99),
        ("Double-Wall Water Bottle", 19.99),
        ("Waterproof Camping Tent", 149.99),
        ("Ergonomic Backpack 40L", 79.99),
        ("GPS Cycling Computer", 179.99)
    ],
    "Books & Media": [
        ("The AI Revolution", 24.99),
        ("Secrets of the Chef", 29.99),
        ("Mastering Code & Design", 39.99),
        ("History of the Future", 19.99),
        ("SaaS Operations Playbook", 34.99),
        ("A Guide to Productivity", 14.99)
    ]
}

CUSTOMERS_DATA = [
    ("Alice Smith", "alice.smith@gmail.com"),
    ("Bob Johnson", "bob.johnson@yahoo.com"),
    ("Charlie Brown", "charlie.brown@hotmail.com"),
    ("David Miller", "david.miller@gmail.com"),
    ("Emma Wilson", "emma.wilson@icloud.com"),
    ("Frank Thomas", "frank.thomas@gmail.com"),
    ("Grace Davis", "grace.davis@gmail.com"),
    ("Henry Martinez", "henry.martinez@outlook.com"),
    ("Isabella Garcia", "isabella.garcia@gmail.com"),
    ("Jack Robinson", "jack.robinson@yahoo.com"),
    ("Kate Thompson", "kate.thompson@gmail.com"),
    ("Liam Anderson", "liam.anderson@gmail.com"),
    ("Mia Taylor", "mia.taylor@live.com"),
    ("Noah Thomas", "noah.thomas@gmail.com"),
    ("Olivia White", "olivia.white@gmail.com"),
    ("Peter Harris", "peter.harris@outlook.com"),
    ("Quinn Clark", "quinn.clark@gmail.com"),
    ("Ryan Lewis", "ryan.lewis@gmail.com"),
    ("Sophia Walker", "sophia.walker@gmail.com"),
    ("Thomas Hall", "thomas.hall@yahoo.com"),
    ("Ursula Young", "ursula.young@gmail.com"),
    ("Victor Allen", "victor.allen@gmail.com"),
    ("Wendy Wright", "wendy.wright@gmail.com"),
    ("Xavier King", "xavier.king@gmail.com"),
    ("Yvonne Scott", "yvonne.scott@gmail.com"),
    ("Zachary Green", "zachary.green@gmail.com")
]

def seed_database(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

    # 1. Seed Default User if not exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        hashed_pw = get_password_hash("admin123")
        admin = User(username="admin", email="admin@analytics.com", hashed_password=hashed_pw)
        db.add(admin)
        db.commit()
        print("Admin user seeded: admin / admin123")

    # Check if database has already been seeded with sales
    if db.query(Sale).count() > 0:
        print("Database already seeded with sales records.")
        return

    print("Seeding database...")

    # 2. Seed Categories and Products
    categories_dict = {}
    products_list = []

    for cat_name, products in CATEGORIES_DATA.items():
        category = db.query(Category).filter(Category.name == cat_name).first()
        if not category:
            category = Category(name=cat_name)
            db.add(category)
            db.commit()
            db.refresh(category)
        categories_dict[cat_name] = category.id

        for prod_name, price in products:
            product = db.query(Product).filter(Product.name == prod_name).first()
            if not product:
                product = Product(name=prod_name, price=price, category_id=category.id)
                db.add(product)
                db.commit()
                db.refresh(product)
            products_list.append(product)

    # 3. Seed Customers
    customers_list = []
    for name, email in CUSTOMERS_DATA:
        customer = db.query(Customer).filter(Customer.email == email).first()
        if not customer:
            customer = Customer(name=name, email=email)
            db.add(customer)
            db.commit()
            db.refresh(customer)
        customers_list.append(customer)

    # 4. Seed Sales
    # We will generate sales distributed over the last 365 days.
    # To create a realistic "growth" trend, we increase the probability of sales and average order quantities as we approach today.
    today = date.today()
    start_date = today - timedelta(days=365)
    
    sales_created = 0
    statuses = ["Completed", "Completed", "Completed", "Completed", "Pending", "Cancelled"]  # 66% Comp, 16% Pend, 16% Canc

    for i in range(500):
        # Weighted random date generation to simulate business growth
        # We use a power distribution to weight dates closer to today
        ratio = (i / 500) ** 1.5  # higher density near the end
        days_to_add = int(ratio * 365)
        sale_date = start_date + timedelta(days=days_to_add)

        # Pick random customer and product
        customer = random.choice(customers_list)
        product = random.choice(products_list)
        
        # Quantity random choice
        quantity = random.choice([1, 1, 1, 2, 2, 3, 4, 5])
        
        # Status
        status = random.choice(statuses)
        
        # Add price fluctuation (+/- 5%) to represent discounts/coupons
        price_modifier = random.uniform(0.95, 1.05)
        sale_price = round(float(product.price) * price_modifier, 2)

        sale = Sale(
            customer_id=customer.id,
            product_id=product.id,
            quantity=quantity,
            price=sale_price,
            date=sale_date,
            status=status
        )
        db.add(sale)
        sales_created += 1

    db.commit()
    print(f"Successfully seeded {sales_created} sales records!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
