import json
import logging
import math

from fastapi import UploadFile
from fastapi import status
from minio.error import InvalidResponseError, S3Error

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
    CursorProductQueryResource,
    CursorPaginatedProductsResponse,
)
from app.schemas.base import Result
from app.core.redis import RedisCacheService
from app.core.minio import upload_image

logger = logging.getLogger(__name__)

_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
_MAX_IMAGE_SIZE = 5 * 1024 * 1024


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
            f"search={query.search}:cat={query.category_id}:"
            f"min={query.min_price}:max={query.max_price}:"
            f"sort={query.sort_by}:order={query.order}"
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

        item_schemas = [
            ProductResponse.model_validate(item)
            for item in items
        ]

        response_data = PaginatedProductsResponse(
            items=item_schemas,
            total=total,
            page=query.page,
            page_size=query.page_size,
            total_pages=math.ceil(total / query.page_size),
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

    def list_products_by_cursor(
        self,
        query: CursorProductQueryResource,
    ) -> tuple[Result[CursorPaginatedProductsResponse], bool]:
        cache_key = (
            f"products:cursor:cursor={query.cursor}:size={query.page_size}:"
            f"search={query.search}:cat={query.category_id}:"
            f"min={query.min_price}:max={query.max_price}:"
            f"sort={query.sort_by}:order={query.order}"
        )
        cached_data = RedisCacheService.get(cache_key)
        if cached_data:
            try:
                data = CursorPaginatedProductsResponse.model_validate(json.loads(cached_data))
                return Result.success(data=data, message="Products retrieved successfully"), True
            except (ValueError, TypeError):
                pass

        items, has_more = self.product_repo.list_products_by_cursor(query)
        response_data = CursorPaginatedProductsResponse(
            items=[ProductResponse.model_validate(item) for item in items],
            page_size=query.page_size,
            has_more=has_more,
            next_cursor=(
                self.product_repo.encode_cursor(
                    items[-1],
                    (query.sort_by or "id").lower(),
                    (query.order or "asc").strip().lower() != "desc",
                )
                if has_more and items
                else None
            ),
        )
        RedisCacheService.set(cache_key, response_data.model_dump_json(), ttl=60)
        return Result.success(data=response_data, message="Products retrieved successfully"), False

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

    async def _upload_product_image(
        self,
        file: UploadFile | None,
    ) -> Result[str] | None:
        if file is None:
            return None

        extension = _ALLOWED_IMAGE_TYPES.get(file.content_type or "")
        if extension is None:
            return Result.failure(
                message="Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF",
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            )

        file_data = await file.read()
        if len(file_data) > _MAX_IMAGE_SIZE:
            return Result.failure(
                message="Kích thước file không được vượt quá 5 MB",
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        try:
            image_url = upload_image(file_data, file.content_type or "", extension)
        except (InvalidResponseError, OSError, S3Error, ValueError):
            logger.exception("Failed to upload product image")
            return Result.failure(
                message="Không thể upload ảnh, vui lòng thử lại",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Result.success(data=image_url)

    async def create_product(
        self,
        product_in: ProductCreate,
        file: UploadFile | None = None,
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

        image_result = await self._upload_product_image(file)
        if image_result is not None and not image_result.is_success:
            return Result.failure(
                message=image_result.message,
                status_code=image_result.status_code,
            )
        if image_result is not None:
            product_in = product_in.model_copy(
                update={"image_url": image_result.data}
            )

        product = self.product_repo.create(product_in)

        RedisCacheService.invalidate_pattern("products:*")

        return Result.success(
            data=ProductResponse.model_validate(product),
            message="Product created successfully",
            status_code=status.HTTP_201_CREATED,
        )

    async def update_product(
        self,
        product_id: int,
        product_up: ProductUpdate,
        file: UploadFile | None = None,
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

        image_result = await self._upload_product_image(file)
        if image_result is not None and not image_result.is_success:
            return Result.failure(
                message=image_result.message,
                status_code=image_result.status_code,
            )
        if image_result is not None:
            product_up = product_up.model_copy(
                update={"image_url": image_result.data}
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

    async def patch_product(
        self,
        product_id: int,
        product_patch: ProductUpdate,
        file: UploadFile | None = None,
    ) -> Result[ProductResponse]:
        return await self.update_product(product_id, product_patch, file)

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