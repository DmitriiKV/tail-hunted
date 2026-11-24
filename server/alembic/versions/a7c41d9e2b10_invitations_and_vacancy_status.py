"""invitations and application status timestamp

Revision ID: a7c41d9e2b10
Revises: d52f4e1fb6e5
Create Date: 2026-11-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7c41d9e2b10"
down_revision: Union[str, Sequence[str], None] = "d52f4e1fb6e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "invitations",
        sa.Column("inv_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("vac_id", sa.Integer(), nullable=False),
        sa.Column("res_id", sa.Integer(), nullable=False),
        sa.Column("employer_id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("decline_reason", sa.String(length=300), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["vac_id"], ["vacancies.vac_id"]),
        sa.ForeignKeyConstraint(["res_id"], ["resumes.res_id"]),
        sa.ForeignKeyConstraint(["employer_id"], ["users.user_id"]),
        sa.ForeignKeyConstraint(["candidate_id"], ["users.user_id"]),
        sa.PrimaryKeyConstraint("inv_id"),
    )
    op.create_index("ix_invitations_vac_id", "invitations", ["vac_id"])
    op.create_index("ix_invitations_res_id", "invitations", ["res_id"])
    op.create_index("ix_invitations_employer_id", "invitations", ["employer_id"])
    op.create_index("ix_invitations_candidate_id", "invitations", ["candidate_id"])
    op.create_index(
        "uq_active_invitation",
        "invitations",
        ["vac_id", "res_id"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )

    op.add_column("notifications", sa.Column("inv_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_notifications_inv_id", "notifications", "invitations", ["inv_id"], ["inv_id"]
    )
    op.create_index("ix_notifications_user_unread", "notifications", ["user_id", "is_read"])

    op.add_column("applications", sa.Column("status_changed_at", sa.DateTime(), nullable=True))
    op.create_index("ix_applications_vac_id", "applications", ["vac_id"])


def downgrade() -> None:
    op.drop_index("ix_applications_vac_id", table_name="applications")
    op.drop_column("applications", "status_changed_at")
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_constraint("fk_notifications_inv_id", "notifications", type_="foreignkey")
    op.drop_column("notifications", "inv_id")
    op.drop_index("uq_active_invitation", table_name="invitations")
    op.drop_index("ix_invitations_candidate_id", table_name="invitations")
    op.drop_index("ix_invitations_employer_id", table_name="invitations")
    op.drop_index("ix_invitations_res_id", table_name="invitations")
    op.drop_index("ix_invitations_vac_id", table_name="invitations")
    op.drop_table("invitations")
