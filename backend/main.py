from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database import engine, Base, SessionLocal
from config import settings
from seed import seed_database
from routers import auth, sales, dashboard
# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Database...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {str(e)}")
        
    if settings.SEED_DEMO_DATA:
        logger.info("Seeding database...")
        db = SessionLocal()
        try:
            seed_database(db)
            logger.info("Database seeding completed.")
        except Exception as e:
            logger.error(f"Error seeding database: {str(e)}")
        finally:
            db.close()
            
    yield
    logger.info("Shutting down Analytics Dashboard API...")

app = FastAPI(
    title="Analytics Dashboard API",
    description="SaaS Analytics Dashboard APIs for Sales, Category, and Revenue Tracking",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://analytics-dashboard-lime-pi.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "app": "Analytics Dashboard API",
        "status": "healthy",
        "docs_url": "/docs"
    }
