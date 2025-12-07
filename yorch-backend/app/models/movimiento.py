from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class MovimientoPendiente(Base):
    __tablename__ = "movimientos_pendientes"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # PRESTAMO o ABONO
    monto = Column(Numeric(12, 2), nullable=False)
    notas = Column(Text)
    procesado = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    procesado_at = Column(DateTime(timezone=True))

    # Relaciones
    cliente = relationship("Cliente", back_populates="movimientos")
