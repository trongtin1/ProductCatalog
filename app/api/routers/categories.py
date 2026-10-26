
from fastapi import APIRouter, Depends, Response

from app.api.deps import get_category_service
from app.schemas.category import (
    Category,
    CategoryCreate,
    CategoryUpdate,
    CategoryQueryResource,
    PaginatedCategoriesResponse,
)
from app.schemas.base import Result
from app.services.category import CategoryService

router = APIRouter()


@router.get("/", response_model=Result[PaginatedCategoriesResponse])
def list_categories(
    response: Response,
    query: CategoryQueryResource = Depends(),
    service: CategoryService = Depends(get_category_service),
):
    result = service.list_categories(query)
    response.status_code = result.status_code
    return result


@router.get("/{category_id}", response_model=Result[Category])
def get_category(
    category_id: int,
    response: Response,
    service: CategoryService = Depends(get_category_service),
):
    result = service.get_category(category_id)
    response.status_code = result.status_code
    return result


@router.post("/", response_model=Result[Category])
def create_category(
    category_in: CategoryCreate,
    response: Response,
    service: CategoryService = Depends(get_category_service),
):
    result = service.create_category(category_in)
    response.status_code = result.status_code
    return result


@router.put("/{category_id}", response_model=Result[Category])
def update_category(
    category_id: int,
    category_up: CategoryUpdate,
    response: Response,
    service: CategoryService = Depends(get_category_service),
):
    result = service.update_category(category_id, category_up)
    response.status_code = result.status_code
    return result


@router.delete("/{category_id}", response_model=Result[None])
def delete_category(
    category_id: int,
    response: Response,
    service: CategoryService = Depends(get_category_service),
):
    result = service.delete_category(category_id)
    response.status_code = result.status_code
    return result
