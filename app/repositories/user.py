from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def find_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def create(self, username: str, hashed_password: str, is_admin: bool = False) -> User:
        user = User(username=username, hashed_password=hashed_password, is_admin=is_admin)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

