
from fastapi import APIRouter, Depends, Response

from app.api.deps import get_product_service
from app.schemas.product import (
    ProductResponse,
    ProductCreate,
    ProductUpdate,
    ProductQueryResource,
    PaginatedProductsResponse,
)
from app.schemas.base import Result
from app.services.product import ProductService

router = APIRouter()


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
