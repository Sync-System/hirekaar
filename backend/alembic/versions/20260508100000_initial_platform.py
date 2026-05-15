"""HirKaar unified platform — Pakistan-first, worldwide-ready (country codes).

Revision ID: 20260508100000
Revises:
Create Date: 2026-05-08

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "20260508100000"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("phone", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("full_name", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("country", sa.Text(), nullable=False, server_default=sa.text("'PK'")),
        sa.Column("city", sa.Text(), nullable=True),
        sa.Column("profile_completed", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("cnic_number", sa.Text(), nullable=True),
        sa.Column("cnic_photo_url", sa.Text(), nullable=True),
        sa.Column("is_worker_available", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("featured_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rating_sum", sa.Numeric(14, 2), server_default="0"),
        sa.Column("rating_count", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("phone", name="users_phone_key"),
        sa.CheckConstraint("role IN ('customer','worker','admin')", name="users_role_check"),
    )

    op.create_table(
        "worker_skills",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("skill", sa.Text(), nullable=False, primary_key=True),
    )

    op.create_table(
        "worker_wallets",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("balance_minor", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "wallet_ledger",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount_minor", sa.BigInteger(), nullable=False),
        sa.Column("entry_type", sa.Text(), nullable=False),
        sa.Column("job_id", UUID(as_uuid=True), nullable=True),
        sa.Column("bid_id", UUID(as_uuid=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "entry_type IN ('topup','platform_fee','boost','adjustment')",
            name="wallet_ledger_type_check",
        ),
    )
    op.create_index("ix_wallet_ledger_user_id", "wallet_ledger", ["user_id"])

    op.create_table(
        "jobs",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("country", sa.Text(), nullable=False, server_default=sa.text("'PK'")),
        sa.Column("city", sa.Text(), nullable=False),
        sa.Column("area", sa.Text(), nullable=False),
        sa.Column("budget_min", sa.Integer(), nullable=False),
        sa.Column("budget_max", sa.Integer(), nullable=False),
        sa.Column("status", sa.Text(), server_default=sa.text("'open'")),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("platform_fee_rate", sa.Numeric(5, 4), nullable=False, server_default="0.1000"),
        sa.Column("accepted_bid_id", UUID(as_uuid=True), nullable=True),
        sa.Column("accepted_price_minor", sa.Integer(), nullable=True),
        sa.Column("platform_fee_minor", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "status IN ('open','in_progress','completed','cancelled')",
            name="jobs_status_check",
        ),
    )
    op.create_index("ix_jobs_country_city_status", "jobs", ["country", "city", "status"])

    op.create_table(
        "bids",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("worker_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("eta", sa.Text(), nullable=True),
        sa.Column("status", sa.Text(), server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "status IN ('pending','accepted','rejected')",
            name="bids_status_check",
        ),
        sa.UniqueConstraint("job_id", "worker_id", name="bids_job_worker_key"),
    )
    op.create_index("ix_bids_job_id", "bids", ["job_id"])

    op.create_foreign_key(
        "fk_jobs_accepted_bid",
        "jobs",
        "bids",
        ["accepted_bid_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "reviews",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("job_id", UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=True),
        sa.Column("reviewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewee_id", UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint("rating IS NULL OR (rating >= 1 AND rating <= 5)", name="reviews_rating_check"),
    )


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_constraint("fk_jobs_accepted_bid", "jobs", type_="foreignkey")
    op.drop_index("ix_bids_job_id", table_name="bids")
    op.drop_table("bids")
    op.drop_index("ix_jobs_country_city_status", table_name="jobs")
    op.drop_table("jobs")
    op.drop_index("ix_wallet_ledger_user_id", table_name="wallet_ledger")
    op.drop_table("wallet_ledger")
    op.drop_table("worker_wallets")
    op.drop_table("worker_skills")
    op.drop_table("users")
