from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import DashboardSummaryResponse, AnalyticsResponse
from services.analytics_service import get_dashboard_summary, get_analytics_details
from utils.security import get_current_user
from models import User

router = APIRouter(tags=["Dashboard & Analytics"])

@router.get("/dashboard", response_model=DashboardSummaryResponse)
def read_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_dashboard_summary(db)

@router.get("/analytics", response_model=AnalyticsResponse)
def read_analytics_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_analytics_details(db)
