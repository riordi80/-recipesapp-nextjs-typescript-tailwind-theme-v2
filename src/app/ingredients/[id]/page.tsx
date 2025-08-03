'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Euro,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { apiGet, apiDelete, apiPut } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'

interface Ingredient {
  ingredient_id: number
  name: string
  category?: string
  unit?: string
  cost_per_unit?: number
  stock?: number
  stock_minimum?: number
  is_available: boolean
  expiration_date?: string
  season?: string
  allergens?: string[]
  created_at: string
  updated_at: string
}

const seasonTranslations = {
  primavera: 'Primavera',
  verano: 'Verano',
  otoño: 'Otoño',
  invierno: 'Invierno',
  todo_el_año: 'Todo el año'
}

export default function IngredientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ingredientId = params.id as string
  const isNewIngredient = ingredientId === 'new'

  // Toast helpers
  const { success, error: showError } = useToastHelpers()

  // State
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(isNewIngredient)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    allergens: [] as string[]
  })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    cost_per_unit: '',
    stock: '',
    stock_minimum: '',
    is_available: true,
    expiration_date: '',
    season: 'todo_el_año',
    allergens: [] as string[]
  })

  // Options for select fields
  const unitOptions = [
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'g', label: 'Gramos (g)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'ud', label: 'Unidades (ud)' },
    { value: 'paquete', label: 'Paquetes' },
    { value: 'lata', label: 'Latas' },
    { value: 'botella', label: 'Botellas' }
  ]

  const seasonOptions = [
    { value: 'primavera', label: 'Primavera' },
    { value: 'verano', label: 'Verano' },
    { value: 'otoño', label: 'Otoño' },
    { value: 'invierno', label: 'Invierno' },
    { value: 'todo_el_año', label: 'Todo el año' }
  ]

  // Load data
  useEffect(() => {
    if (!isNewIngredient) {
      loadIngredientData()
    } else {
      initializeNewIngredient()
    }
    loadFilterOptions()
  }, [ingredientId, isNewIngredient])

  const initializeNewIngredient = () => {
    setIngredient({
      ingredient_id: 0,
      name: '',
      category: '',
      unit: 'kg',
      cost_per_unit: 0,
      stock: 0,
      stock_minimum: 0,
      is_available: true,
      expiration_date: '',
      season: 'todo_el_año',
      allergens: [],
      created_at: '',
      updated_at: ''
    })
    setLoading(false)
  }

  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, allergensRes] = await Promise.all([
        apiGet('/ingredient-categories'),
        apiGet('/allergens')
      ])
      
      setFilterOptions({
        categories: categoriesRes.data.map((c: any) => c.name || c),
        allergens: allergensRes.data.map((a: any) => a.name || a)
      })
    } catch (error) {
      console.error('Error loading filter options:', error)
      // Fallback to empty arrays
      setFilterOptions({
        categories: [],
        allergens: []
      })
    }
  }

  const loadIngredientData = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Ingredient>(`/ingredients/${ingredientId}`)
      const ingredientData = response.data
      setIngredient(ingredientData)
      
      // Format date for input (YYYY-MM-DD)
      let expirationDate = ''
      if (ingredientData.expiration_date) {
        expirationDate = new Date(ingredientData.expiration_date).toISOString().split('T')[0]
      }
      
      // Set form data
      setFormData({
        name: ingredientData.name || '',
        category: ingredientData.category || '',
        unit: ingredientData.unit || 'kg',
        cost_per_unit: ingredientData.cost_per_unit?.toString() || '',
        stock: ingredientData.stock?.toString() || '',
        stock_minimum: ingredientData.stock_minimum?.toString() || '',
        is_available: ingredientData.is_available,
        expiration_date: expirationDate,
        season: ingredientData.season || 'todo_el_año',
        allergens: ingredientData.allergens || []
      })
      
      setError(null)
    } catch (err) {
      setError('Error al cargar el ingrediente')
      console.error('Error loading ingredient:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'El nombre del ingrediente es obligatorio'
      }
      
      if (!formData.unit) {
        errors.unit = 'La unidad de medida es obligatoria'
      }
      
      if (formData.cost_per_unit && (isNaN(Number(formData.cost_per_unit)) || Number(formData.cost_per_unit) < 0)) {
        errors.cost_per_unit = 'El costo debe ser un número positivo'
      }
      
      if (formData.stock && (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) {
        errors.stock = 'El stock debe ser un número positivo'
      }
      
      if (formData.stock_minimum && (isNaN(Number(formData.stock_minimum)) || Number(formData.stock_minimum) < 0)) {
        errors.stock_minimum = 'El stock mínimo debe ser un número positivo'
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setMessage('Por favor, corrige los errores en el formulario')
        return
      }

      const ingredientData = {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        unit: formData.unit,
        cost_per_unit: formData.cost_per_unit ? Number(formData.cost_per_unit) : null,
        stock: formData.stock ? Number(formData.stock) : null,
        stock_minimum: formData.stock_minimum ? Number(formData.stock_minimum) : null,
        is_available: formData.is_available,
        expiration_date: formData.expiration_date || null,
        season: formData.season || null,
        allergens: formData.allergens.length > 0 ? formData.allergens : null
      }

      if (isNewIngredient) {
        const response = await apiPost<{ ingredient_id: number }>('/ingredients', ingredientData)
        router.push(`/ingredients/${response.data.ingredient_id}`)
      } else {
        await apiPut(`/ingredients/${ingredientId}`, ingredientData)
        await loadIngredientData()
        setIsEditing(false)
        setMessage('Ingrediente actualizado correctamente')
        success(`Ingrediente "${ingredientData.name}" actualizado exitosamente`, 'Ingrediente Actualizado')
        setTimeout(() => setMessage(null), 3000)
      }
      
      setValidationErrors({})
    } catch (err) {
      setError(isNewIngredient ? 'Error al crear el ingrediente' : 'Error al guardar el ingrediente')
      console.error('Error saving ingredient:', err)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/ingredients/${ingredientId}`)
      router.push('/ingredients')
    } catch (err) {
      setError('Error al eliminar el ingrediente')
      console.error('Error deleting ingredient:', err)
      // Keep modal open on error
    }
  }

  const handleAllergenChange = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
  }

  // Calculate metrics
  const calculateStockMetrics = () => {
    if (!ingredient) return null

    const stock = Number(formData.stock) || Number(ingredient.stock) || 0
    const stockMin = Number(formData.stock_minimum) || Number(ingredient.stock_minimum) || 0
    const costPerUnit = Number(formData.cost_per_unit) || Number(ingredient.cost_per_unit) || 0
    
    const totalValue = stock * costPerUnit
    const stockStatus = stock === 0 ? 'Sin stock' : stock < stockMin && stockMin > 0 ? 'Stock bajo' : 'Stock OK'
    const stockDeficit = stock < stockMin ? stockMin - stock : 0

    return {
      stock,
      stockMin,
      costPerUnit,
      totalValue,
      stockStatus,
      stockDeficit
    }
  }

  // Format functions
  const formatCurrency = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0,' + '0'.repeat(decimals) + '€'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return '0,' + '0'.repeat(decimals) + '€'
    
    const formatted = numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return `${formatted}€`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return null
    const expiry = new Date(dateString)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!ingredient && !isNewIngredient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se encontró el ingrediente</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header siguiendo el patrón de TotXo */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/ingredients')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewIngredient ? 'Nuevo Ingrediente' : (ingredient?.name || 'Cargando...')}
              </h1>
              {ingredient && !isEditing && (
                <div className="flex items-center space-x-2 mt-1">
                  {ingredient.category && (
                    <span className="text-sm text-gray-500">{ingredient.category}</span>
                  )}
                  {ingredient.season && (
                    <>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{seasonTranslations[ingredient.season as keyof typeof seasonTranslations] || ingredient.season}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewIngredient && !isEditing && (
              <>
                <button
                  onClick={toggleEdit}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={openDeleteModal}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </button>
              </>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isNewIngredient ? 'Crear' : 'Guardar'}
                </button>
                {!isNewIngredient && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadIngredientData()
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600">{message}</p>
          </div>
        )}

        {/* Stats Cards siguiendo patrón TotXo */}
        {ingredient && !isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Actual</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ingredient.stock ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{ingredient.unit || 'ud'}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo/Unidad</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(ingredient.cost_per_unit)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Euro className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  {(() => {
                    const metrics = calculateStockMetrics()
                    return (
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? formatCurrency(metrics.totalValue) : formatCurrency(0)}
                      </p>
                    )
                  })()}
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  {(() => {
                    const metrics = calculateStockMetrics()
                    const statusColor = metrics?.stockStatus === 'Stock OK' ? 'text-green-600' : 
                                       metrics?.stockStatus === 'Stock bajo' ? 'text-yellow-600' : 'text-red-600'
                    return (
                      <p className={`text-lg font-bold mt-1 ${statusColor}`}>
                        {metrics?.stockStatus || 'Desconocido'}
                      </p>
                    )
                  })()}
                  {ingredient.is_available ? (
                    <p className="text-xs text-green-600 mt-1">Disponible</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">No disponible</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${(() => {
                  const metrics = calculateStockMetrics()
                  return metrics?.stockStatus === 'Stock OK' ? 'bg-green-100' : 
                         metrics?.stockStatus === 'Stock bajo' ? 'bg-yellow-100' : 'bg-red-100'
                })()}`}>
                  {(() => {
                    const metrics = calculateStockMetrics()
                    const IconComponent = metrics?.stockStatus === 'Stock OK' ? CheckCircle : AlertTriangle
                    const iconColor = metrics?.stockStatus === 'Stock OK' ? 'text-green-600' : 
                                     metrics?.stockStatus === 'Stock bajo' ? 'text-yellow-600' : 'text-red-600'
                    return <IconComponent className={`h-6 w-6 ${iconColor}`} />
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📦 Información Básica</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del ingrediente <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Nombre del ingrediente"
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{ingredient?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar categoría</option>
                        {filterOptions.categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.category || 'Sin categoría'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          {unitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {validationErrors.unit && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.unit}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {unitOptions.find(opt => opt.value === ingredient?.unit)?.label || ingredient?.unit || 'No especificada'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo por unidad (€)
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cost_per_unit}
                          onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {validationErrors.cost_per_unit && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.cost_per_unit}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {formatCurrency(ingredient?.cost_per_unit)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temporada
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {seasonOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {seasonTranslations[ingredient?.season as keyof typeof seasonTranslations] || ingredient?.season || 'No especificada'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Availability checkbox */}
                {isEditing && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                      Disponible para uso
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Inventario</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock actual
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      {validationErrors.stock && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.stock}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {ingredient?.stock ?? 0} {ingredient?.unit || 'ud'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock mínimo
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stock_minimum}
                        onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0"
                      />
                      {validationErrors.stock_minimum && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.stock_minimum}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900">
                      {ingredient?.stock_minimum ?? 0} {ingredient?.unit || 'ud'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de caducidad
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {formatDate(ingredient?.expiration_date)}
                      </span>
                      {ingredient?.expiration_date && (() => {
                        const days = getDaysUntilExpiry(ingredient.expiration_date)
                        if (days && days <= 7) {
                          return (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              days < 0 ? 'bg-red-100 text-red-800' :
                              days <= 3 ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {days < 0 ? 'Caducado' : `${days}d`}
                            </span>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Allergens */}
            {(filterOptions.allergens.length > 0 || ingredient?.allergens?.length) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alérgenos</h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filterOptions.allergens.map((allergen) => (
                      <label key={allergen} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allergens.includes(allergen)}
                          onChange={() => handleAllergenChange(allergen)}
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">{allergen}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <>
                    {ingredient?.allergens && ingredient.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {ingredient.allergens.map((allergen, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {allergen}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Este ingrediente no contiene alérgenos conocidos
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stock Analysis */}
            {ingredient && !isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Análisis de Stock</h3>
                {(() => {
                  const metrics = calculateStockMetrics()
                  if (!metrics) return null
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock actual:</span>
                        <span className="font-medium text-gray-900">{metrics.stock} {ingredient.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock mínimo:</span>
                        <span className="font-medium text-gray-900">{metrics.stockMin} {ingredient.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valor total:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(metrics.totalValue)}</span>
                      </div>
                      {metrics.stockDeficit > 0 && (
                        <div className="flex items-center justify-between border-t pt-4">
                          <span className="text-sm text-red-600">Déficit de stock:</span>
                          <span className="font-medium text-red-600">{metrics.stockDeficit} {ingredient.unit}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Additional Info */}
            {ingredient && !isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información Adicional</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disponibilidad:</span>
                    <span className={`text-sm font-medium ${ingredient.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {ingredient.is_available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Creado:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(ingredient.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Actualizado:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(ingredient.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el ingrediente "${ingredient?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  )
}