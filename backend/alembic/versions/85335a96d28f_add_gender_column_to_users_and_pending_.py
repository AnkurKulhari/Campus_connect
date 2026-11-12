"""add_gender_column_to_users_and_pending_registration

Revision ID: 85335a96d28f
Revises: e0dd9be3c8d4
Create Date: 2026-11-12 16:05:47.257202

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85335a96d28f'
down_revision: Union[str, Sequence[str], None] = 'e0dd9be3c8d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('gender', sa.String(length=20), nullable=True))
    op.add_column('pending_registration', sa.Column('gender', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('pending_registration', 'gender')
    op.drop_column('users', 'gender')
