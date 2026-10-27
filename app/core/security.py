import bcrypt
from datetime import datetime, timezone, timedelta
from typing import Optional

from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.core import config

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, config.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """Return username (sub) or raise 401."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[ALGORITHM])
        sub: Optional[str] = payload.get("sub")
        if not sub:
            raise ValueError("Missing sub")
        return sub
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )

