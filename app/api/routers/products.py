from fastapi import APIRouter, Depends, Response, UploadFile, File, HTTPException, status as http_status

from app.api.deps import get_product_service
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
from app.services.product import ProductService
from app.core.minio import upload_image

router = APIRouter()

_ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_SIZE = 5 * 1024 * 1024  # 5 MB
_EXT_MAP = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@router.get("/", response_model=Result[PaginatedProductsResponse])
def list_products(
    response: Response,
    query: ProductQueryResource = Depends(),
    service: ProductService = Depends(get_product_service),
):
    result, is_cache_hit = service.list_products(query)

    response.headers["X-Cache"] = (
        "HIT" if is_cache_hit else "MISS"
    )
    response.status_code = result.status_code
    return result


@router.get("/cursor", response_model=Result[CursorPaginatedProductsResponse])
def list_products_by_cursor(
    response: Response,
    query: CursorProductQueryResource = Depends(),
    service: ProductService = Depends(get_product_service),
):
    """Advanced cursor pagination endpoint; the main list endpoint remains offset-based."""
    result, is_cache_hit = service.list_products_by_cursor(query)
    response.headers["X-Cache"] = "HIT" if is_cache_hit else "MISS"
    response.status_code = result.status_code
    return result


@router.get("/{product_id}", response_model=Result[ProductResponse])
def get_product(
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result, is_cache_hit = service.get_product(product_id)

    response.headers["X-Cache"] = (
        "HIT" if is_cache_hit else "MISS"
    )
    response.status_code = result.status_code
    return result


@router.post("/", response_model=Result[ProductResponse])
def create_product(
    product_in: ProductCreate,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result = service.create_product(product_in)
    response.status_code = result.status_code
    return result


@router.put("/{product_id}", response_model=Result[ProductResponse])
def update_product(
    product_id: int,
    product_up: ProductUpdate,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result = service.update_product(product_id, product_up)
    response.status_code = result.status_code
    return result


@router.patch("/{product_id}", response_model=Result[ProductResponse])
def patch_product(
    product_id: int,
    product_patch: ProductUpdate,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result = service.patch_product(product_id, product_patch)
    response.status_code = result.status_code
    return result


@router.delete("/{product_id}", response_model=Result[None])
def delete_product(
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result = service.delete_product(product_id)
    response.status_code = result.status_code
    return result


@router.post("/{product_id}/image", response_model=Result[ProductResponse])
async def upload_product_image(
    product_id: int,
    response: Response,
    file: UploadFile = File(...),
    service: ProductService = Depends(get_product_service),
):
    """Upload an image for a product and update its image_url."""
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(
            status_code=http_status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF",
        )

    file_data = await file.read()
    if len(file_data) > _MAX_SIZE:
        raise HTTPException(
            status_code=http_status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Kích thước file không được vượt quá 5 MB",
        )

    try:
        extension = _EXT_MAP[file.content_type]
        image_url = upload_image(file_data, file.content_type, extension)
    except Exception:
        raise HTTPException(
            status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Không thể upload ảnh, vui lòng thử lại",
        )

    result = service.update_product(
        product_id,
        ProductUpdate(image_url=image_url),
    )
    response.status_code = result.status_code
    return result
