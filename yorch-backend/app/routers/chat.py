from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.schemas import ChatMessage, ChatResponse
from app.services.ai_service import chat_con_agente
import google.generativeai as genai

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def enviar_mensaje(
    mensaje: ChatMessage,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Envía un mensaje al agente IA y obtiene una respuesta."""
    respuesta, imagen_url, cliente_id, accion = await chat_con_agente(db, mensaje.mensaje)

    return ChatResponse(
        respuesta=respuesta,
        imagen_url=imagen_url,
        cliente_id=cliente_id,
        accion=accion
    )


@router.post("/voz")
async def procesar_mensaje_voz(
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Recibe audio, lo transcribe con Gemini y procesa el mensaje."""
    try:
        # Leer el audio
        audio_bytes = await audio.read()

        # Usar Gemini para transcribir el audio
        model = genai.GenerativeModel('models/gemini-flash-latest')

        # Preparar el audio para Gemini
        audio_part = {
            "inline_data": {
                "mime_type": audio.content_type or "audio/webm",
                "data": audio_bytes
            }
        }

        # Transcribir
        transcription_response = model.generate_content([
            "Transcribe exactamente lo que dice este audio en español. "
            "Solo responde con la transcripción, sin explicaciones adicionales.",
            audio_part
        ])

        texto_transcrito = transcription_response.text.strip()

        if not texto_transcrito:
            return {
                "success": False,
                "error": "No se pudo transcribir el audio",
                "transcripcion": None,
                "respuesta": None
            }

        # Procesar el mensaje transcrito con el chat normal
        respuesta, imagen_url, cliente_id, accion = await chat_con_agente(db, texto_transcrito)

        return {
            "success": True,
            "transcripcion": texto_transcrito,
            "respuesta": respuesta,
            "imagen_url": imagen_url,
            "cliente_id": cliente_id,
            "accion": accion
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Error al procesar audio: {str(e)}",
            "transcripcion": None,
            "respuesta": None
        }
