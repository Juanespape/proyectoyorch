'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Check, X, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { extraerNombreDeSobre, crearClienteConSobre, API_BASE_URL } from '@/lib/api'

type Estado = 'inicial' | 'procesando' | 'confirmar' | 'guardando' | 'exito' | 'error'

export default function SubirSobre() {
  const [estado, setEstado] = useState<Estado>('inicial')
  const [imagen, setImagen] = useState<File | null>(null)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [nombreExtraido, setNombreExtraido] = useState('')
  const [nombreEditado, setNombreEditado] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [clienteCreado, setClienteCreado] = useState<{ nombre: string; imagen_sobre_url: string } | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setImagen(file)
    setImagenPreview(URL.createObjectURL(file))
    setEstado('procesando')
    setMensaje('Analizando imagen con IA...')

    try {
      const response = await extraerNombreDeSobre(file)

      if (response.success && response.nombre) {
        setNombreExtraido(response.nombre)
        setNombreEditado(response.nombre)
        setEstado('confirmar')
        setMensaje('')
      } else {
        setNombreExtraido('')
        setNombreEditado('')
        setEstado('confirmar')
        setMensaje('No se pudo extraer el nombre. Por favor ingrésalo manualmente.')
      }
    } catch (error) {
      setEstado('error')
      setMensaje('Error al procesar la imagen. Intenta de nuevo.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleConfirmar = async () => {
    if (!imagen || !nombreEditado.trim()) {
      setMensaje('Por favor ingresa un nombre')
      return
    }

    setEstado('guardando')
    setMensaje('Creando cliente...')

    try {
      const response = await crearClienteConSobre(nombreEditado.trim(), imagen)

      if (response.success) {
        setClienteCreado(response.cliente)
        setEstado('exito')
        setMensaje(response.mensaje)
      }
    } catch (error) {
      setEstado('error')
      setMensaje(error instanceof Error ? error.message : 'Error al crear cliente')
    }
  }

  const handleReiniciar = () => {
    setEstado('inicial')
    setImagen(null)
    setImagenPreview(null)
    setNombreExtraido('')
    setNombreEditado('')
    setMensaje('')
    setClienteCreado(null)
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:bg-blue-700 p-2 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Subir Sobre</h1>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* Estado Inicial - Seleccionar imagen */}
        {estado === 'inicial' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <p className="text-gray-600 text-center">
              Toma una foto del sobre o selecciona una imagen de la galería
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-blue-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-blue-700 transition"
              >
                <Camera className="w-8 h-8" />
                <span>Tomar Foto</span>
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 bg-green-600 text-white rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-green-700 transition"
              >
                <Upload className="w-8 h-8" />
                <span>Galería</span>
              </button>
            </div>

            {/* Input para cámara */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />

            {/* Input para galería (sin capture) */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Estado Procesando */}
        {estado === 'procesando' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {imagenPreview && (
              <img
                src={imagenPreview}
                alt="Sobre"
                className="w-full rounded-lg"
              />
            )}
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{mensaje}</span>
            </div>
          </div>
        )}

        {/* Estado Confirmar */}
        {estado === 'confirmar' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {imagenPreview && (
              <img
                src={imagenPreview}
                alt="Sobre"
                className="w-full rounded-lg"
              />
            )}

            {mensaje && (
              <p className="text-amber-600 text-sm">{mensaje}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente
              </label>
              <input
                type="text"
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                placeholder="Ingresa el nombre del cliente"
                className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {nombreExtraido && nombreExtraido !== nombreEditado && (
                <p className="text-xs text-gray-500 mt-1">
                  Nombre detectado: {nombreExtraido}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReiniciar}
                className="flex-1 bg-gray-200 text-gray-700 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-gray-300 transition"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>

              <button
                onClick={handleConfirmar}
                disabled={!nombreEditado.trim()}
                className="flex-1 bg-green-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Check className="w-5 h-5" />
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* Estado Guardando */}
        {estado === 'guardando' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            {imagenPreview && (
              <img
                src={imagenPreview}
                alt="Sobre"
                className="w-full rounded-lg opacity-50"
              />
            )}
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{mensaje}</span>
            </div>
          </div>
        )}

        {/* Estado Éxito */}
        {estado === 'exito' && clienteCreado && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Cliente Creado</h2>
              <p className="text-gray-600">{clienteCreado.nombre}</p>
            </div>

            <img
              src={`${API_BASE_URL}${clienteCreado.imagen_sobre_url}`}
              alt={`Sobre de ${clienteCreado.nombre}`}
              className="w-full rounded-lg"
            />

            <div className="flex gap-4">
              <button
                onClick={handleReiniciar}
                className="flex-1 bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition"
              >
                Subir Otro Sobre
              </button>

              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-700 rounded-lg p-3 text-center hover:bg-gray-300 transition"
              >
                Ir al Chat
              </Link>
            </div>
          </div>
        )}

        {/* Estado Error */}
        {estado === 'error' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Error</h2>
              <p className="text-red-600">{mensaje}</p>
            </div>

            <button
              onClick={handleReiniciar}
              className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition"
            >
              Intentar de Nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
