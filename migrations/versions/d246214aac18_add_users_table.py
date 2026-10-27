"""add_users_table

Revision ID: d246214aac18
Revises:
Create Date: 2026-10-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd246214aac18'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('username', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_table('users')
