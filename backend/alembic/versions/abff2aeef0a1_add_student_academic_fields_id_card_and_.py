"""add_student_academic_fields_id_card_and_alumni

Revision ID: abff2aeef0a1
Revises: 983f458e364b
Create Date: 2026-11-11 23:45:57.066748

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abff2aeef0a1'
down_revision: Union[str, Sequence[str], None] = '983f458e364b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pending_registration additions
    op.add_column('pending_registration', sa.Column('roll_number', sa.String(length=20), nullable=True))
    op.add_column('pending_registration', sa.Column('course', sa.String(length=50), nullable=True))
    op.add_column('pending_registration', sa.Column('branch', sa.String(length=100), nullable=True))
    op.add_column('pending_registration', sa.Column('year', sa.String(length=30), nullable=True))
    op.add_column('pending_registration', sa.Column('is_year_back', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('pending_registration', sa.Column('is_alumni', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('pending_registration', sa.Column('id_card_url', sa.String(length=500), nullable=True))
    op.add_column('pending_registration', sa.Column('linkedin_url', sa.String(length=255), nullable=True))

    # users additions
    op.add_column('users', sa.Column('roll_number', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('course', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('branch', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('year', sa.String(length=30), nullable=True))
    op.add_column('users', sa.Column('is_year_back', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('is_alumni', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('id_card_url', sa.String(length=500), nullable=True))
    op.add_column('users', sa.Column('is_id_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    op.add_column('users', sa.Column('linkedin_url', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('last_academic_verified_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_academic_verified_at')
    op.drop_column('users', 'linkedin_url')
    op.drop_column('users', 'is_id_verified')
    op.drop_column('users', 'id_card_url')
    op.drop_column('users', 'is_alumni')
    op.drop_column('users', 'is_year_back')
    op.drop_column('users', 'year')
    op.drop_column('users', 'branch')
    op.drop_column('users', 'course')
    op.drop_column('users', 'roll_number')

    op.drop_column('pending_registration', 'linkedin_url')
    op.drop_column('pending_registration', 'id_card_url')
    op.drop_column('pending_registration', 'is_alumni')
    op.drop_column('pending_registration', 'is_year_back')
    op.drop_column('pending_registration', 'year')
    op.drop_column('pending_registration', 'branch')
    op.drop_column('pending_registration', 'course')
    op.drop_column('pending_registration', 'roll_number')
