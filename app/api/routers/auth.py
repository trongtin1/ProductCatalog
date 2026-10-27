from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin
from app.repositories.user import UserRepository
from app.services.auth import AuthService
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile
from app.schemas.base import Result
from app.core.limiter import limiter

router = APIRouter()


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, service: AuthService = Depends(get_auth_service)):
    """Login and receive a JWT access token. Rate-limited to 10 attempts/minute per IP."""
    return service.login(data)


@router.get("/me", response_model=Result[UserProfile])
@limiter.limit("120/minute")
def get_current_user_profile(
    request: Request,
    current_username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    user = UserRepository(db).find_by_username(current_username)
    return Result.success(UserProfile(username=user.username, is_admin=user.is_admin))

