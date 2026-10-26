
import math
from typing import Optional

from fastapi import status

from app.models.category import Category
from app.repositories.category import CategoryRepository
from app.schemas.category import (
    Category as CategorySchema,
    CategoryCreate,
    CategoryUpdate,
    CategoryQueryResource,
    PaginatedCategoriesResponse,
)
from app.schemas.base import Result
from app.core.redis import RedisCacheService


class CategoryService:
    def __init__(self, category_repo: CategoryRepository):
        self.category_repo = category_repo

    def list_categories(
        self,
        query: CategoryQueryResource,
    ) -> Result[PaginatedCategoriesResponse]:
        items, total = self.category_repo.list_categories(query)

        data = [
            CategorySchema.model_validate(item)
            for item in items
        ]

        return Result.success(
            data=PaginatedCategoriesResponse(
                items=data,
                total=total,
                page=query.page,
                page_size=query.page_size,
                total_pages=math.ceil(total / query.page_size),
            ),
            message="Categories retrieved successfully",
        )

    def get_category(
        self,
        category_id: int,
    ) -> Result[CategorySchema]:
        category = self.category_repo.find_one(
            filters=[Category.id == category_id]
        )

        if category is None:
            return Result.failure(
                message=f"Category with ID {category_id} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return Result.success(
            data=CategorySchema.model_validate(category),
            message="Category retrieved successfully",
        )

    def create_category(
        self,
        category_in: CategoryCreate,
    ) -> Result[CategorySchema]:
        existing = self.category_repo.find_one(
            filters=[Category.name == category_in.name]
        )

        if existing is not None:
            return Result.failure(
                message="Category with this name already exists",
                status_code=status.HTTP_409_CONFLICT,
            )

        category = self.category_repo.create(category_in)

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=CategorySchema.model_validate(category),
            message="Category created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def update_category(
        self,
        category_id: int,
        category_up: CategoryUpdate,
    ) -> Result[CategorySchema]:
        category = self.category_repo.find_one(
            filters=[Category.id == category_id]
        )

        if category is None:
            return Result.failure(
                message=f"Category with ID {category_id} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if (
            category_up.name is not None
            and category_up.name != category.name
        ):
            existing = self.category_repo.find_one(
                filters=[Category.name == category_up.name]
            )

            if existing is not None:
                return Result.failure(
                    message="Another category with this name already exists",
                    status_code=status.HTTP_409_CONFLICT,
                )

        updated = self.category_repo.update(
            category,
            category_up,
        )

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=CategorySchema.model_validate(updated),
            message="Category updated successfully",
        )

    def delete_category(
        self,
        category_id: int,
    ) -> Result[None]:
        category = self.category_repo.find_one(
            filters=[Category.id == category_id]
        )

        if category is None:
            return Result.failure(
                message=f"Category with ID {category_id} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        self.category_repo.delete(category)

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=None,
            message="Category deleted successfully",
        )
