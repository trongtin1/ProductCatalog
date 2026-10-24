
from app.schemas.category import CategoryQueryResource
from typing import Optional

from sqlalchemy import or_, asc, desc
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    SORTABLE_COLUMNS = {
        "id": Category.id,
        "name": Category.name,
        "description": Category.description,
        "created_at": Category.created_at,
    }

    def __init__(self, db: Session):
        super().__init__(Category, db)

    def list_categories(
        self,
        query: CategoryQueryResource,
    ) -> tuple[list[Category], int]:
        filters = []

        if query.search_term and query.search_term.strip():
            keyword = f"%{query.search_term.strip()}%"
            filters.append(
                or_(
                    Category.name.ilike(keyword),
                    Category.description.ilike(keyword),
                )
            )

        if query.name and query.name.strip():
            filters.append(
                Category.name.ilike(f"%{query.name.strip()}%")
            )

        if query.description and query.description.strip():
            filters.append(
                Category.description.ilike(
                    f"%{query.description.strip()}%")
            )

        # Count before pagination
        total = self.count(filters=filters)

        sort_column = self.SORTABLE_COLUMNS.get(
            (query.sort_column_by | "id").lower()
        )

        order = (
            asc(sort_column)
            if query.is_sort_column_ascending
            else desc(sort_column)
        )

        items = self.find_list(
            filters=filters,
            order_by=[order, asc(Category.created_at)],
            skip=(query.page - 1) * query.page_size,
            limit=query.page_size,
        )

        return items, total
