"""rename_total_scraped_add_scraped_last_run

Revision ID: 459bcdddad0e
Revises: 8abfe2aa9ae7
Create Date: 2026-04-25 20:59:58.581522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '459bcdddad0e'
down_revision: Union[str, Sequence[str], None] = '8abfe2aa9ae7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('search_configs_tbl', 'total_scraped', new_column_name='scraped_total')
    op.add_column('search_configs_tbl', sa.Column('scraped_last_run', sa.Integer(), server_default=sa.text('0'), nullable=False))


def downgrade() -> None:
    op.drop_column('search_configs_tbl', 'scraped_last_run')
    op.alter_column('search_configs_tbl', 'scraped_total', new_column_name='total_scraped')
