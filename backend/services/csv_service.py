import csv
from io import StringIO
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException
import models

def parse_date(date_str: str) -> date:
    formats = [
        "%Y-%m-%d", 
        "%m/%d/%Y", 
        "%d/%m/%Y", 
        "%Y/%m/%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%fZ"
    ]
    cleaned = date_str.strip()
    # Try formatting
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            pass
    # Try iso format
    try:
        return date.fromisoformat(cleaned[:10])
    except ValueError:
        raise ValueError(f"Could not parse date '{date_str}'")

def import_sales_from_csv(db: Session, csv_content: str) -> int:
    f = StringIO(csv_content)
    reader = csv.reader(f)
    
    # Read headers
    try:
        headers = next(reader)
    except StopIteration:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    
    # Clean headers (strip spaces, lowercase)
    headers = [h.strip().lower().replace("_", " ").replace("order id", "id") for h in headers]
    
    # Map headers to column indices
    required_fields = ["customer name", "customer email", "product name", "category name", "quantity", "price", "date", "status"]
    header_map = {}
    
    for req in required_fields:
        if req not in headers:
            # Let's try matching sub-words or raise error
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required CSV header: '{req.title()}'. Found headers: {', '.join(headers)}"
            )
        header_map[req] = headers.index(req)
        
    sales_created = 0
    row_idx = 1
    
    # Read and validate rows
    for row in reader:
        row_idx += 1
        if not row or all(cell.strip() == "" for cell in row):
            continue  # skip empty lines
            
        try:
            cust_name = row[header_map["customer name"]].strip()
            cust_email = row[header_map["customer email"]].strip()
            prod_name = row[header_map["product name"]].strip()
            cat_name = row[header_map["category name"]].strip()
            qty_str = row[header_map["quantity"]].strip()
            price_str = row[header_map["price"]].strip()
            date_str = row[header_map["date"]].strip()
            status_str = row[header_map["status"]].strip()
            
            # Simple field validation
            if not cust_name or not cust_email or not prod_name or not cat_name or not qty_str or not price_str or not date_str or not status_str:
                raise ValueError("All fields are required")
                
            qty = int(qty_str)
            price = float(price_str)
            sale_date = parse_date(date_str)
            
            # Normalize status
            status_str = status_str.capitalize()
            if status_str not in ["Completed", "Pending", "Cancelled"]:
                raise ValueError(f"Status must be 'Completed', 'Pending', or 'Cancelled'. Got: {status_str}")
                
            # Process Entities
            # 1. Category
            category = db.query(models.Category).filter(models.Category.name.ilike(cat_name)).first()
            if not category:
                category = models.Category(name=cat_name)
                db.add(category)
                db.flush()
                
            # 2. Product
            product = db.query(models.Product).filter(
                models.Product.name.ilike(prod_name),
                models.Product.category_id == category.id
            ).first()
            if not product:
                product = models.Product(name=prod_name, price=price, category_id=category.id)
                db.add(product)
                db.flush()
                
            # 3. Customer
            customer = db.query(models.Customer).filter(models.Customer.email.ilike(cust_email)).first()
            if not customer:
                customer = models.Customer(name=cust_name, email=cust_email)
                db.add(customer)
                db.flush()
                
            # 4. Sale
            sale = models.Sale(
                customer_id=customer.id,
                product_id=product.id,
                quantity=qty,
                price=price,
                date=sale_date,
                status=status_str
            )
            db.add(sale)
            sales_created += 1
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Error in row {row_idx}: {str(e)}"
            )
            
    db.commit()
    return sales_created
