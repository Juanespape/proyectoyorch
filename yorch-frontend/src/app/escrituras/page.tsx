'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, FileText, Check, X, Loader2, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { crearEscritura } from '@/lib/api'

type Estado = 'inicial' | 'archivos' | 'guardando' | 'exito' | 'error'

interface ArchivoPreview {
  file: File
  preview: string
  tipo: 'imagen' | 'pdf'
}

export default function SubirEscritura() {
  const [estado, setEstado] = useState<Estado>('inicial')
  const [archivos, setArchivos] = useState<ArchivoPreview[]>([])
  const [nombrePropietario, setNombrePropietario] = useState('')
  const [notas, setNotas] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [escrituraCreada, setEscrituraCreada] = useState<{ nombre: string; cantidad: number } | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const nuevosArchivos: ArchivoPreview[] = []

    Array.from(files).forEach((file) => {
      const esPdf = file.type === 'application/pdf'
      nuevosArchivos.push({
        file,
        preview: esPdf ? '' : URL.createObjectURL(file),
        tipo: esPdf ? 'pdf' : 'imagen'
      })
    })

    setArchivos(prev => [...prev, ...nuevosArchivos])
    setEstado('archivos')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Limpiar input para permitir seleccionar el mismo archivo
    e.target.value = ''
  }

  const eliminarArchivo = (index: number) => {
    setArchivos(prev => {
      const nuevos = [...prev]
      if (nuevos[index].preview) {
        URL.revokeObjectURL(nuevos[index].preview)
      }
      nuevos.splice(index, 1)
      return nuevos
    })

    if (archivos.length <= 1) {
      setEstado('inicial')
    }
  }

  const handleGuardar = async () => {
    if (!nombrePropietario.trim()) {
      setMensaje('Por favor ingresa el nombre del propietario')
      return
    }

    if (archivos.length === 0) {
      setMensaje('Por favor agrega al menos un archivo')
      return
    }

    setEstado('guardando')
    setMensaje('Guardando escritura...')

    try {
      const files = archivos.map(a => a.file)
      const response = await crearEscritura(nombrePropietario.trim(), files, notas.trim() || undefined)

      if (response.success) {
        setEscrituraCreada({
          nombre: response.escritura.nombre_propietario,
          cantidad: response.escritura.cantidad_archivos
        })
        setEstado('exito')
        setMensaje(response.mensaje)
      }
    } catch (error) {
      setEstado('error')
      setMensaje(error instanceof Error ? error.message : 'Error al guardar escritura')
    }
  }

  const handleReiniciar = () => {
    // Limpiar previews
    archivos.forEach(a => {
      if (a.preview) URL.revokeObjectURL(a.preview)
    })

    setEstado('inicial')
    setArchivos([])
    setNombrePropietario('')
    setNotas('')
    setMensaje('')
    setEscrituraCreada(null)
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-purple-600 text-white p-4 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:bg-purple-700 p-2 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Subir Escritura</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col p-4 max-w-lg mx-auto w-full">
        {/* Estado Inicial - Seleccionar tipo */}
        {estado === 'inicial' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <p className="text-gray-600 text-center">
                Selecciona el tipo de documento a subir
              </p>

              <div className="space-y-3">
                {/* Botón PDF */}
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="w-full bg-red-600 text-white rounded-lg p-4 flex items-center gap-4 hover:bg-red-700 transition"
                >
                  <FileText className="w-8 h-8" />
                  <div className="text-left">
                    <span className="font-semibold block">Subir PDF</span>
                    <span className="text-sm opacity-80">Documento en formato PDF</span>
                  </div>
                </button>

                {/* Botón Fotos */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full bg-purple-600 text-white rounded-lg p-4 flex items-center gap-4 hover:bg-purple-700 transition"
                >
                  <Camera className="w-8 h-8" />
                  <div className="text-left">
                    <span className="font-semibold block">Tomar Fotos</span>
                    <span className="text-sm opacity-80">Fotografiar documento</span>
                  </div>
                </button>

                {/* Botón Galería */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full bg-green-600 text-white rounded-lg p-4 flex items-center gap-4 hover:bg-green-700 transition"
                >
                  <Upload className="w-8 h-8" />
                  <div className="text-left">
                    <span className="font-semibold block">Desde Galería</span>
                    <span className="text-sm opacity-80">Seleccionar imágenes existentes</span>
                  </div>
                </button>
              </div>

              {/* Inputs ocultos */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleInputChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Estado Archivos - Mostrar archivos y formulario */}
        {estado === 'archivos' && (
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
            {/* Lista de archivos */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {archivos.map((archivo, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {archivo.tipo === 'imagen' ? (
                      <img
                        src={archivo.preview}
                        alt={`Archivo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-red-600">
                        <FileText className="w-8 h-8" />
                        <span className="text-xs mt-1">PDF</span>
                      </div>
                    )}
                    <button
                      onClick={() => eliminarArchivo(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Botón agregar más */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:bg-gray-200 transition border-2 border-dashed border-gray-300"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs mt-1">Agregar</span>
                </button>
              </div>

              <p className="text-sm text-gray-500 text-center mb-4">
                {archivos.length} archivo(s) seleccionado(s)
              </p>
            </div>

            {/* Footer fijo */}
            <div className="flex-shrink-0 bg-white border-t p-4 space-y-3" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              {mensaje && (
                <p className="text-amber-600 text-sm">{mensaje}</p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Propietario *
                </label>
                <input
                  type="text"
                  value={nombrePropietario}
                  onChange={(e) => setNombrePropietario(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full border rounded-lg px-4 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Escritura casa lote 5"
                  className="w-full border rounded-lg px-4 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReiniciar}
                  className="flex-1 bg-gray-200 text-gray-700 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-gray-300 transition"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={!nombrePropietario.trim() || archivos.length === 0}
                  className="flex-1 bg-purple-600 text-white rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Check className="w-5 h-5" />
                  Guardar
                </button>
              </div>
            </div>

            {/* Input oculto para agregar más */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Estado Guardando */}
        {estado === 'guardando' && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-center text-gray-600">{mensaje}</p>
            </div>
          </div>
        )}

        {/* Estado Éxito */}
        {estado === 'exito' && escrituraCreada && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Escritura Guardada</h2>
                <p className="text-gray-600 mt-2">{escrituraCreada.nombre}</p>
                <p className="text-sm text-gray-500">{escrituraCreada.cantidad} archivo(s)</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReiniciar}
                  className="flex-1 bg-purple-600 text-white rounded-lg p-3 hover:bg-purple-700 transition"
                >
                  Subir Otra
                </button>

                <Link
                  href="/"
                  className="flex-1 bg-gray-200 text-gray-700 rounded-lg p-3 text-center hover:bg-gray-300 transition"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Estado Error */}
        {estado === 'error' && (
          <div className="flex-1 flex flex-col justify-center">
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
                className="w-full bg-purple-600 text-white rounded-lg p-3 hover:bg-purple-700 transition"
              >
                Intentar de Nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
