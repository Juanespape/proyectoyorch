from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False, index=True)
    cedula = Column(String(20), unique=True, index=True)
    telefono = Column(String(20))
    direccion = Column(Text)
    imagen_sobre_url = Column(String(500))
    notas = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    movimientos = relationship("MovimientoPendiente", back_populates="cliente")
