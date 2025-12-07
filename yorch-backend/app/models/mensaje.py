from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True, index=True)
    rol = Column(String(20), nullable=False)  # user o assistant
    contenido = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
