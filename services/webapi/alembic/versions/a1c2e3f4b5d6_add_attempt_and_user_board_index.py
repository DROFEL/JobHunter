"""add attempt column and partial unique index on (user_id, board_id)

Revision ID: a1c2e3f4b5d6
Revises: 43b424abe644
Create Date: 2026-04-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1c2e3f4b5d6"
down_revision: Union[str, Sequence[str], None] = "43b424abe644"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "postings_tbl",
        sa.Column("attempt", sa.Integer(), server_default=sa.text("0"), nullable=False),
    )
    op.create_index(
        "ux_postings_user_board",
        "postings_tbl",
        ["user_id", "board_id"],
        unique=True,
        postgresql_where=sa.text("board_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ux_postings_user_board", table_name="postings_tbl")
    op.drop_column("postings_tbl", "attempt")
