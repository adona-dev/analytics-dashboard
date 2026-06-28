from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from datetime import date

from database import get_db
import models
from schemas import SaleCreate, SaleUpdate, SaleResponse, PaginatedSalesResponse
from utils.security import get_current_user
from services.csv_service import import_sales_from_csv

router = APIRouter(prefix="/sales", tags=["Sales Management"])

@router.get("", response_model=PaginatedSalesResponse)
def get_sales(
    page: int = 1,
    size: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "date",
    sort_dir: str = "desc",
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Sale)\
              .join(models.Customer, models.Sale.customer_id == models.Customer.id)\
              .join(models.Product, models.Sale.product_id == models.Product.id)\
              .join(models.Category, models.Product.category_id == models.Category.id)

    # Apply search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Customer.name.ilike(search_filter),
                models.Customer.email.ilike(search_filter),
                models.Product.name.ilike(search_filter),
                models.Category.name.ilike(search_filter),
                models.Sale.status.ilike(search_filter)
            )
        )

    # Apply filters
    if category and category != "All":
        query = query.filter(models.Category.name == category)
        
    if status and status != "All":
        query = query.filter(models.Sale.status == status)

    # Map sorting
    sort_mapping = {
        "date": models.Sale.date,
        "quantity": models.Sale.quantity,
        "price": models.Sale.price,
        "customer": models.Customer.name,
        "product": models.Product.name,
        "category": models.Category.name,
        "status": models.Sale.status,
        "total": (models.Sale.quantity * models.Sale.price)
    }

    sort_col = sort_mapping.get(sort_by, models.Sale.date)
    
    if sort_dir == "desc":
        query = query.order_by(sort_col.desc(), models.Sale.id.desc())
    else:
        query = query.order_by(sort_col.asc(), models.Sale.id.asc())

    total = query.count()
    pages = (total + size - 1) // size if total > 0 else 0

    offset = (page - 1) * size
    sales = query.offset(offset).limit(size).all()

    items = []
    for s in sales:
        items.append({
            "id": s.id,
            "customer_id": s.customer_id,
            "customer_name": s.customer.name,
            "customer_email": s.customer.email,
            "product_id": s.product_id,
            "product_name": s.product.name,
            "category_id": s.product.category_id,
            "category_name": s.product.category.name,
            "quantity": s.quantity,
            "price": float(s.price),
            "date": s.date,
            "status": s.status
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

@router.post("", response_model=SaleResponse)
def create_sale(
    payload: SaleCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Resolve Category
        category = db.query(models.Category).filter(models.Category.name.ilike(payload.category_name)).first()
        if not category:
            category = models.Category(name=payload.category_name)
            db.add(category)
            db.flush()

        # 2. Resolve Product
        product = db.query(models.Product).filter(
            models.Product.name.ilike(payload.product_name),
            models.Product.category_id == category.id
        ).first()
        if not product:
            product = models.Product(name=payload.product_name, price=payload.price, category_id=category.id)
            db.add(product)
            db.flush()
        
        # 3. Resolve Customer
        customer = db.query(models.Customer).filter(models.Customer.email.ilike(payload.customer_email)).first()
        if not customer:
            customer = models.Customer(name=payload.customer_name, email=payload.customer_email)
            db.add(customer)
            db.flush()
        elif customer.name != payload.customer_name:
            customer.name = payload.customer_name  # Update name if changed
            db.add(customer)
            db.flush()

        # 4. Create Sale
        sale = models.Sale(
            customer_id=customer.id,
            product_id=product.id,
            quantity=payload.quantity,
            price=payload.price,
            date=payload.date,
            status=payload.status
        )
        db.add(sale)
        db.commit()
        db.refresh(sale)

        return {
            "id": sale.id,
            "customer_id": sale.customer_id,
            "customer_name": customer.name,
            "customer_email": customer.email,
            "product_id": sale.product_id,
            "product_name": product.name,
            "category_id": product.category_id,
            "category_name": category.name,
            "quantity": sale.quantity,
            "price": float(sale.price),
            "date": sale.date,
            "status": sale.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    payload: SaleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")

    try:
        # Resolve customer if provided
        if payload.customer_name is not None or payload.customer_email is not None:
            email = payload.customer_email or sale.customer.email
            name = payload.customer_name or sale.customer.name
            
            customer = db.query(models.Customer).filter(models.Customer.email.ilike(email)).first()
            if not customer:
                customer = models.Customer(name=name, email=email)
                db.add(customer)
                db.flush()
            else:
                if payload.customer_name:
                    customer.name = payload.customer_name
                    db.add(customer)
                    db.flush()
            sale.customer_id = customer.id

        # Resolve category and product if provided
        if payload.product_name is not None or payload.category_name is not None:
            cat_name = payload.category_name or sale.product.category.name
            prod_name = payload.product_name or sale.product.name
            prod_price = payload.price or float(sale.price)
            
            category = db.query(models.Category).filter(models.Category.name.ilike(cat_name)).first()
            if not category:
                category = models.Category(name=cat_name)
                db.add(category)
                db.flush()
                
            product = db.query(models.Product).filter(
                models.Product.name.ilike(prod_name),
                models.Product.category_id == category.id
            ).first()
            if not product:
                product = models.Product(name=prod_name, price=prod_price, category_id=category.id)
                db.add(product)
                db.flush()
            sale.product_id = product.id

        # Update core sale properties
        if payload.quantity is not None:
            sale.quantity = payload.quantity
        if payload.price is not None:
            sale.price = payload.price
        if payload.date is not None:
            sale.date = payload.date
        if payload.status is not None:
            sale.status = payload.status

        db.add(sale)
        db.commit()
        db.refresh(sale)

        return {
            "id": sale.id,
            "customer_id": sale.customer_id,
            "customer_name": sale.customer.name,
            "customer_email": sale.customer.email,
            "product_id": sale.product_id,
            "product_name": sale.product.name,
            "category_id": sale.product.category_id,
            "category_name": sale.product.category.name,
            "quantity": sale.quantity,
            "price": float(sale.price),
            "date": sale.date,
            "status": sale.status
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{sale_id}")
def delete_sale(
    sale_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")
        
    try:
        db.delete(sale)
        db.commit()
        return {"message": f"Successfully deleted sale record with ID {sale_id}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload")
def upload_csv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
        
    try:
        content = file.file.read().decode("utf-8")
        sales_created = import_sales_from_csv(db, content)
        return {"message": f"Successfully imported {sales_created} sales records"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV import failed: {str(e)}")
