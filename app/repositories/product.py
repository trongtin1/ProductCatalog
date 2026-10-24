from app.schemas.product import ProductQueryResource
from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    SORTABLE_COLUMNS = {
        "id": Product.id,
        "name": Product.name,
        "description": Product.description,
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

        # Count before pagination
        total = self.count(filters=filters)

        # Sorting
        sort_column = self.SORTABLE_COLUMNS.get(
            (query.sort_column_by | "id").lower()
        )

        order = (
            asc(sort_column)
            if query.is_sort_column_ascending
            else desc(sort_column)
        )

        # Pagination
        items = self.find_list(
            filters=filters,
            order_by=[order, asc(Product.created_at)],
            skip=(query.page - 1) * query.page_size,
            limit=query.page_size,
        )

        return items, total