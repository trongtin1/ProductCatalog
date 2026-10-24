from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core import config
from app.api.routers import categories, products

app = FastAPI(
    title=config.PROJECT_NAME,
    description="Product Catalog RESTful API with PostgreSQL, Redis Cache, Pagination, Search and Docker",
    version=config.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{config.API_V1_STR}/openapi.json",
)

# Enable CORS
if config.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Static directory for product images/uploads if needed
static_dir = Path("app/static")
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers under /api/v1
app.include_router(
    products.router,
    prefix=f"{config.API_V1_STR}/products",
    tags=["Products"],
)
app.include_router(
    categories.router,
    prefix=f"{config.API_V1_STR}/categories",
    tags=["Categories"],
)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": config.PROJECT_NAME,
        "version": config.VERSION,
        "docs": "/docs",
    }