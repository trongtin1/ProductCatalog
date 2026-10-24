from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.base import QueryResource


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, description="Category name cannot be empty")
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Category name cannot be empty or whitespace only")
        return stripped


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Category name cannot be empty or whitespace only")
            return stripped
        return v


class CategoryQueryResource(QueryResource):
    name: Optional[str] = Field(default=None, description="Category name to search")
    description: Optional[str] = Field(default=None, description="Category description to search")


class CategoryInDBBase(CategoryBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Category(CategoryInDBBase):
    pass