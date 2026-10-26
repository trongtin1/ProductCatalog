
from fastapi import HTTPException, status
from app.schemas.category import CategoryQueryResource
from sqlalchemy import and_, or_, asc, desc
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    SORTABLE_COLUMNS = {
        "id": Category.id,
        "name": Category.name,
        "created_at": Category.created_at,
    }

    def __init__(self, db: Session):
        super().__init__(Category, db)

    def list_categories(
        self,
        query: CategoryQueryResource,
    ) -> tuple[list[Category], bool]:
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
            {"created_at"},
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
                        and_(sort_column == cursor_value, Category.id > cursor_id),
                    )
                )

        primary_order = asc(sort_column) if query.is_sort_column_ascending else desc(sort_column)
        order_by = [primary_order]
        if sort_name != "id":
            order_by.append(asc(Category.id))

        rows = self.find_list(
            filters=filters,
            order_by=order_by,
            limit=query.page_size + 1,
        )
        has_more = len(rows) > query.page_size

        return rows[:query.page_size], has_more
