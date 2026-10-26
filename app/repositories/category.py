from fastapi import HTTPException, status
from sqlalchemy import asc, desc, or_
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.base import BaseRepository
from app.schemas.category import CategoryQueryResource


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
    ) -> tuple[list[Category], int]:
        filters = []
        if query.search_term and query.search_term.strip():
            keyword = f"%{query.search_term.strip()}%"
            filters.append(or_(Category.name.ilike(keyword), Category.description.ilike(keyword)))
        if query.name and query.name.strip():
            filters.append(Category.name.ilike(f"%{query.name.strip()}%"))
        if query.description and query.description.strip():
            filters.append(Category.description.ilike(f"%{query.description.strip()}%"))

        sort_column = self.SORTABLE_COLUMNS.get((query.sort_column_by or "id").lower())
        if sort_column is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported sort column: {query.sort_column_by}",
            )

        order = asc(sort_column) if query.is_sort_column_ascending else desc(sort_column)
        items = self.find_list(
            filters=filters,
            order_by=[order, asc(Category.id)],
            skip=(query.page - 1) * query.page_size,
            limit=query.page_size,
        )
        return items, self.count(filters=filters)
