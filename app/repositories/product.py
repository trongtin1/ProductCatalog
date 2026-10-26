from fastapi import HTTPException, status
from app.schemas.product import ProductQueryResource
from sqlalchemy import and_, or_, asc, desc
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.base import BaseRepository


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
    ) -> tuple[list[Product], bool]:
        filters = []

        # Search by name or description
        if query.search_term and query.search_term.strip():
            keyword = f"%{query.search_term.strip()}%"
            filters.append(
                or_(
                    Product.name.ilike(keyword),
                    Product.description.ilike(keyword),
                )
            )

        # Filter by category
        if query.category_id is not None:
            filters.append(Product.category_id == query.category_id)

        # Filter by price range
        if query.min_price is not None:
            filters.append(Product.price >= query.min_price)

        if query.max_price is not None:
            filters.append(Product.price <= query.max_price)

        # Sorting
        sort_name = (query.sort_column_by or "id").lower()
        sort_column = self.SORTABLE_COLUMNS.get(sort_name)
        if sort_column is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported sort column: {query.sort_column_by}",
            )

        cursor_value, cursor_id = self._decode_cursor(
            query.cursor,
            sort_name,
            query.is_sort_column_ascending,
            {"created_at", "updated_at"},
        )
        if cursor_value is not None:
            comparison = (
                sort_column > cursor_value
                if query.is_sort_column_ascending
                else sort_column < cursor_value
            )
            if sort_name == "id":
                filters.append(comparison)
            else:
                filters.append(
                    or_(
                        comparison,
                        and_(sort_column == cursor_value, Product.id > cursor_id),
                    )
                )

        primary_order = (
            asc(sort_column) if query.is_sort_column_ascending else desc(sort_column)
        )
        order_by = [primary_order]
        if sort_name != "id":
            order_by.append(asc(Product.id))

        rows = self.find_list(
            filters=filters,
            order_by=order_by,
            limit=query.page_size + 1,
        )
        has_more = len(rows) > query.page_size

        return rows[:query.page_size], has_more
