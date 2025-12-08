const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

export interface ChatResponse {
  respuesta: string
  imagen_url?: string
  cliente_id?: number
  accion?: string
}

export interface MovimientoPendiente {
  id: number
  cliente_id: number
  tipo: 'PRESTAMO' | 'ABONO'
  monto: number
  notas?: string
  procesado: boolean
  created_at: string
  cliente_nombre: string
}

export interface Cliente {
  id: number
  nombre: string
  cedula?: string
  telefono?: string
  direccion?: string
  imagen_sobre_url?: string
  notas?: string
  created_at: string
}

export interface ExtraerNombreResponse {
  success: boolean
  nombre: string | null
  mensaje: string
}

export interface CrearClienteResponse {
  success: boolean
  cliente: {
    id: number
    nombre: string
    imagen_sobre_url: string
  }
  mensaje: string
}

export async function enviarMensaje(mensaje: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mensaje }),
  })

  if (!response.ok) {
    throw new Error('Error al enviar mensaje')
  }

  return response.json()
}

export async function obtenerPendientes(): Promise<MovimientoPendiente[]> {
  const response = await fetch(`${API_URL}/movimientos/pendientes`)

  if (!response.ok) {
    throw new Error('Error al obtener pendientes')
  }

  return response.json()
}

export async function marcarProcesado(movimientoId: number): Promise<void> {
  const response = await fetch(`${API_URL}/movimientos/${movimientoId}/procesar`, {
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error('Error al marcar como procesado')
  }
}

export async function obtenerClientes(): Promise<Cliente[]> {
  const response = await fetch(`${API_URL}/clientes/`)

  if (!response.ok) {
    throw new Error('Error al obtener clientes')
  }

  return response.json()
}

export async function actualizarCliente(clienteId: number, datos: { nombre?: string }): Promise<Cliente> {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  })

  if (!response.ok) {
    throw new Error('Error al actualizar cliente')
  }

  return response.json()
}

export async function eliminarCliente(clienteId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Error al eliminar cliente')
  }

  return response.json()
}

export async function subirImagenSobre(clienteId: number, file: File): Promise<{ imagen_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/clientes/${clienteId}/subir-sobre`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al subir imagen')
  }

  return response.json()
}

export async function extraerNombreDeSobre(file: File): Promise<ExtraerNombreResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/extraer-nombre`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al procesar imagen')
  }

  return response.json()
}

export async function crearClienteConSobre(nombre: string, file: File): Promise<CrearClienteResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/crear-cliente?nombre=${encodeURIComponent(nombre)}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al crear cliente')
  }

  return response.json()
}

export interface ClienteConPendientes {
  cliente_id: number
  nombre: string
  imagen_sobre_url: string | null
  cantidad_pendientes: number
  total_prestamos: number
  total_abonos: number
}

export async function obtenerClientesConPendientes(): Promise<ClienteConPendientes[]> {
  const response = await fetch(`${API_URL}/sobres/pendientes`)

  if (!response.ok) {
    throw new Error('Error al obtener pendientes')
  }

  return response.json()
}

export interface ActualizarSobreResponse {
  success: boolean
  cliente: {
    id: number
    nombre: string
    imagen_sobre_url: string
  }
  movimientos_procesados: number
  mensaje: string
}

export async function actualizarSobreCliente(clienteId: number, file: File): Promise<ActualizarSobreResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/actualizar-sobre/${clienteId}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al actualizar sobre')
  }

  return response.json()
}

// Interfaz para respuesta de voz
export interface VozResponse {
  success: boolean
  transcripcion: string | null
  respuesta: string | null
  imagen_url?: string
  cliente_id?: number
  accion?: string
  error?: string
}

export async function enviarMensajeVoz(audioBlob: Blob): Promise<VozResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'audio.webm')

  const response = await fetch(`${API_URL}/chat/voz`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al enviar audio')
  }

  return response.json()
}

// ==================== ESCRITURAS ====================

export interface Escritura {
  id: number
  nombre_propietario: string
  carpeta: string
  notas?: string
  cantidad_archivos: number
  created_at: string
}

export interface EscrituraDetalle extends Escritura {
  archivos: {
    nombre: string
    url: string
    tipo: 'pdf' | 'imagen'
  }[]
}

export interface CrearEscrituraResponse {
  success: boolean
  escritura: {
    id: number
    nombre_propietario: string
    carpeta: string
    cantidad_archivos: number
    archivos: string[]
  }
  mensaje: string
}

export async function crearEscritura(
  nombrePropietario: string,
  archivos: File[],
  notas?: string
): Promise<CrearEscrituraResponse> {
  const formData = new FormData()
  formData.append('nombre_propietario', nombrePropietario)
  if (notas) {
    formData.append('notas', notas)
  }
  archivos.forEach((archivo) => {
    formData.append('archivos', archivo)
  })

  const response = await fetch(`${API_URL}/escrituras`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Error al guardar escritura')
  }

  return response.json()
}

export async function listarEscrituras(): Promise<Escritura[]> {
  const response = await fetch(`${API_URL}/escrituras`)

  if (!response.ok) {
    throw new Error('Error al obtener escrituras')
  }

  return response.json()
}

export async function obtenerEscritura(id: number): Promise<EscrituraDetalle> {
  const response = await fetch(`${API_URL}/escrituras/${id}`)

  if (!response.ok) {
    throw new Error('Error al obtener escritura')
  }

  return response.json()
}

export async function eliminarEscritura(id: number): Promise<{ success: boolean; mensaje: string }> {
  const response = await fetch(`${API_URL}/escrituras/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Error al eliminar escritura')
  }

  return response.json()
}
