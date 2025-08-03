'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ArrowLeft, Save, X } from 'lucide-react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { useToastHelpers } from '@/context/ToastContext'
import { apiPost, apiGet } from '@/lib/api'

interface IngredientFormData {
  name: string
  category: string
  unit: string
  cost_per_unit: string
  stock: string
  stock_minimum: string
  is_available: boolean
  expiration_date: string
  season: string
  allergens: string[]
}

interface FilterOptions {
  categories: string[]
  allergens: string[]
}

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

export default function NewIngredientPage() {
  const router = useRouter()
  const { success, error } = useToastHelpers()
  
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    allergens: []
  })
  
  const [formData, setFormData] = useState<IngredientFormData>({
    name: '',
    category: '',
    unit: 'kg',
    cost_per_unit: '',
    stock: '',
    stock_minimum: '',
    is_available: true,
    expiration_date: '',
    season: 'todo_el_año',
    allergens: []
  })

  const [errors, setErrors] = useState<Partial<IngredientFormData>>({})

  // Load filter options
  useEffect(() => {
    loadFilterOptions()
  }, [])

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
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<IngredientFormData> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }
    
    if (!formData.unit) {
      newErrors.unit = 'La unidad es obligatoria'
    }

    // Optional numeric validations
    if (formData.cost_per_unit && (isNaN(Number(formData.cost_per_unit)) || Number(formData.cost_per_unit) < 0)) {
      newErrors.cost_per_unit = 'El costo debe ser un número positivo'
    }
    
    if (formData.stock && (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) {
      newErrors.stock = 'El stock debe ser un número positivo'
    }
    
    if (formData.stock_minimum && (isNaN(Number(formData.stock_minimum)) || Number(formData.stock_minimum) < 0)) {
      newErrors.stock_minimum = 'El stock mínimo debe ser un número positivo'
    }

    // Date validation
    if (formData.expiration_date) {
      const selectedDate = new Date(formData.expiration_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate <= today) {
        newErrors.expiration_date = 'La fecha de caducidad debe ser futura'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      error('Por favor corrige los errores en el formulario', 'Errores de Validación')
      return
    }

    setLoading(true)
    
    try {
      // Convert string numbers to actual numbers for API
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

      const response = await apiPost('/ingredients', ingredientData)
      
      success(`Ingrediente "${ingredientData.name}" creado exitosamente`, 'Ingrediente Creado')
      
      // Redirect to ingredients list
      router.push('/ingredients')
      
    } catch (err: any) {
      console.error('Error creating ingredient:', err)
      error('No se pudo crear el ingrediente. Intente nuevamente.', 'Error al Crear')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/ingredients')
  }

  const categoryOptions = filterOptions.categories.map(cat => ({
    value: cat,
    label: cat
  }))

  const allergenOptions = filterOptions.allergens.map(allergen => ({
    value: allergen,
    label: allergen
  }))

  const handleAllergenChange = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }))
  }

  // Get today's date in YYYY-MM-DD format for min date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Ingrediente</h1>
              </div>
              <p className="text-gray-600">
                Añade un nuevo ingrediente a tu inventario
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Nombre del ingrediente"
                placeholder="Ej: Harina de trigo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
            </div>

            {categoryOptions.length > 0 && (
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            )}

            <Select
              label="Unidad de medida"
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              error={errors.unit}
              required
            />

            <Input
              label="Costo por unidad (€)"
              type="number"
              step="0.01"
              placeholder="Ej: 2.50"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
              error={errors.cost_per_unit}
            />

            <Select
              label="Temporada"
              options={seasonOptions}
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Stock actual"
              type="number"
              step="0.01"
              placeholder="Ej: 50"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              error={errors.stock}
              helperText="Cantidad actual en inventario"
            />

            <Input
              label="Stock mínimo"
              type="number"
              step="0.01"
              placeholder="Ej: 10"
              value={formData.stock_minimum}
              onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
              error={errors.stock_minimum}
              helperText="Alerta cuando el stock baje de este nivel"
            />

            <Input
              label="Fecha de caducidad"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              error={errors.expiration_date}
              min={minDate}
              helperText="Opcional"
            />

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
          </div>
        </div>

        {allergenOptions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alérgenos</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allergenOptions.map((allergen) => (
                <label key={allergen.value} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(allergen.value)}
                    onChange={() => handleAllergenChange(allergen.value)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{allergen.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          
          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creando...' : 'Crear Ingrediente'}
          </Button>
        </div>
      </form>
    </div>
  )
}