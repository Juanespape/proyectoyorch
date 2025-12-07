import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models import Cliente, MovimientoPendiente, Mensaje
from typing import Optional, Tuple
import re
from decimal import Decimal

# Configurar Gemini
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT = """Eres un asistente para gestionar préstamos de un prestamista. Tu trabajo es:

1. BUSCAR CLIENTES: Cuando el usuario pida ver un sobre o información de un cliente, debes identificar el nombre.
   Responde con: [BUSCAR_CLIENTE: nombre del cliente]

2. REGISTRAR PRÉSTAMOS: Cuando el usuario diga que hizo un préstamo, extrae el nombre y monto.
   Responde con: [REGISTRAR_PRESTAMO: nombre del cliente | monto]

3. REGISTRAR ABONOS: Cuando el usuario diga que un cliente abonó/pagó, extrae el nombre y monto.
   Responde con: [REGISTRAR_ABONO: nombre del cliente | monto]

4. LISTAR PENDIENTES: Cuando el usuario pregunte qué tiene pendiente.
   Responde con: [LISTAR_PENDIENTES]

5. MARCAR PROCESADO: Cuando el usuario diga que ya actualizó un sobre.
   Responde con: [MARCAR_PROCESADO: nombre del cliente]

Siempre responde de forma natural y amigable, pero incluye los comandos entre corchetes cuando detectes una acción.

Ejemplos:
- "muéstrame el sobre de Juan Pérez" → "Buscando el sobre de Juan Pérez... [BUSCAR_CLIENTE: Juan Pérez]"
- "le presté 500 mil a María" → "Entendido, registro el préstamo de $500,000 a María. [REGISTRAR_PRESTAMO: María | 500000]"
- "qué tengo pendiente" → "Déjame revisar tus movimientos pendientes. [LISTAR_PENDIENTES]"
"""


def parse_monto(texto: str) -> Optional[Decimal]:
    """Convierte texto de monto a Decimal."""
    texto = texto.lower().replace(",", "").replace(".", "").replace(" ", "")
    texto = texto.replace("mil", "000").replace("millon", "000000").replace("millón", "000000")
    numeros = re.findall(r'\d+', texto)
    if numeros:
        return Decimal(numeros[0])
    return None


def buscar_cliente_por_nombre(db: Session, nombre: str) -> Optional[Cliente]:
    """Busca un cliente por nombre (búsqueda parcial)."""
    return db.query(Cliente).filter(
        Cliente.nombre.ilike(f"%{nombre}%")
    ).first()


