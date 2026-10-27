from typing import TypeVar

from fastapi import APIRouter, Depends, HTTPException, Request, Response, UploadFile
from pydantic import BaseModel, ValidationError

from app.api.deps import get_product_service, get_current_admin
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
from app.core.limiter import limiter

router = APIRouter()
ProductSchema = TypeVar("ProductSchema", bound=BaseModel)


async def _parse_product_request(
    request: Request,
    schema: type[ProductSchema],
) -> tuple[ProductSchema, UploadFile | None]:
    content_type = request.headers.get("content-type", "")
    file: UploadFile | None = None

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        payload = {key: value for key, value in form.items() if key != "file"}
        candidate = form.get("file")
        if isinstance(candidate, UploadFile):
            file = candidate
    else:
        try:
            payload = await request.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail="Request body must be valid JSON or multipart form data",
            ) from exc

    try:
        return schema.model_validate(payload), file
    except ValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=exc.errors(include_context=False),
        ) from exc

@router.get("/", response_model=Result[PaginatedProductsResponse])
@limiter.limit("120/minute")
def list_products(
    request: Request,
    response: Response,
    query: ProductQueryResource = Depends(),
    service: ProductService = Depends(get_product_service),
):
    result, is_cache_hit = service.list_products(query)
    response.headers["X-Cache"] = "HIT" if is_cache_hit else "MISS"
    response.status_code = result.status_code
    return result


@router.get("/cursor", response_model=Result[CursorPaginatedProductsResponse])
@limiter.limit("120/minute")
def list_products_by_cursor(
    request: Request,
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
@limiter.limit("120/minute")
def get_product(
    request: Request,
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
):
    result, is_cache_hit = service.get_product(product_id)
    response.headers["X-Cache"] = "HIT" if is_cache_hit else "MISS"
    response.status_code = result.status_code
    return result


@router.post("/", response_model=Result[ProductResponse])
@limiter.limit("60/minute")
async def create_product(
    request: Request,
    response: Response,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    product_in, file = await _parse_product_request(request, ProductCreate)
    result = await service.create_product(
        product_in,
        file,
    )
    response.status_code = result.status_code
    return result


@router.put("/{product_id}", response_model=Result[ProductResponse])
@limiter.limit("60/minute")
async def update_product(
    request: Request,
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    product_in, file = await _parse_product_request(request, ProductUpdate)
    result = await service.update_product(
        product_id,
        product_in,
        file,
    )
    response.status_code = result.status_code
    return result


@router.patch("/{product_id}", response_model=Result[ProductResponse])
@limiter.limit("60/minute")
async def patch_product(
    request: Request,
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    product_in, file = await _parse_product_request(request, ProductUpdate)
    result = await service.patch_product(
        product_id,
        product_in,
        file,
    )
    response.status_code = result.status_code
    return result


@router.delete("/{product_id}", response_model=Result[None])
@limiter.limit("60/minute")
def delete_product(
    request: Request,
    product_id: int,
    response: Response,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    result = service.delete_product(product_id)
    response.status_code = result.status_code
    return result
