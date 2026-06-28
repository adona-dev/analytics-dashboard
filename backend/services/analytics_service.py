from sqlalchemy import func, extract
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict, Any
import models

def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    # 1. Total counts
    # Revenue is sum of Completed sales (or all sales, let's use Completed for actual revenue)
    total_revenue = db.query(func.sum(models.Sale.quantity * models.Sale.price))\
                      .filter(models.Sale.status == "Completed").scalar() or 0.0
    total_revenue = float(total_revenue)
    
    total_orders = db.query(func.count(models.Sale.id))\
                     .filter(models.Sale.status == "Completed").scalar() or 0
                     
    total_customers = db.query(func.count(func.distinct(models.Sale.customer_id))).scalar() or 0
    total_products = db.query(func.count(models.Product.id)).scalar() or 0
    
    # 2. Avg Order Value
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
    
    # 3. Monthly Growth Calculation
    # Let's find the latest sale date in the database to align our "this month" and "prev month" calculations
    latest_sale = db.query(models.Sale).order_by(models.Sale.date.desc()).first()
    
    if latest_sale:
        latest_date = latest_sale.date
        current_year = latest_date.year
        current_month = latest_date.month
        
        # Calculate start and end of current month
        # Previous month:
        if current_month == 1:
            prev_month = 12
            prev_year = current_year - 1
        else:
            prev_month = current_month - 1
            prev_year = current_year
            
        current_month_revenue = db.query(func.sum(models.Sale.quantity * models.Sale.price))\
                                  .filter(
                                      models.Sale.status == "Completed",
                                      extract('year', models.Sale.date) == current_year,
                                      extract('month', models.Sale.date) == current_month
                                  ).scalar() or 0.0
                                  
        prev_month_revenue = db.query(func.sum(models.Sale.quantity * models.Sale.price))\
                               .filter(
                                   models.Sale.status == "Completed",
                                   extract('year', models.Sale.date) == prev_year,
                                   extract('month', models.Sale.date) == prev_month
                               ).scalar() or 0.0
                               
        current_month_revenue = float(current_month_revenue)
        prev_month_revenue = float(prev_month_revenue)
        
        if prev_month_revenue > 0:
            monthly_growth = ((current_month_revenue - prev_month_revenue) / prev_month_revenue) * 100.0
        else:
            monthly_growth = 100.0 if current_month_revenue > 0 else 0.0
    else:
        monthly_growth = 0.0
        
    # 4. Recent Activity (Latest 5 orders)
    recent_sales = db.query(models.Sale)\
                     .order_by(models.Sale.date.desc(), models.Sale.id.desc())\
                     .limit(5).all()
                     
    recent_activity = []
    for s in recent_sales:
        recent_activity.append({
            "id": s.id,
            "customer_name": s.customer.name,
            "product_name": s.product.name,
            "quantity": s.quantity,
            "total_price": float(s.quantity * s.price),
            "date": s.date,
            "status": s.status
        })
        
    # 5. Top Performing Products (Top 5 products by revenue)
    top_prods_query = db.query(
        models.Product.name,
        models.Category.name.label("category_name"),
        func.sum(models.Sale.quantity).label("units_sold"),
        func.sum(models.Sale.quantity * models.Sale.price).label("revenue")
    ).join(models.Sale, models.Sale.product_id == models.Product.id)\
     .join(models.Category, models.Product.category_id == models.Category.id)\
     .filter(models.Sale.status == "Completed")\
     .group_by(models.Product.id, models.Product.name, models.Category.name)\
     .order_by(func.sum(models.Sale.quantity * models.Sale.price).desc())\
     .limit(5).all()
     
    top_products = []
    for row in top_prods_query:
        top_products.append({
            "product_name": row[0],
            "category_name": row[1],
            "units_sold": int(row[2]),
            "revenue": float(row[3])
        })
        
    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "monthly_growth": round(monthly_growth, 1),
        "avg_order_value": round(avg_order_value, 2),
        "recent_activity": recent_activity,
        "top_products": top_products
    }

def get_analytics_details(db: Session) -> Dict[str, Any]:
    # 1. Revenue and Orders By Month (Last 12 Months)
    # We find the latest date in DB
    latest_sale = db.query(models.Sale).order_by(models.Sale.date.desc()).first()
    if latest_sale:
        end_date = latest_sale.date
    else:
        end_date = date.today()
        
    start_date = end_date - timedelta(days=365)
    
    # We group by Month
    monthly_data_query = db.query(
        extract('year', models.Sale.date).label("year"),
        extract('month', models.Sale.date).label("month"),
        func.sum(models.Sale.quantity * models.Sale.price).label("revenue"),
        func.count(models.Sale.id).label("orders")
    ).filter(
        models.Sale.status == "Completed",
        models.Sale.date >= start_date,
        models.Sale.date <= end_date
    ).group_by(
        extract('year', models.Sale.date),
        extract('month', models.Sale.date)
    ).order_by(
        extract('year', models.Sale.date).asc(),
        extract('month', models.Sale.date).asc()
    ).all()
    
    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    revenue_by_month = []
    for row in monthly_data_query:
        y, m, rev, ords = row
        month_label = f"{month_names[int(m)]} {str(int(y))[-2:]}"
        revenue_by_month.append({
            "month": month_label,
            "revenue": float(rev or 0.0),
            "orders": int(ords or 0)
        })
        
    # 2. Category Distribution (Revenue and sale count per Category)
    cat_query = db.query(
        models.Category.name,
        func.sum(models.Sale.quantity * models.Sale.price).label("revenue"),
        func.count(models.Sale.id).label("count")
    ).join(models.Product, models.Product.category_id == models.Category.id)\
     .join(models.Sale, models.Sale.product_id == models.Product.id)\
     .filter(models.Sale.status == "Completed")\
     .group_by(models.Category.id, models.Category.name)\
     .order_by(func.sum(models.Sale.quantity * models.Sale.price).desc()).all()
     
    category_distribution = []
    for name, rev, cnt in cat_query:
        category_distribution.append({
            "category": name,
            "value": float(rev or 0.0),
            "count": int(cnt or 0)
        })
        
    # 3. Status Distribution
    status_query = db.query(
        models.Sale.status,
        func.count(models.Sale.id).label("count")
    ).group_by(models.Sale.status).all()
    
    status_distribution = []
    for stat, cnt in status_query:
        status_distribution.append({
            "status": stat,
            "count": int(cnt or 0)
        })
        
    # 4. Revenue Trends (last 30 days of data to show area chart)
    # We query the last 30 active dates
    trend_query = db.query(
        models.Sale.date,
        func.sum(models.Sale.quantity * models.Sale.price).label("revenue")
    ).filter(
        models.Sale.status == "Completed"
    ).group_by(models.Sale.date)\
     .order_by(models.Sale.date.desc())\
     .limit(30).all()
     
    # Reverse so it flows chronologically
    trend_query.reverse()
    
    revenue_trends = []
    for dt, rev in trend_query:
        revenue_trends.append({
            "date": dt.strftime("%b %d"),
            "revenue": float(rev or 0.0)
        })
        
    # Calculate Average Revenue and overall Growth %
    summary = get_dashboard_summary(db)
    
    return {
        "revenue_by_month": revenue_by_month,
        "category_distribution": category_distribution,
        "status_distribution": status_distribution,
        "revenue_trends": revenue_trends,
        "avg_revenue": summary["avg_order_value"],
        "growth_percent": summary["monthly_growth"]
    }
