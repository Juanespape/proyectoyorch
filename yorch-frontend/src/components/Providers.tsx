'use client'

import { AuthProvider } from '@/lib/auth'
import { AuthGuard } from './AuthGuard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  )
}