def procesar_comando(db: Session, respuesta_ia: str) -> Tuple[str, Optional[str], Optional[int], Optional[str]]:
    """Procesa los comandos de la IA y ejecuta las acciones."""
    imagen_url = None
    cliente_id = None
    accion = None
    mensaje_final = respuesta_ia

    # Buscar cliente
    match = re.search(r'\[BUSCAR_CLIENTE:\s*([^\]]+)\]', respuesta_ia)
    if match:
        nombre = match.group(1).strip()
        cliente = buscar_cliente_por_nombre(db, nombre)
        accion = "buscar_cliente"
        if cliente:
            imagen_url = cliente.imagen_sobre_url
            cliente_id = cliente.id
            mensaje_final = re.sub(r'\[BUSCAR_CLIENTE:[^\]]+\]',
                f"Encontré a {cliente.nombre}.", respuesta_ia)
        else:
            mensaje_final = re.sub(r'\[BUSCAR_CLIENTE:[^\]]+\]',
                f"No encontré ningún cliente con el nombre '{nombre}'.", respuesta_ia)

    # Registrar préstamo
    match = re.search(r'\[REGISTRAR_PRESTAMO:\s*([^|]+)\|\s*([^\]]+)\]', respuesta_ia)
    if match:
        nombre = match.group(1).strip()
        monto_texto = match.group(2).strip()
        monto = parse_monto(monto_texto)
        cliente = buscar_cliente_por_nombre(db, nombre)
        accion = "registrar_prestamo"

        if cliente and monto:
            movimiento = MovimientoPendiente(
                cliente_id=cliente.id,
                tipo="PRESTAMO",
                monto=monto
            )
            db.add(movimiento)
            db.commit()
            cliente_id = cliente.id
            mensaje_final = re.sub(r'\[REGISTRAR_PRESTAMO:[^\]]+\]',
                f"Registrado préstamo de ${monto:,.0f} a {cliente.nombre}.", respuesta_ia)
        else:
            mensaje_final = re.sub(r'\[REGISTRAR_PRESTAMO:[^\]]+\]',
                f"No pude registrar el préstamo. Verifica el nombre del cliente.", respuesta_ia)

    # Registrar abono
    match = re.search(r'\[REGISTRAR_ABONO:\s*([^|]+)\|\s*([^\]]+)\]', respuesta_ia)
    if match:
        nombre = match.group(1).strip()
        monto_texto = match.group(2).strip()
        monto = parse_monto(monto_texto)
        cliente = buscar_cliente_por_nombre(db, nombre)
        accion = "registrar_abono"

        if cliente and monto:
            movimiento = MovimientoPendiente(
                cliente_id=cliente.id,
                tipo="ABONO",
                monto=monto
            )
            db.add(movimiento)
            db.commit()
            cliente_id = cliente.id
            mensaje_final = re.sub(r'\[REGISTRAR_ABONO:[^\]]+\]',
                f"Registrado abono de ${monto:,.0f} de {cliente.nombre}.", respuesta_ia)
        else:
            mensaje_final = re.sub(r'\[REGISTRAR_ABONO:[^\]]+\]',
                f"No pude registrar el abono. Verifica el nombre del cliente.", respuesta_ia)

    # Listar pendientes
    if '[LISTAR_PENDIENTES]' in respuesta_ia:
        accion = "listar_pendientes"
        pendientes = db.query(MovimientoPendiente).filter(
            MovimientoPendiente.procesado == False
        ).all()

        if pendientes:
            lista = "\n".join([
                f"- {p.cliente.nombre}: {p.tipo} ${p.monto:,.0f}"
                for p in pendientes
            ])
            mensaje_final = re.sub(r'\[LISTAR_PENDIENTES\]',
                f"Tienes {len(pendientes)} movimientos pendientes:\n{lista}", respuesta_ia)
        else:
            mensaje_final = re.sub(r'\[LISTAR_PENDIENTES\]',
                "No tienes movimientos pendientes.", respuesta_ia)

    # Marcar procesado
    match = re.search(r'\[MARCAR_PROCESADO:\s*([^\]]+)\]', respuesta_ia)
    if match:
        nombre = match.group(1).strip()
        cliente = buscar_cliente_por_nombre(db, nombre)
        accion = "marcar_procesado"

        if cliente:
            from datetime import datetime
            db.query(MovimientoPendiente).filter(
                MovimientoPendiente.cliente_id == cliente.id,
                MovimientoPendiente.procesado == False
            ).update({
                "procesado": True,
                "procesado_at": datetime.utcnow()
            })
            db.commit()
            cliente_id = cliente.id
            mensaje_final = re.sub(r'\[MARCAR_PROCESADO:[^\]]+\]',
                f"Marcados como procesados los movimientos de {cliente.nombre}.", respuesta_ia)
        else:
            mensaje_final = re.sub(r'\[MARCAR_PROCESADO:[^\]]+\]',
                f"No encontré al cliente '{nombre}'.", respuesta_ia)

    return mensaje_final, imagen_url, cliente_id, accion


async def chat_con_agente(db: Session, mensaje_usuario: str) -> Tuple[str, Optional[str], Optional[int], Optional[str]]:
    """Procesa un mensaje del usuario con el agente IA."""

    # Guardar mensaje del usuario
    msg_usuario = Mensaje(rol="user", contenido=mensaje_usuario)
    db.add(msg_usuario)
    db.commit()

    # Obtener historial reciente
    historial = db.query(Mensaje).order_by(Mensaje.id.desc()).limit(10).all()
    historial.reverse()

    # Construir conversación para Gemini
    mensajes_historial = "\n".join([
        f"{'Usuario' if m.rol == 'user' else 'Asistente'}: {m.contenido}"
        for m in historial[:-1]  # Excluir el mensaje actual
    ])

    prompt_completo = f"{SYSTEM_PROMPT}\n\nHistorial reciente:\n{mensajes_historial}\n\nUsuario: {mensaje_usuario}\n\nAsistente:"

    try:
        model = genai.GenerativeModel('models/gemini-flash-latest')
        response = model.generate_content(prompt_completo)
        respuesta_ia = response.text
    except Exception as e:
        respuesta_ia = f"Lo siento, hubo un error al procesar tu mensaje: {str(e)}"

    # Procesar comandos en la respuesta
    mensaje_final, imagen_url, cliente_id, accion = procesar_comando(db, respuesta_ia)

    # Guardar respuesta del asistente
    msg_asistente = Mensaje(rol="assistant", contenido=mensaje_final)
    db.add(msg_asistente)
    db.commit()

    return mensaje_final, imagen_url, cliente_id, accion
