'use client'

import { useState, useEffect } from 'react'
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  Shield,
  Info
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface Allergen {
  allergen_id: number
  name: string
  description?: string
  color?: string
  icon?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
}

const severityLabels = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico'
}

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

export default function AllergensPage() {
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')

  // Load allergens
  useEffect(() => {
    loadAllergens()
  }, [])

  const loadAllergens = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Allergen[]>('/allergens')
      setAllergens(response.data)
      setError(null)
    } catch (err: any) {
      setError('Error al cargar alérgenos')
      console.error('Error loading allergens:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter allergens locally
  const filteredAllergens = allergens.filter(allergen => {
    const matchesSearch = (allergen.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (allergen.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = severityFilter === 'all' || allergen.severity === severityFilter
    
    return matchesSearch && matchesSeverity
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Alérgenos</h1>
            </div>
            <p className="text-gray-600">
              Gestiona alérgenos e información de seguridad alimentaria
            </p>
          </div>
          
          <button className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
            <Plus className="h-5 w-5" />
            <span>Nuevo Alérgeno</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Información Importante
            </h3>
            <p className="text-sm text-blue-800">
              Los alérgenos son sustancias que pueden causar reacciones alérgicas. 
              Mantén esta información actualizada para garantizar la seguridad alimentaria 
              en tus recetas y menús.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alérgenos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todas las severidades</option>
              <option value="low">Bajo</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Allergens Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAllergens.map((allergen) => (
          <div key={allergen.allergen_id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {allergen.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityColors[allergen.severity]}`}>
                      {severityLabels[allergen.severity]}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button className="text-blue-600 hover:text-blue-900 p-1 rounded">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-orange-600 hover:text-orange-900 p-1 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 p-1 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {allergen.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {allergen.description}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>Nivel: {severityLabels[allergen.severity]}</span>
                </div>
                <span>
                  {new Date(allergen.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAllergens.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay alérgenos
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || severityFilter !== 'all'
              ? 'No se encontraron alérgenos con los filtros aplicados'
              : 'Comienza añadiendo información sobre alérgenos'
            }
          </p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
            Añadir Primer Alérgeno
          </button>
        </div>
      )}

      {/* Results Counter */}
      {filteredAllergens.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          Mostrando {filteredAllergens.length} de {allergens.length} alérgenos
        </div>
      )}

      {/* Common Allergens Info */}
      {allergens.length === 0 && !loading && (
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alérgenos Comunes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Cereales con gluten</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Trigo</li>
                <li>• Centeno</li>
                <li>• Cebada</li>
                <li>• Avena</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Frutos secos</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Almendras</li>
                <li>• Nueces</li>
                <li>• Pistachos</li>
                <li>• Anacardos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Productos animales</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Huevos</li>
                <li>• Leche</li>
                <li>• Pescado</li>
                <li>• Crustáceos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Otros</h4>
              <ul className="text-gray-600 space-y-1">
                <li>• Soja</li>
                <li>• Sésamo</li>
                <li>• Sulfitos</li>
                <li>• Mostaza</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}