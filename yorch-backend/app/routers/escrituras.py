from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import Escritura
from pathlib import Path
import re
import shutil

router = APIRouter(prefix="/escrituras", tags=["escrituras"])

# Carpeta para guardar escrituras
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads" / "escrituras"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def limpiar_nombre_carpeta(nombre: str) -> str:
    """Limpia el nombre para usarlo como nombre de carpeta."""
    nombre = re.sub(r'[^\w\s-]', '', nombre)
    nombre = nombre.strip().replace(' ', '_')
    return nombre.lower()


@router.post("")
async def crear_escritura(
    nombre_propietario: str = Form(...),
    notas: Optional[str] = Form(None),
    archivos: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crea una escritura con sus archivos (PDF o imágenes)."""

    if not archivos or len(archivos) == 0:
        raise HTTPException(status_code=400, detail="Debe subir al menos un archivo")

    # Crear nombre de carpeta único
    nombre_carpeta = limpiar_nombre_carpeta(nombre_propietario)
    carpeta_path = UPLOADS_DIR / nombre_carpeta

    # Si ya existe la carpeta, agregar un sufijo numérico
    contador = 1
    carpeta_original = nombre_carpeta
    while carpeta_path.exists():
        nombre_carpeta = f"{carpeta_original}_{contador}"
        carpeta_path = UPLOADS_DIR / nombre_carpeta
        contador += 1

    try:
        # Crear carpeta
        carpeta_path.mkdir(parents=True, exist_ok=True)

        # Guardar archivos
        archivos_guardados = []
        for i, archivo in enumerate(archivos):
            # Determinar extensión
            ext = archivo.filename.split(".")[-1] if "." in archivo.filename else "jpg"

            # Nombrar archivo según tipo
            if ext.lower() == "pdf":
                filename = f"documento_{i+1}.pdf"
            else:
                filename = f"imagen_{i+1}.{ext}"

            filepath = carpeta_path / filename

            # Guardar archivo
            contents = await archivo.read()
            with open(filepath, "wb") as buffer:
                buffer.write(contents)

            archivos_guardados.append(filename)

        # Crear registro en base de datos
        nueva_escritura = Escritura(
            nombre_propietario=nombre_propietario,
            carpeta=nombre_carpeta,
            notas=notas,
            cantidad_archivos=len(archivos_guardados)
        )
        db.add(nueva_escritura)
        db.commit()
        db.refresh(nueva_escritura)

        return {
            "success": True,
            "escritura": {
                "id": nueva_escritura.id,
                "nombre_propietario": nueva_escritura.nombre_propietario,
                "carpeta": nombre_carpeta,
                "cantidad_archivos": len(archivos_guardados),
                "archivos": archivos_guardados
            },
            "mensaje": f"Escritura de '{nombre_propietario}' guardada con {len(archivos_guardados)} archivo(s)"
        }

    except Exception as e:
        # Limpiar carpeta si hubo error
        if carpeta_path.exists():
            shutil.rmtree(carpeta_path)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar escritura: {str(e)}")


@router.get("")
def listar_escrituras(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lista todas las escrituras."""
    escrituras = db.query(Escritura).order_by(Escritura.created_at.desc()).all()

    return [
        {
            "id": e.id,
            "nombre_propietario": e.nombre_propietario,
            "carpeta": e.carpeta,
            "notas": e.notas,
            "cantidad_archivos": e.cantidad_archivos,
            "created_at": e.created_at.isoformat() if e.created_at else None
        }
        for e in escrituras
    ]


@router.get("/{escritura_id}")
def obtener_escritura(
    escritura_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene una escritura con sus archivos."""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()

    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura no encontrada")

    # Listar archivos en la carpeta
    carpeta_path = UPLOADS_DIR / escritura.carpeta
    archivos = []

    if carpeta_path.exists():
        for archivo in carpeta_path.iterdir():
            if archivo.is_file():
                archivos.append({
                    "nombre": archivo.name,
                    "url": f"/uploads/escrituras/{escritura.carpeta}/{archivo.name}",
                    "tipo": "pdf" if archivo.suffix.lower() == ".pdf" else "imagen"
                })

    return {
        "id": escritura.id,
        "nombre_propietario": escritura.nombre_propietario,
        "carpeta": escritura.carpeta,
        "notas": escritura.notas,
        "cantidad_archivos": escritura.cantidad_archivos,
        "archivos": archivos,
        "created_at": escritura.created_at.isoformat() if escritura.created_at else None
    }


@router.delete("/{escritura_id}")
def eliminar_escritura(
    escritura_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Elimina una escritura y sus archivos."""
    escritura = db.query(Escritura).filter(Escritura.id == escritura_id).first()

    if not escritura:
        raise HTTPException(status_code=404, detail="Escritura no encontrada")

    try:
        # Eliminar carpeta con archivos
        carpeta_path = UPLOADS_DIR / escritura.carpeta
        if carpeta_path.exists():
            shutil.rmtree(carpeta_path)

        # Eliminar registro
        db.delete(escritura)
        db.commit()

        return {
            "success": True,
            "mensaje": f"Escritura de '{escritura.nombre_propietario}' eliminada"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar escritura: {str(e)}")
