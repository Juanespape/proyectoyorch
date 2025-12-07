'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ArrowLeft, X, Mic, MicOff, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { enviarMensaje, enviarMensajeVoz, ChatResponse, API_BASE_URL } from '@/lib/api'

interface Message {
  id: number
  rol: 'user' | 'assistant'
  contenido: string
  imagen_url?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      rol: 'assistant',
      contenido: '¡Hola! Soy tu asistente para gestionar préstamos. Puedes pedirme:\n\n• Ver el sobre de un cliente\n• Registrar un préstamo o abono\n• Ver los movimientos pendientes\n\n¿En qué puedo ayudarte?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return

    // Limpiar el texto de caracteres especiales
    const cleanText = text
      .replace(/\n/g, '. ')
      .replace(/•/g, '')
      .replace(/\$/g, '')
      .replace(/,/g, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0
    utterance.pitch = 1.0

    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(voice => voice.lang.startsWith('es'))
    if (spanishVoice) {
      utterance.voice = spanishVoice
    }

    window.speechSynthesis.speak(utterance)
  }

  // Cargar voces cuando estén disponibles
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await sendAudioMessage(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Timer para mostrar tiempo de grabación
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error al acceder al micrófono:', error)
      alert('No se pudo acceder al micrófono. Por favor verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    setLoading(true)

    // Agregar mensaje temporal del usuario
    const tempUserMessage: Message = {
      id: Date.now(),
      rol: 'user',
      contenido: '🎤 Mensaje de voz...'
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await enviarMensajeVoz(audioBlob)

      if (response.success && response.transcripcion) {
        // Actualizar mensaje del usuario con la transcripción
        setMessages(prev => prev.map(msg =>
          msg.id === tempUserMessage.id
            ? { ...msg, contenido: response.transcripcion! }
            : msg
        ))

        // Agregar respuesta del asistente
        const assistantMessage: Message = {
          id: Date.now() + 1,
          rol: 'assistant',
          contenido: response.respuesta || 'No pude procesar tu mensaje.',
          imagen_url: response.imagen_url
        }
        setMessages(prev => [...prev, assistantMessage])

        // Leer la respuesta en voz alta
        if (response.respuesta) {
          speakText(response.respuesta)
        }
      } else {
        // Error en transcripción
        setMessages(prev => prev.map(msg =>
          msg.id === tempUserMessage.id
            ? { ...msg, contenido: '❌ No se pudo procesar el audio' }
            : msg
        ))

        const errorMessage: Message = {
          id: Date.now() + 1,
          rol: 'assistant',
          contenido: response.error || 'No pude entender el audio. Por favor intenta de nuevo.'
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      setMessages(prev => prev.map(msg =>
        msg.id === tempUserMessage.id
          ? { ...msg, contenido: '❌ Error al enviar audio' }
          : msg
      ))

      const errorMessage: Message = {
        id: Date.now() + 1,
        rol: 'assistant',
        contenido: 'Lo siento, hubo un error al procesar tu mensaje de voz.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now(),
      rol: 'user',
      contenido: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response: ChatResponse = await enviarMensaje(input)

      const assistantMessage: Message = {
        id: Date.now() + 1,
        rol: 'assistant',
        contenido: response.respuesta,
        imagen_url: response.imagen_url
      }

      setMessages(prev => [...prev, assistantMessage])

      // Leer la respuesta en voz alta si TTS está habilitado
      if (ttsEnabled) {
        speakText(response.respuesta)
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        rol: 'assistant',
        contenido: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-blue-700 p-2 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Agente de Préstamos</h1>
          </div>
          {/* Botón TTS */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg transition ${ttsEnabled ? 'bg-blue-700' : 'bg-blue-500/50'}`}
            title={ttsEnabled ? 'Desactivar voz' : 'Activar voz'}
          >
            <Volume2 className={`w-5 h-5 ${!ttsEnabled && 'opacity-50'}`} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.rol === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.rol === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.contenido}</p>
              {message.imagen_url && (
                <div className="mt-2">
                  <img
                    src={`${API_BASE_URL}${message.imagen_url}`}
                    alt="Sobre del cliente"
                    className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded cursor-pointer hover:opacity-80 hover:scale-105 transition-all border-2 border-gray-200"
                    onClick={() => setSelectedImage(`${API_BASE_URL}${message.imagen_url}`)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Toca para ampliar</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg p-3 shadow">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="bg-red-500 text-white text-center py-2 flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span>Grabando... {formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe o usa el micrófono..."
            className="flex-1 border rounded-lg px-4 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={loading || isRecording}
          />

          {/* Botón de micrófono */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`rounded-lg px-4 py-2 transition ${
              isRecording
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Botón de enviar texto */}
          <button
            type="submit"
            disabled={loading || !input.trim() || isRecording}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Sobre ampliado"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
