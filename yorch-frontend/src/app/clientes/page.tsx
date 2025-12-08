'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2, RefreshCw, Pencil, Trash2, Check, X, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { obtenerClientes, actualizarCliente, eliminarCliente, Cliente } from '@/lib/api'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)

  const cargarClientes = async () => {
    setLoading(true)
    try {
      const data = await obtenerClientes()
      setClientes(data)
    } catch (error) {
      console.error('Error al cargar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  const iniciarEdicion = (cliente: Cliente) => {
    setEditandoId(cliente.id)
    setNombreEditado(cliente.nombre)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setNombreEditado('')
  }

  const guardarEdicion = async () => {
    if (!editandoId || !nombreEditado.trim()) return

    setGuardando(true)
    try {
      await actualizarCliente(editandoId, { nombre: nombreEditado.trim() })
      setClientes(prev =>
        prev.map(c => c.id === editandoId ? { ...c, nombre: nombreEditado.trim() } : c)
      )
      cancelarEdicion()
    } catch (error) {
      console.error('Error al actualizar:', error)
      alert('Error al actualizar el nombre')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminar = async (clienteId: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      return
    }

    setEliminandoId(clienteId)
    try {
      await eliminarCliente(clienteId)
      setClientes(prev => prev.filter(c => c.id !== clienteId))
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el cliente')
    } finally {
      setEliminandoId(null)
    }
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
            <h1 className="text-xl font-bold">Clientes</h1>
          </div>
          <button
            onClick={cargarClientes}
            className="hover:bg-blue-700 p-2 rounded-lg transition"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Buscador */}
      <div className="flex-shrink-0 p-4 bg-white border-b">
        <div className="max-w-lg mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                {busqueda ? 'Sin resultados' : 'No hay clientes'}
              </h2>
              <p className="text-gray-500 mt-2">
                {busqueda ? 'Intenta con otro nombre' : 'Crea uno desde "Subir Sobre"'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-4">
                {clientesFiltrados.length} cliente(s)
              </p>

              {clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  className="bg-white rounded-lg shadow p-4"
                >
                  {editandoId === cliente.id ? (
                    // Modo edición
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nombreEditado}
                        onChange={(e) => setNombreEditado(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        autoFocus
                      />
                      <button
                        onClick={guardarEdicion}
                        disabled={guardando || !nombreEditado.trim()}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {guardando ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        disabled={guardando}
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    // Modo normal
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 font-medium">{cliente.nombre}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => iniciarEdicion(cliente)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar nombre"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => confirmarEliminar(cliente.id)}
                          disabled={eliminandoId === cliente.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Eliminar"
                        >
                          {eliminandoId === cliente.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
