"""add preferred region to resumes

Revision ID: d52f4e1fb6e5
Revises: ca3a29ae0222
Create Date: 2026-11-17 23:52:06.287288

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd52f4e1fb6e5'
down_revision: Union[str, Sequence[str], None] = 'ca3a29ae0222'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Добавляем колонку, пока разрешая NULL
    op.add_column(
        'resumes',
        sa.Column('preferred_region', sa.String(length=100), nullable=True)
    )

    # 2. Заполняем старые резюме значением по умолчанию
    op.execute(
        "UPDATE resumes "
        "SET preferred_region = 'Любой регион' "
        "WHERE preferred_region IS NULL"
    )

    # 3. Теперь запрещаем NULL
    op.alter_column(
        'resumes',
        'preferred_region',
        existing_type=sa.String(length=100),
        nullable=False
    )


def downgrade():
    op.drop_column('resumes', 'preferred_region')