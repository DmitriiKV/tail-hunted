"""message

Revision ID: 958be6a74f56
Revises: 
Create Date: 2026-10-07 23:28:35.493715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '958be6a74f56'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "resumes_user_id_key", "resumes", ["user_id"]
    )


def downgrade() -> None:
    op.drop_constraint("resumes_user_id_key", "resumes", type_="unique")