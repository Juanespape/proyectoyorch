from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteUpdate, ClienteResponse
import os
import shutil
from pathlib import Path

router = APIRouter(prefix="/clientes", tags=["clientes"])

# Carpeta para guardar imágenes
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads" / "sobres"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Lista todos los clientes."""
    clientes = db.query(Cliente).offset(skip).limit(limit).all()
    return clientes


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por ID."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/", response_model=ClienteResponse)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cliente."""
    db_cliente = Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, cliente: ClienteUpdate, db: Session = Depends(get_db)):
    """Actualiza un cliente existente."""
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    for key, value in cliente.model_dump(exclude_unset=True).items():
        setattr(db_cliente, key, value)

    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Elimina un cliente."""
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.delete(db_cliente)
    db.commit()
    return {"message": "Cliente eliminado"}


@router.post("/{cliente_id}/subir-sobre")
async def subir_imagen_sobre(
    cliente_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Sube una imagen del sobre de un cliente (almacenamiento local)."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Obtener extensión del archivo
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"cliente_{cliente_id}.{ext}"
    filepath = UPLOADS_DIR / filename

    try:
        # Guardar archivo
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Guardar URL relativa en la BD
        imagen_url = f"/uploads/sobres/{filename}"
        cliente.imagen_sobre_url = imagen_url
        db.commit()

        return {"imagen_url": imagen_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir imagen: {str(e)}")
