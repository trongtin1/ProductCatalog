from fastapi import APIRouter, Depends, Response, Request

from app.api.deps import get_category_service, get_current_admin
from app.schemas.category import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    CategoryQueryResource,
    PaginatedCategoriesResponse,
)
from app.schemas.base import Result
from app.services.category import CategoryService
from app.core.limiter import limiter

router = APIRouter()


@router.get("/", response_model=Result[PaginatedCategoriesResponse])
@limiter.limit("120/minute")
def list_categories(
    request: Request,
    response: Response,
    query: CategoryQueryResource = Depends(),
    service: CategoryService = Depends(get_category_service),
):
    result = service.list_categories(query)
    response.status_code = result.status_code
    return result


@router.get("/{category_id}", response_model=Result[Category])
@limiter.limit("120/minute")
def get_category(
    request: Request,
    category_id: int,
    response: Response,
    service: CategoryService = Depends(get_category_service),
):
    result = service.get_category(category_id)
    response.status_code = result.status_code
    return result


@router.post("/", response_model=Result[Category])
@limiter.limit("60/minute")
def create_category(
    request: Request,
    category_in: CategoryCreate,
    response: Response,
    service: CategoryService = Depends(get_category_service),
    _: str = Depends(get_current_admin),
):
    result = service.create_category(category_in)
    response.status_code = result.status_code
    return result


@router.put("/{category_id}", response_model=Result[Category])
@limiter.limit("60/minute")
def update_category(
    request: Request,
    category_id: int,
    category_up: CategoryUpdate,
    response: Response,
    service: CategoryService = Depends(get_category_service),
    _: str = Depends(get_current_admin),
):
    result = service.update_category(category_id, category_up)
    response.status_code = result.status_code
    return result


@router.delete("/{category_id}", response_model=Result[None])
@limiter.limit("60/minute")
def delete_category(
    request: Request,
    category_id: int,
    response: Response,
    service: CategoryService = Depends(get_category_service),
    _: str = Depends(get_current_admin),
):
    result = service.delete_category(category_id)
    response.status_code = result.status_code
    return result
