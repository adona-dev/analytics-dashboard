from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import List, Optional, Any

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User schemas
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str

class CategoryResponse(CategoryBase):
    id: int
    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    price: float
    category_id: int

class ProductResponse(ProductBase):
    id: int
    category_name: Optional[str] = None
    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    email: str

class CustomerResponse(CustomerBase):
    id: int
    class Config:
        from_attributes = True

# Sale schemas
class SaleCreate(BaseModel):
    customer_name: str
    customer_email: str
    product_name: str
    category_name: str
    quantity: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    date: date
    status: str = Field(..., pattern="^(Completed|Pending|Cancelled)$")

class SaleUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    product_name: Optional[str] = None
    category_name: Optional[str] = None
    quantity: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    date: Optional[date] = None
    status: Optional[str] = Field(None, pattern="^(Completed|Pending|Cancelled)$")

class SaleResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    product_id: int
    product_name: str
    category_id: int
    category_name: str
    quantity: int
    price: float
    date: date
    status: str

    class Config:
        from_attributes = True

# Paginated Sales
class PaginatedSalesResponse(BaseModel):
    items: List[SaleResponse]
    total: int
    page: int
    size: int
    pages: int

# Dashboard and Analytics API response types
class RecentActivity(BaseModel):
    id: int
    customer_name: str
    product_name: str
    quantity: int
    total_price: float
    date: date
    status: str

class TopProduct(BaseModel):
    product_name: str
    category_name: str
    units_sold: int
    revenue: float

class DashboardSummaryResponse(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    monthly_growth: float
    avg_order_value: float
    recent_activity: List[RecentActivity]
    top_products: List[TopProduct]

class RevenueByMonth(BaseModel):
    month: str
    revenue: float
    orders: int

class CategoryDistribution(BaseModel):
    category: str
    value: float
    count: int

class StatusDistribution(BaseModel):
    status: str
    count: int

class RevenueTrend(BaseModel):
    date: str
    revenue: float

class AnalyticsResponse(BaseModel):
    revenue_by_month: List[RevenueByMonth]
    category_distribution: List[CategoryDistribution]
    status_distribution: List[StatusDistribution]
    revenue_trends: List[RevenueTrend]
    avg_revenue: float
    growth_percent: float
