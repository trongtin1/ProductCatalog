from typing import Optional, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from fastapi import status

T = TypeVar("T")


class QueryResource(BaseModel):
    cursor: Optional[str] = Field(
        default=None,
        description="Opaque cursor returned by the previous request",
    )
    page_size: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of items to return",
    )
    sort_column_by: str = Field(default="id", description="Column name to sort by")
    is_sort_column_ascending: bool = Field(default=True, description="True for ascending, False for descending")
    search_term: Optional[str] = Field(default=None, description="Search keyword")

    model_config = ConfigDict(extra="ignore")


class Result(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    status_code: int
    is_success: bool
    message: str 
    data: Optional[T] = None

    @classmethod
    def success(
        cls,
        data: Optional[T] = None,
        message: str = "Success",
        status_code: int = status.HTTP_200_OK,
    ) -> "Result[T]":
        return cls(
            status_code=status_code,
            is_success=True,
            message=message,
            data=data,
        )

    @classmethod
    def failure(
        cls,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ) -> "Result[T]":
        return cls(
            status_code=status_code,
            is_success=False,
            message=message,
            data=None,
        )
