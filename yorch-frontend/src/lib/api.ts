const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

// ==================== AUTH HELPERS ====================

const SESSION_DURATION_MS = 6 * 60 * 60 * 1000 // 6 horas en milisegundos

function getToken(): string | null {
  if (typeof window === 'undefined') return null

  // Verificar si la sesión ha expirado
  const loginTime = localStorage.getItem('yorch_login_time')
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime)
    if (elapsed >= SESSION_DURATION_MS) {
      // Sesión expirada, limpiar y redirigir
      localStorage.removeItem('yorch_token')
      localStorage.removeItem('yorch_login_time')
      window.location.href = '/login'
      return null
    }
  }

  return localStorage.getItem('yorch_token')
}

export function setToken(token: string): void {
  localStorage.setItem('yorch_token', token)
  localStorage.setItem('yorch_login_time', Date.now().toString())
}

export function clearToken(): void {
  localStorage.removeItem('yorch_token')
  localStorage.removeItem('yorch_login_time')
}

export function getSessionTimeRemaining(): number {
  const loginTime = localStorage.getItem('yorch_login_time')
  if (!loginTime) return 0
  const elapsed = Date.now() - parseInt(loginTime)
  return Math.max(0, SESSION_DURATION_MS - elapsed)
}

function authHeaders(contentType?: string): HeadersInit {
  const headers: HeadersInit = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sesion expirada')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(error.detail || 'Error en la peticion')
  }
  return response.json()
}

// ==================== INTERFACES ====================

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

export interface MovimientoDetalle {
  id: number
  tipo: 'PRESTAMO' | 'ABONO'
  monto: number
  notas?: string
  fecha: string
}

export interface ClienteConPendientes {
  cliente_id: number
  nombre: string
  imagen_sobre_url: string | null
  cantidad_pendientes: number
  total_prestamos: number
  total_abonos: number
  movimientos: MovimientoDetalle[]
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

export interface VozResponse {
  success: boolean
  transcripcion: string | null
  respuesta: string | null
  imagen_url?: string
  cliente_id?: number
  accion?: string
  error?: string
}

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

// ==================== CHAT ====================

export async function enviarMensaje(mensaje: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat/`, {
    method: 'POST',
    headers: authHeaders('application/json'),
    body: JSON.stringify({ mensaje }),
  })
  return handleResponse<ChatResponse>(response)
}

export async function enviarMensajeVoz(audioBlob: Blob): Promise<VozResponse> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'audio.webm')

  const response = await fetch(`${API_URL}/chat/voz`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<VozResponse>(response)
}

// ==================== MOVIMIENTOS ====================

export async function obtenerPendientes(): Promise<MovimientoPendiente[]> {
  const response = await fetch(`${API_URL}/movimientos/pendientes`, {
    headers: authHeaders(),
  })
  return handleResponse<MovimientoPendiente[]>(response)
}

export async function marcarProcesado(movimientoId: number): Promise<void> {
  const response = await fetch(`${API_URL}/movimientos/${movimientoId}/procesar`, {
    method: 'PUT',
    headers: authHeaders(),
  })
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sesion expirada')
  }
  if (!response.ok) {
    throw new Error('Error al marcar como procesado')
  }
}

// ==================== CLIENTES ====================

export async function obtenerClientes(): Promise<Cliente[]> {
  const response = await fetch(`${API_URL}/clientes/`, {
    headers: authHeaders(),
  })
  return handleResponse<Cliente[]>(response)
}

export async function actualizarCliente(clienteId: number, datos: { nombre?: string }): Promise<Cliente> {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'PUT',
    headers: authHeaders('application/json'),
    body: JSON.stringify(datos),
  })
  return handleResponse<Cliente>(response)
}

export async function eliminarCliente(clienteId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/clientes/${clienteId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse<{ message: string }>(response)
}

export async function subirImagenSobre(clienteId: number, file: File): Promise<{ imagen_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/clientes/${clienteId}/subir-sobre`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<{ imagen_url: string }>(response)
}

// ==================== SOBRES ====================

export async function extraerNombreDeSobre(file: File): Promise<ExtraerNombreResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/extraer-nombre`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<ExtraerNombreResponse>(response)
}

export async function crearClienteConSobre(nombre: string, file: File): Promise<CrearClienteResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/crear-cliente?nombre=${encodeURIComponent(nombre)}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<CrearClienteResponse>(response)
}

export async function obtenerClientesConPendientes(): Promise<ClienteConPendientes[]> {
  const response = await fetch(`${API_URL}/sobres/pendientes`, {
    headers: authHeaders(),
  })
  return handleResponse<ClienteConPendientes[]>(response)
}

export async function actualizarSobreCliente(clienteId: number, file: File): Promise<ActualizarSobreResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_URL}/sobres/actualizar-sobre/${clienteId}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<ActualizarSobreResponse>(response)
}

// ==================== ESCRITURAS ====================

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
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse<CrearEscrituraResponse>(response)
}

export async function listarEscrituras(): Promise<Escritura[]> {
  const response = await fetch(`${API_URL}/escrituras`, {
    headers: authHeaders(),
  })
  return handleResponse<Escritura[]>(response)
}

export async function obtenerEscritura(id: number): Promise<EscrituraDetalle> {
  const response = await fetch(`${API_URL}/escrituras/${id}`, {
    headers: authHeaders(),
  })
  return handleResponse<EscrituraDetalle>(response)
}

export async function eliminarEscritura(id: number): Promise<{ success: boolean; mensaje: string }> {
  const response = await fetch(`${API_URL}/escrituras/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  return handleResponse<{ success: boolean; mensaje: string }>(response)
}
