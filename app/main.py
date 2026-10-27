from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path
from slowapi.errors import RateLimitExceeded

from app.core import config
from app.core.limiter import limiter
from app.core.security import hash_password
from app.api.routers import categories, products, auth
from app.db.session import SessionLocal
from app.repositories.user import UserRepository


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: seed default admin user on startup."""
    try:
        db = SessionLocal()
        try:
            repo = UserRepository(db)
            if not repo.find_by_username(config.ADMIN_USERNAME):
                repo.create(
                    username=config.ADMIN_USERNAME,
                    hashed_password=hash_password(config.ADMIN_PASSWORD),
                    is_admin=True,
                )
        finally:
            db.close()
    except Exception:
        # DB may not be ready during migrations or test setup
        pass
    yield


app = FastAPI(
    title=config.PROJECT_NAME,
    description="Product Catalog RESTful API with PostgreSQL, Redis Cache, Pagination, Search and Docker",
    version=config.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{config.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={
            "status_code": 429,
            "is_success": False,
            "message": f"Quá nhiều yêu cầu ({exc.detail}). Vui lòng thử lại sau.",
            "data": None,
        },
    )


# SlowAPI rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

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
    auth.router,
    prefix=f"{config.API_V1_STR}/auth",
    tags=["Auth"],
)
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
