from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.category import Category
from app.schemas.base import QueryResource


class ProductQueryResource(QueryResource):
    category_id: Optional[int] = Field(default=None, description="Filter by category ID")
    min_price: Optional[float] = Field(default=None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(default=None, ge=0, description="Maximum price filter")


class CursorProductQueryResource(BaseModel):
    cursor: Optional[str] = Field(default=None, description="Cursor from the previous cursor request")
    page_size: int = Field(default=10, ge=1, le=100)
    sort_column_by: str = Field(default="id")
    is_sort_column_ascending: bool = Field(default=True)
    search_term: Optional[str] = None
    category_id: Optional[int] = None
    min_price: Optional[float] = Field(default=None, ge=0)
    max_price: Optional[float] = Field(default=None, ge=0)


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, description="Product name cannot be empty")
    description: Optional[str] = None
    price: float = Field(..., gt=0, description="Price must be strictly greater than 0")
    stock: int = Field(0, ge=0, description="Stock must be greater than or equal to 0")
    category_id: int
    image_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Product name cannot be empty or whitespace only")
        return stripped


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    category_id: Optional[int] = None
    image_url: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Product name cannot be empty or whitespace only")
            return stripped
        return v


class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(ProductInDBBase):
    category: Optional[Category] = None


class PaginatedProductsResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CursorPaginatedProductsResponse(BaseModel):
    items: List[ProductResponse]
    page_size: int
    next_cursor: Optional[str] = None
    has_more: bool
