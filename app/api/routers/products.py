from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Request, Response, UploadFile

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
    name: Annotated[str, Form(...)],
    price: Annotated[float, Form(...)],
    category_id: Annotated[int, Form(...)],
    description: Annotated[str | None, Form()] = None,
    stock: Annotated[int, Form()] = 0,
    file: Annotated[UploadFile | None, File()] = None,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    result = await service.create_product(
        ProductCreate(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
        ),
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
    name: Annotated[str | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    price: Annotated[float | None, Form()] = None,
    stock: Annotated[int | None, Form()] = None,
    category_id: Annotated[int | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    result = await service.update_product(
        product_id,
        ProductUpdate(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
        ),
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
    name: Annotated[str | None, Form()] = None,
    description: Annotated[str | None, Form()] = None,
    price: Annotated[float | None, Form()] = None,
    stock: Annotated[int | None, Form()] = None,
    category_id: Annotated[int | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
    service: ProductService = Depends(get_product_service),
    _: str = Depends(get_current_admin),
):
    result = await service.patch_product(
        product_id,
        ProductUpdate(
            name=name,
            description=description,
            price=price,
            stock=stock,
            category_id=category_id,
        ),
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
