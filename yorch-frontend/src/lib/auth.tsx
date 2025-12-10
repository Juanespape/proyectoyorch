'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'yorch_token'
const LOGIN_TIME_KEY = 'yorch_login_time'
const SESSION_DURATION_MS = 6 * 60 * 60 * 1000 // 6 horas en milisegundos

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Cargar token de localStorage al iniciar
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const loginTime = localStorage.getItem(LOGIN_TIME_KEY)

    if (savedToken && loginTime) {
      const elapsed = Date.now() - parseInt(loginTime)
      if (elapsed >= SESSION_DURATION_MS) {
        // Sesión expirada
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(LOGIN_TIME_KEY)
        setIsLoading(false)
      } else {
        setToken(savedToken)
        setIsLoading(false)
        // Configurar timer para cerrar sesión automáticamente
        const timeRemaining = SESSION_DURATION_MS - elapsed
        const timer = setTimeout(() => {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(LOGIN_TIME_KEY)
          setToken(null)
          window.location.href = '/login'
        }, timeRemaining)
        return () => clearTimeout(timer)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Error al iniciar sesion')
    }

    const data = await response.json()
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString())
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LOGIN_TIME_KEY)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

// Helper para obtener headers con autenticacion
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Authorization': `Bearer ${token}`,
  }
}

// Helper para verificar si hay token
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
