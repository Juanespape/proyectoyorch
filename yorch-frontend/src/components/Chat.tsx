'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { enviarMensaje, ChatResponse, API_BASE_URL } from '@/lib/api'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:bg-blue-700 p-2 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Agente de Préstamos</h1>
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 border rounded-lg px-4 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
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
