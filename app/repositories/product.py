from fastapi import HTTPException, status
from sqlalchemy import and_, asc, desc, or_
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.base import BaseRepository
from app.schemas.product import CursorProductQueryResource, ProductQueryResource


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

        if query.search and query.search.strip():
            keyword = f"%{query.search.strip()}%"
            filters.append(or_(Product.name.ilike(keyword), Product.description.ilike(keyword)))
        if query.category_id is not None:
            filters.append(Product.category_id == query.category_id)
        if query.min_price is not None:
            filters.append(Product.price >= query.min_price)
        if query.max_price is not None:
            filters.append(Product.price <= query.max_price)

        sort_column = self.SORTABLE_COLUMNS.get((query.sort_by or "id").lower())
        if sort_column is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported sort column: {query.sort_by}",
            )

        is_ascending = (query.order or "asc").strip().lower() != "desc"
        order_clause = asc(sort_column) if is_ascending else desc(sort_column)
        items = self.find_list(
            filters=filters,
            order_by=[order_clause, asc(Product.id)],
            skip=(query.page - 1) * query.page_size,
            limit=query.page_size,
        )
        return items, self.count(filters=filters)

    def list_products_by_cursor(
        self,
        query: CursorProductQueryResource,
    ) -> tuple[list[Product], bool]:
        filters = []
        if query.search and query.search.strip():
            keyword = f"%{query.search.strip()}%"
            filters.append(or_(Product.name.ilike(keyword), Product.description.ilike(keyword)))
        if query.category_id is not None:
            filters.append(Product.category_id == query.category_id)
        if query.min_price is not None:
            filters.append(Product.price >= query.min_price)
        if query.max_price is not None:
            filters.append(Product.price <= query.max_price)

        sort_name = (query.sort_by or "id").lower()
        sort_column = self.SORTABLE_COLUMNS.get(sort_name)
        if sort_column is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported sort column: {query.sort_by}",
            )

        is_ascending = (query.order or "asc").strip().lower() != "desc"
        cursor_value, cursor_id = self.decode_cursor(
            query.cursor,
            sort_name,
            is_ascending,
            {"created_at", "updated_at"},
        )
        if cursor_value is not None:
            comparison = sort_column > cursor_value if is_ascending else sort_column < cursor_value
            if sort_name == "id":
                filters.append(comparison)
            else:
                filters.append(or_(comparison, and_(sort_column == cursor_value, Product.id > cursor_id)))

        order_by = [asc(sort_column) if is_ascending else desc(sort_column)]
        if sort_name != "id":
            order_by.append(asc(Product.id))
        rows = self.find_list(filters=filters, order_by=order_by, limit=query.page_size + 1)
        return rows[:query.page_size], len(rows) > query.page_size