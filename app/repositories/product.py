from fastapi import HTTPException, status
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.base import BaseRepository
from app.schemas.product import ProductQueryResource


class ProductRepository(BaseRepository[Product]):
    SORTABLE_COLUMNS = {
        "id": Product.id,
        "name": Product.name,
        "price": Product.price,
        "stock": Product.stock,
        "category_id": Product.category_id,
        "created_at": Product.created_at,
        "updated_at": Product.updated_at,
    }

    def __init__(self, db: Session):
        super().__init__(Product, db)

    def list_products(
        self,
        query: ProductQueryResource,
    ) -> tuple[list[Product], int]:
        filters = []

        if query.search_term and query.search_term.strip():
            keyword = f"%{query.search_term.strip()}%"
            filters.append(or_(Product.name.ilike(keyword), Product.description.ilike(keyword)))
        if query.category_id is not None:
            filters.append(Product.category_id == query.category_id)
        if query.min_price is not None:
            filters.append(Product.price >= query.min_price)
        if query.max_price is not None:
            filters.append(Product.price <= query.max_price)

        sort_column = self.SORTABLE_COLUMNS.get((query.sort_column_by or "id").lower())
        if sort_column is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported sort column: {query.sort_column_by}",
            )

        order = asc(sort_column) if query.is_sort_column_ascending else desc(sort_column)
        items = self.find_list(
            filters=filters,
            order_by=[order, asc(Product.id)],
            skip=(query.page - 1) * query.page_size,
            limit=query.page_size,
        )
        return items, self.count(filters=filters)
