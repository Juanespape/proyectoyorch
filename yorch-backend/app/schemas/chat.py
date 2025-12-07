from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ChatMessage(BaseModel):
    mensaje: str


class ChatResponse(BaseModel):
    respuesta: str
    imagen_url: Optional[str] = None
    cliente_id: Optional[int] = None
    accion: Optional[str] = None  # buscar_cliente, registrar_prestamo, registrar_abono, listar_pendientes


class MensajeHistorial(BaseModel):
    id: int
    rol: str
    contenido: str
    created_at: datetime

    class Config:
        from_attributes = True
