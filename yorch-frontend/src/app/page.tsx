'use client'

import Link from 'next/link'
import { Camera, MessageCircle, FolderOpen, ClipboardList, FileText } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">Yorch - Asistente de Préstamos</h1>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Bienvenido YORCH</h2>
          <p className="text-gray-600 mt-2">¿Qué deseas hacer hoy?</p>
        </div>

        <div className="space-y-4">
          {/* Botón Subir Sobre */}
          <Link
            href="/subir-sobre"
            className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Subir Sobre</h3>
                <p className="text-gray-500 text-sm">Toma foto de un sobre para registrar un cliente</p>
              </div>
            </div>
          </Link>

          {/* Botón Hablar con Agente */}
          <Link
            href="/chat"
            className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Hablar con tu Agente</h3>
                <p className="text-gray-500 text-sm">Consulta sobres, registra préstamos y abonos</p>
              </div>
            </div>
          </Link>

          {/* Botón Pendientes */}
          <Link
            href="/pendientes"
            className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-orange-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Pendientes</h3>
                <p className="text-gray-500 text-sm">Actualiza sobres con movimientos pendientes</p>
              </div>
            </div>
          </Link>

          {/* Botón Escrituras */}
          <Link
            href="/escrituras"
            className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Escrituras</h3>
                <p className="text-gray-500 text-sm">Guarda documentos y fotos de escrituras</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
