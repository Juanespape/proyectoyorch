from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from decimal import Decimal


class MovimientoBase(BaseModel):
    cliente_id: int
    tipo: Literal["PRESTAMO", "ABONO"]
    monto: Decimal
    notas: Optional[str] = None


class MovimientoCreate(MovimientoBase):
    pass


class MovimientoResponse(MovimientoBase):
    id: int
    procesado: bool
    created_at: datetime
    procesado_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MovimientoConCliente(MovimientoResponse):
    cliente_nombre: str
