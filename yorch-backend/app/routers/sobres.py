from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models import Cliente, MovimientoPendiente
from datetime import datetime
from pathlib import Path
import shutil
import re
import google.generativeai as genai

router = APIRouter(prefix="/sobres", tags=["sobres"])

# Configurar Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

# Carpeta para guardar imágenes
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads" / "sobres"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def limpiar_nombre_archivo(nombre: str) -> str:
    """Limpia el nombre para usarlo como nombre de archivo."""
    # Remover caracteres especiales, mantener letras, números, espacios y guiones
    nombre = re.sub(r'[^\w\s-]', '', nombre)
    # Reemplazar espacios por guiones bajos
    nombre = nombre.strip().replace(' ', '_')
    return nombre.lower()


def to_title_case(nombre: str) -> str:
    """Convierte el nombre a Title Case (primera letra de cada palabra en mayúscula)."""
    return ' '.join(word.capitalize() for word in nombre.lower().split())


def normalizar_nombre(nombre: str) -> str:
    """Normaliza el nombre para comparación (minúsculas, sin espacios extra)."""
    return ' '.join(nombre.lower().split())


@router.post("/extraer-nombre")
async def extraer_nombre_de_sobre(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Usa Gemini Vision para extraer el nombre del cliente de la imagen del sobre."""
    try:
        # Leer contenido de la imagen
        contents = await file.read()

        # Crear modelo con visión
        model = genai.GenerativeModel('models/gemini-flash-latest')

        # Preparar la imagen para Gemini usando inline_data
        image_part = {
            "inline_data": {
                "mime_type": file.content_type or "image/jpeg",
                "data": contents
            }
        }

        prompt = """Analiza esta imagen de un sobre de préstamos.
        Extrae ÚNICAMENTE el nombre completo del cliente EXACTAMENTE como aparece escrito en el sobre.

        IMPORTANTE:
        - Transcribe el nombre en el MISMO ORDEN que está escrito en el sobre
        - Los sobres siempre tienen formato APELLIDOS NOMBRES (ej: "Pérez García Juan Carlos")
        - NO cambies el orden de las palabras
        - NO interpretes cuál es nombre y cuál es apellido, solo copia lo que ves

        Responde SOLO con el nombre, sin explicaciones adicionales.
        Si no puedes identificar un nombre claro, responde "NO_ENCONTRADO".

        Ejemplo: Si el sobre dice "Arteaga Romero Jefersson", responde exactamente "Arteaga Romero Jefersson"
        """

        response = model.generate_content([prompt, image_part])
        nombre_extraido = response.text.strip()

        if nombre_extraido == "NO_ENCONTRADO" or not nombre_extraido:
            return {
                "success": False,
                "nombre": None,
                "mensaje": "No se pudo extraer el nombre del sobre. Por favor ingresa el nombre manualmente."
            }

        return {
            "success": True,
            "nombre": nombre_extraido,
            "mensaje": f"Nombre extraído: {nombre_extraido}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar imagen: {str(e)}")


@router.post("/crear-cliente")
async def crear_cliente_con_sobre(
    nombre: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crea un cliente y guarda la imagen del sobre."""

    # Normalizar y formatear el nombre
    nombre_formateado = to_title_case(nombre.strip())
    nombre_normalizado = normalizar_nombre(nombre)

    # Verificar si ya existe un cliente con el mismo nombre (comparación exacta normalizada)
    clientes = db.query(Cliente).all()
    for cliente in clientes:
        if normalizar_nombre(cliente.nombre) == nombre_normalizado:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un cliente con ese nombre: {cliente.nombre}"
            )

    try:
        # Crear el cliente con nombre formateado
        nuevo_cliente = Cliente(nombre=nombre_formateado)
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)

        # Guardar imagen con el nombre limpio
        nombre_archivo = limpiar_nombre_archivo(nombre)
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{nombre_archivo}.{ext}"
        filepath = UPLOADS_DIR / filename

        # Resetear el archivo para leerlo de nuevo
        await file.seek(0)
        contents = await file.read()

        with open(filepath, "wb") as buffer:
            buffer.write(contents)

        # Actualizar URL de imagen en el cliente
        imagen_url = f"/uploads/sobres/{filename}"
        nuevo_cliente.imagen_sobre_url = imagen_url
        db.commit()

        return {
            "success": True,
            "cliente": {
                "id": nuevo_cliente.id,
                "nombre": nuevo_cliente.nombre,
                "imagen_sobre_url": imagen_url
            },
            "mensaje": f"Cliente '{nombre_formateado}' creado exitosamente"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear cliente: {str(e)}")


@router.post("/actualizar-sobre/{cliente_id}")
async def actualizar_sobre_cliente(
    cliente_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualiza la imagen del sobre de un cliente y marca sus movimientos como procesados."""

    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    try:
        # Guardar nueva imagen (sobrescribe la anterior)
        nombre_archivo = limpiar_nombre_archivo(cliente.nombre)
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{nombre_archivo}.{ext}"
        filepath = UPLOADS_DIR / filename

        contents = await file.read()
        with open(filepath, "wb") as buffer:
            buffer.write(contents)

        # Actualizar URL de imagen
        imagen_url = f"/uploads/sobres/{filename}"
        cliente.imagen_sobre_url = imagen_url

        # Marcar todos los movimientos pendientes de este cliente como procesados
        movimientos_actualizados = db.query(MovimientoPendiente).filter(
            MovimientoPendiente.cliente_id == cliente_id,
            MovimientoPendiente.procesado == False
        ).update({
            "procesado": True,
            "procesado_at": datetime.utcnow()
        })

        db.commit()

        return {
            "success": True,
            "cliente": {
                "id": cliente.id,
                "nombre": cliente.nombre,
                "imagen_sobre_url": imagen_url
            },
            "movimientos_procesados": movimientos_actualizados,
            "mensaje": f"Sobre de '{cliente.nombre}' actualizado. {movimientos_actualizados} movimiento(s) marcado(s) como procesado(s)."
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar sobre: {str(e)}")


@router.get("/pendientes")
def obtener_clientes_con_pendientes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtiene la lista de clientes que tienen movimientos pendientes con detalle."""
    from sqlalchemy import func, case
    from collections import defaultdict

    # Obtener todos los movimientos pendientes con info del cliente
    movimientos = db.query(
        MovimientoPendiente,
        Cliente.nombre,
        Cliente.imagen_sobre_url
    ).join(
        Cliente,
        Cliente.id == MovimientoPendiente.cliente_id
    ).filter(
        MovimientoPendiente.procesado == False
    ).order_by(
        Cliente.nombre,
        MovimientoPendiente.created_at.desc()
    ).all()

    # Agrupar por cliente
    clientes_dict = defaultdict(lambda: {
        "movimientos": [],
        "total_prestamos": 0,
        "total_abonos": 0
    })

    for mov, nombre, imagen_url in movimientos:
        cliente_key = mov.cliente_id
        if "nombre" not in clientes_dict[cliente_key]:
            clientes_dict[cliente_key]["cliente_id"] = mov.cliente_id
            clientes_dict[cliente_key]["nombre"] = nombre
            clientes_dict[cliente_key]["imagen_sobre_url"] = imagen_url

        clientes_dict[cliente_key]["movimientos"].append({
            "id": mov.id,
            "tipo": mov.tipo,
            "monto": float(mov.monto),
            "notas": mov.notas,
            "fecha": mov.created_at.isoformat() if mov.created_at else None
        })

        if mov.tipo == "PRESTAMO":
            clientes_dict[cliente_key]["total_prestamos"] += float(mov.monto)
        else:
            clientes_dict[cliente_key]["total_abonos"] += float(mov.monto)

    # Convertir a lista
    resultado = []
    for cliente_id, data in clientes_dict.items():
        resultado.append({
            "cliente_id": data["cliente_id"],
            "nombre": data["nombre"],
            "imagen_sobre_url": data["imagen_sobre_url"],
            "cantidad_pendientes": len(data["movimientos"]),
            "total_prestamos": data["total_prestamos"],
            "total_abonos": data["total_abonos"],
            "movimientos": data["movimientos"]
        })

    # Ordenar por nombre
    resultado.sort(key=lambda x: x["nombre"].lower())
    return resultado
