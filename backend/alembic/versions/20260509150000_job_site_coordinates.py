"""Optional GPS pin for job site (customer) — route on live map to worker.

Revision ID: 20260509150000
Revises: 20260509140000
Create Date: 2026-05-09

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260509150000"
down_revision: Union[str, None] = "20260509140000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("site_lat", sa.Numeric(9, 6), nullable=True))
    op.add_column("jobs", sa.Column("site_lng", sa.Numeric(9, 6), nullable=True))


def downgrade() -> None:
    op.drop_column("jobs", "site_lng")
    op.drop_column("jobs", "site_lat")
