
from typing import Any, Generic, TypeVar, Type, Optional, Union
from collections.abc import Mapping, Sequence

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, Query
from sqlalchemy.sql.elements import ColumnElement

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def prepare_query(
        self,
        filters: Optional[Sequence[ColumnElement[bool]]] = None,
        options: Optional[Sequence[Any]] = None,
        order_by: Optional[Sequence[Any]] = None,
    ) -> Query:
        query = self.db.query(self.model)

        if filters:
            query = query.filter(*filters)

        if options:
            query = query.options(*options)

        if order_by:
            query = query.order_by(*order_by)

        return query

    def find_one(
        self,
        filters: Optional[Sequence[ColumnElement[bool]]] = None,
        options: Optional[Sequence[Any]] = None,
        order_by: Optional[Sequence[Any]] = None,
    ) -> Optional[ModelType]:
        query = self.prepare_query(
            filters=filters,
            options=options,
            order_by=order_by,
        )
        return query.first()

    def find_list(
        self,
        filters: Optional[Sequence[ColumnElement[bool]]] = None,
        options: Optional[Sequence[Any]] = None,
        order_by: Optional[Sequence[Any]] = None,
        skip: int = 0,
        limit: Optional[int] = None,
    ) -> list[ModelType]:
        query = self.prepare_query(
            filters=filters,
            options=options,
            order_by=order_by,
        )

        if skip > 0:
            query = query.offset(skip)

        if limit is not None:
            query = query.limit(limit)

        return query.all()

    def create(
        self,
        obj_in: Union[BaseModel, Mapping[str, Any]],
    ) -> ModelType:
        data = self._get_data(obj_in)
        db_obj = self.model(**data)

        self.db.add(db_obj)
        self._commit()
        self.db.refresh(db_obj)

        return db_obj

    def update(
        self,
        db_obj: ModelType,
        obj_in: Union[BaseModel, Mapping[str, Any]],
    ) -> ModelType:
        data = self._get_data(obj_in, exclude_unset=True)

        allowed_fields = {
            column.key
            for column in self.model.__table__.columns
        }

        for field, value in data.items():
            if field in allowed_fields and field != "id":
                setattr(db_obj, field, value)

        self.db.add(db_obj)
        self._commit()
        self.db.refresh(db_obj)

        return db_obj

    def delete(self, db_obj: ModelType) -> None:
        self.db.delete(db_obj)
        self._commit()

    def count(
        self,
        filters: Optional[Sequence[ColumnElement[bool]]] = None,
    ) -> int:
        query = self.db.query(func.count()).select_from(self.model)

        if filters:
            query = query.filter(*filters)

        return query.scalar() or 0

    @staticmethod
    def encode_cursor(
        item: ModelType,
        sort_name: str,
        is_ascending: bool,
    ) -> str:
        value = getattr(item, sort_name)
        if isinstance(value, datetime):
            value = value.isoformat()
        payload = {"v": value, "id": item.id, "s": sort_name, "a": is_ascending}
        return base64.urlsafe_b64encode(
            json.dumps(payload, separators=(",", ":")).encode()
        ).decode().rstrip("=")

    @staticmethod
    def decode_cursor(
        cursor: str | None,
        sort_name: str,
        is_ascending: bool,
        datetime_sort_fields: set[str],
    ) -> tuple[object | None, int | None]:
        if cursor is None:
            return None, None
        try:
            padded = cursor + "=" * (-len(cursor) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded).decode())
            if (
                payload["s"] != sort_name
                or payload["a"] != is_ascending
                or not isinstance(payload["id"], int)
            ):
                raise ValueError
            value = payload["v"]
            if sort_name in datetime_sort_fields:
                value = datetime.fromisoformat(value)
            return value, payload["id"]
        except (
            KeyError, TypeError, ValueError, UnicodeDecodeError,
            binascii.Error, json.JSONDecodeError,
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid cursor",
            )

    @staticmethod
    def _get_data(
        obj_in: Union[BaseModel, Mapping[str, Any]],
        exclude_unset: bool = False,
    ) -> dict[str, Any]:
        if isinstance(obj_in, BaseModel):
            return obj_in.model_dump(exclude_unset=exclude_unset)

        return dict(obj_in)

    def _commit(self) -> None:
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
import base64
import binascii
import json
from datetime import datetime
