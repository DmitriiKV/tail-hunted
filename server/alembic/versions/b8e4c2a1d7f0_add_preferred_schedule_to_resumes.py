"""add preferred schedule to resumes

Revision ID: b8e4c2a1d7f0
Revises: a7c41d9e2b10
Create Date: 2026-11-24
"""
from alembic import op
import sqlalchemy as sa


revision = "b8e4c2a1d7f0"
down_revision = "a7c41d9e2b10"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("resumes", sa.Column("preferred_schedule", sa.String(length=500), nullable=True))


def downgrade():
    op.drop_column("resumes", "preferred_schedule")
