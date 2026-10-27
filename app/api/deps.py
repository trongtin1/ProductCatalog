from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.repositories.category import CategoryRepository
from app.repositories.product import ProductRepository
from app.repositories.user import UserRepository
from app.services.category import CategoryService
from app.services.product import ProductService
from app.core.security import decode_access_token

_bearer = HTTPBearer(auto_error=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_category_repository(db: Session = Depends(get_db)) -> CategoryRepository:
    return CategoryRepository(db)


def get_product_repository(db: Session = Depends(get_db)) -> ProductRepository:
    return ProductRepository(db)


def get_category_service(
    category_repo: CategoryRepository = Depends(get_category_repository),
) -> CategoryService:
    return CategoryService(category_repo)


def get_product_service(
    product_repo: ProductRepository = Depends(get_product_repository),
    category_repo: CategoryRepository = Depends(get_category_repository),
) -> ProductService:
    return ProductService(product_repo, category_repo)


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> str:
    """Dependency that validates JWT and ensures the user is an admin."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu đăng nhập để thực hiện thao tác này",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username = decode_access_token(credentials.credentials)
    user_repo = UserRepository(db)
    user = user_repo.find_by_username(username)
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền thực hiện thao tác này",
        )
    return username
