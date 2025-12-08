"""Add escrituras table

Revision ID: c7237ff56993
Revises: b6126ee45882
Create Date: 2025-12-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7237ff56993'
down_revision: Union[str, None] = 'b6126ee45882'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('escrituras',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre_propietario', sa.String(length=255), nullable=False),
        sa.Column('carpeta', sa.String(length=255), nullable=False),
        sa.Column('notas', sa.Text(), nullable=True),
        sa.Column('cantidad_archivos', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_escrituras_id'), 'escrituras', ['id'], unique=False)
    op.create_index(op.f('ix_escrituras_nombre_propietario'), 'escrituras', ['nombre_propietario'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_escrituras_nombre_propietario'), table_name='escrituras')
    op.drop_index(op.f('ix_escrituras_id'), table_name='escrituras')
    op.drop_table('escrituras')
