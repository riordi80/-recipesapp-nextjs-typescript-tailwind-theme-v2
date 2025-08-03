'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ChefHat, Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuario autenticado, redirigir al dashboard
        router.push('/dashboard')
      } else {
        // Usuario no autenticado, redirigir al login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RecetasAPI</h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return null
}