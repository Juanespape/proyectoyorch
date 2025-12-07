'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Camera, Check, Loader2, RefreshCw, X } from 'lucide-react'
import Link from 'next/link'
import {
  obtenerClientesConPendientes,
  actualizarSobreCliente,
  ClienteConPendientes,
  API_BASE_URL
} from '@/lib/api'

export default function Pendientes() {
  const [pendientes, setPendientes] = useState<ClienteConPendientes[]>([])
  const [loading, setLoading] = useState(true)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConPendientes | null>(null)
  const [actualizando, setActualizando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargarPendientes = async () => {
    setLoading(true)
    try {
      const data = await obtenerClientesConPendientes()
      setPendientes(data)
    } catch (error) {
      console.error('Error al cargar pendientes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarPendientes()
  }, [])

  const handleSeleccionarCliente = (cliente: ClienteConPendientes) => {
    setClienteSeleccionado(cliente)
    setMensaje('')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !clienteSeleccionado) return

    setActualizando(true)
    setMensaje('Actualizando sobre...')

    try {
      const response = await actualizarSobreCliente(clienteSeleccionado.cliente_id, file)
      setMensaje(response.mensaje)

      // Esperar un momento y luego recargar
      setTimeout(() => {
        setClienteSeleccionado(null)
        cargarPendientes()
      }, 2000)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setActualizando(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-blue-700 p-2 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Pendientes por Actualizar</h1>
          </div>
          <button
            onClick={cargarPendientes}
            className="hover:bg-blue-700 p-2 rounded-lg transition"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : pendientes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Todo al dia</h2>
            <p className="text-gray-500 mt-2">No tienes movimientos pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {pendientes.length} cliente(s) con movimientos pendientes
            </p>

            {pendientes.map((cliente) => (
              <div
                key={cliente.cliente_id}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  {cliente.imagen_sobre_url && (
                    <img
                      src={`${API_BASE_URL}${cliente.imagen_sobre_url}`}
                      alt={cliente.nombre}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{cliente.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {cliente.cantidad_pendientes} movimiento(s)
                    </p>
                    <div className="mt-2 space-y-1 text-sm">
                      {cliente.total_prestamos > 0 && (
                        <p className="text-red-600">
                          Prestamos: {formatMoney(cliente.total_prestamos)}
                        </p>
                      )}
                      {cliente.total_abonos > 0 && (
                        <p className="text-green-600">
                          Abonos: {formatMoney(cliente.total_abonos)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSeleccionarCliente(cliente)}
                  className="mt-4 w-full bg-blue-600 text-white rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                  <Camera className="w-4 h-4" />
                  Actualizar Sobre
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para actualizar sobre */}
      {clienteSeleccionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Actualizar Sobre</h3>
              <button
                onClick={() => setClienteSeleccionado(null)}
                className="text-gray-500 hover:text-gray-700"
                disabled={actualizando}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Toma una foto del sobre actualizado de <strong>{clienteSeleccionado.nombre}</strong>
            </p>

            {mensaje && (
              <p className={`text-sm mb-4 ${mensaje.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {mensaje}
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={actualizando}
                className="w-full bg-green-600 text-white rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 transition"
              >
                {actualizando ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                {actualizando ? 'Actualizando...' : 'Tomar Foto del Sobre'}
              </button>

              <button
                onClick={() => setClienteSeleccionado(null)}
                disabled={actualizando}
                className="w-full bg-gray-200 text-gray-700 rounded-lg py-3 hover:bg-gray-300 disabled:opacity-50 transition"
              >
                Cancelar
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  )
}
