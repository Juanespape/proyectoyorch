from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models import MovimientoPendiente, Cliente
from app.schemas import MovimientoCreate, MovimientoResponse, MovimientoConCliente

router = APIRouter(prefix="/movimientos", tags=["movimientos"])


@router.get("/pendientes", response_model=List[MovimientoConCliente])
def listar_pendientes(db: Session = Depends(get_db)):
    """Lista todos los movimientos pendientes."""
    movimientos = db.query(MovimientoPendiente).filter(
        MovimientoPendiente.procesado == False
    ).all()

    return [
        MovimientoConCliente(
            id=m.id,
            cliente_id=m.cliente_id,
            tipo=m.tipo,
            monto=m.monto,
            notas=m.notas,
            procesado=m.procesado,
            created_at=m.created_at,
            procesado_at=m.procesado_at,
            cliente_nombre=m.cliente.nombre
        )
        for m in movimientos
    ]


@router.get("/", response_model=List[MovimientoResponse])
def listar_movimientos(
    skip: int = 0,
    limit: int = 100,
    solo_pendientes: bool = False,
    db: Session = Depends(get_db)
):
    """Lista todos los movimientos."""
    query = db.query(MovimientoPendiente)
    if solo_pendientes:
        query = query.filter(MovimientoPendiente.procesado == False)
    movimientos = query.offset(skip).limit(limit).all()
    return movimientos


@router.post("/", response_model=MovimientoResponse)
def crear_movimiento(movimiento: MovimientoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo movimiento."""
    # Verificar que el cliente existe
    cliente = db.query(Cliente).filter(Cliente.id == movimiento.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db_movimiento = MovimientoPendiente(**movimiento.model_dump())
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    return db_movimiento


@router.put("/{movimiento_id}/procesar")
def marcar_procesado(movimiento_id: int, db: Session = Depends(get_db)):
    """Marca un movimiento como procesado."""
    movimiento = db.query(MovimientoPendiente).filter(
        MovimientoPendiente.id == movimiento_id
    ).first()

    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    movimiento.procesado = True
    movimiento.procesado_at = datetime.utcnow()
    db.commit()

    return {"message": "Movimiento marcado como procesado"}


@router.put("/procesar-cliente/{cliente_id}")
def marcar_procesados_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Marca todos los movimientos de un cliente como procesados."""
    count = db.query(MovimientoPendiente).filter(
        MovimientoPendiente.cliente_id == cliente_id,
        MovimientoPendiente.procesado == False
    ).update({
        "procesado": True,
        "procesado_at": datetime.utcnow()
    })
    db.commit()

    return {"message": f"{count} movimientos marcados como procesados"}
