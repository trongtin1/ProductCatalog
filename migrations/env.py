import sys
import os
from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from alembic import context

# Add project root to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core import config as app_config
from app.db.base import Base

# Import all models so autogenerate can detect them
from app.models import category, product, user  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

DB_URL = app_config.get_database_url()


def run_migrations_offline() -> None:
    context.configure(
        url=DB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(DB_URL, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
