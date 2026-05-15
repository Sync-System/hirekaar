"""Worker last known map position for customer nearby search (InDrive-style).

Revision ID: 20260509120000
Revises: 20260508100000
Create Date: 2026-05-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260509120000"
down_revision: Union[str, None] = "20260508100000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_lat", sa.Numeric(9, 6), nullable=True))
    op.add_column("users", sa.Column("last_lng", sa.Numeric(9, 6), nullable=True))
    op.add_column(
        "users",
        sa.Column("location_updated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "location_updated_at")
    op.drop_column("users", "last_lng")
    op.drop_column("users", "last_lat")
