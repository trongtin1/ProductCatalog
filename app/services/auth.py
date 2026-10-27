from fastapi import HTTPException, status
from app.repositories.user import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token


class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.user_repo.find_by_username(data.username)

        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tên đăng nhập hoặc mật khẩu không đúng",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản không có quyền truy cập",
            )

        token = create_access_token(subject=user.username)
        return TokenResponse(access_token=token)

