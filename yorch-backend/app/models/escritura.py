from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Escritura(Base):
    __tablename__ = "escrituras"

    id = Column(Integer, primary_key=True, index=True)
    nombre_propietario = Column(String(255), nullable=False, index=True)
    carpeta = Column(String(255), nullable=False)  # Nombre de la carpeta donde se guardan los archivos
    notas = Column(Text)
    cantidad_archivos = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
