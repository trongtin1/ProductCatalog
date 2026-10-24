
import json
import math

from fastapi import status

from app.models.category import Category
from app.models.product import Product
from app.repositories.product import ProductRepository
from app.repositories.category import CategoryRepository
from app.schemas.product import (
    ProductResponse,
    ProductCreate,
    ProductUpdate,
    ProductQueryResource,
    PaginatedProductsResponse,
)
from app.schemas.base import Result
from app.core.redis import RedisCacheService


class ProductService:
    def __init__(
        self,
        product_repo: ProductRepository,
        category_repo: CategoryRepository,
    ):
        self.product_repo = product_repo
        self.category_repo = category_repo

    def list_products(
        self,
        query: ProductQueryResource,
    ) -> tuple[Result[PaginatedProductsResponse], bool]:
        cache_key = (
            f"products:list:page={query.page}:size={query.page_size}:"
            f"search={query.search_term}:cat={query.category_id}:"
            f"min={query.min_price}:max={query.max_price}:"
            f"sort={query.sort_column_by}:"
            f"asc={query.is_sort_column_ascending}"
        )

        cached_data = RedisCacheService.get(cache_key)

        if cached_data:
            try:
                data_dict = json.loads(cached_data)
                validated = PaginatedProductsResponse.model_validate(
                    data_dict
                )

                return (
                    Result.success(
                        data=validated,
                        message="Products retrieved successfully",
                    ),
                    True,
                )
            except (ValueError, TypeError):
                # Invalid cache data: fall back to database
                pass

        items, total = self.product_repo.list_products(query)

        total_pages = math.ceil(total / query.page_size)

        item_schemas = [
            ProductResponse.model_validate(item)
            for item in items
        ]

        response_data = PaginatedProductsResponse(
            items=item_schemas,
            total=total,
            page=q.page,
            page_size=q.page_size,
            total_pages=total_pages,
        )

        RedisCacheService.set(
            cache_key,
            response_data.model_dump_json(),
            ttl=60,
        )

        return (
            Result.success(
                data=response_data,
                message="Products retrieved successfully",
            ),
            False,
        )

    def get_product(
        self,
        product_id: int,
    ) -> tuple[Result[ProductResponse], bool]:
        cache_key = f"products:detail:{product_id}"
        cached_data = RedisCacheService.get(cache_key)

        if cached_data:
            try:
                data_dict = json.loads(cached_data)
                validated = ProductResponse.model_validate(data_dict)

                return (
                    Result.success(
                        data=validated,
                        message="Product retrieved successfully",
                    ),
                    True,
                )
            except (ValueError, TypeError):
                pass

        product = self.product_repo.find_one(
            filters=[Product.id == product_id]
        )

        if product is None:
            return (
                Result.failure(
                    message=(
                        f"Product with ID {product_id} not found"
                    ),
                    status_code=status.HTTP_404_NOT_FOUND,
                ),
                False,
            )

        product_schema = ProductResponse.model_validate(product)

        RedisCacheService.set(
            cache_key,
            product_schema.model_dump_json(),
            ttl=60,
        )

        return (
            Result.success(
                data=product_schema,
                message="Product retrieved successfully",
            ),
            False,
        )

    def create_product(
        self,
        product_in: ProductCreate,
    ) -> Result[ProductResponse]:
        category = self.category_repo.find_one(
            filters=[
                Category.id == product_in.category_id
            ]
        )

        if category is None:
            return Result.failure(
                message=(
                    f"Category with ID {product_in.category_id} "
                    "does not exist"
                ),
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        product = self.product_repo.create(product_in)

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=ProductResponse.model_validate(product),
            message="Product created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    def update_product(
        self,
        product_id: int,
        product_up: ProductUpdate,
    ) -> Result[ProductResponse]:
        product = self.product_repo.find_one(
            filters=[Product.id == product_id]
        )

        if product is None:
            return Result.failure(
                message=f"Product with ID {product_id} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        if (
            product_up.category_id is not None
            and product_up.category_id != product.category_id
        ):
            category = self.category_repo.find_one(
                filters=[
                    Category.id == product_up.category_id
                ]
            )

            if category is None:
                return Result.failure(
                    message=(
                        f"Category with ID {product_up.category_id} "
                        "does not exist"
                    ),
                    status_code=status.HTTP_400_BAD_REQUEST,
                )

        updated = self.product_repo.update(
            product,
            product_up,
        )

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=ProductResponse.model_validate(updated),
            message="Product updated successfully",
        )

    def patch_product(
        self,
        product_id: int,
        product_patch: ProductUpdate,
    ) -> Result[ProductResponse]:
        return self.update_product(product_id, product_patch)

    def delete_product(
        self,
        product_id: int,
    ) -> Result[None]:
        product = self.product_repo.find_one(
            filters=[Product.id == product_id]
        )

        if product is None:
            return Result.failure(
                message=f"Product with ID {product_id} not found",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        self.product_repo.delete(product)

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=None,
            message="Product deleted successfully",
        )
