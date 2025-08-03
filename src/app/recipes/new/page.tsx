'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, ArrowLeft, Save, X } from 'lucide-react'
import { Button, Input, Select, TextArea, FormModal } from '@/components/ui'
import { useToastHelpers } from '@/context/ToastContext'
import { apiPost, apiGet } from '@/lib/api'

interface RecipeFormData {
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | ''
  prep_time: string
  servings: string
  production_servings: string
  cost_per_serving: string
  net_price: string
  categories: string
  instructions: string
  allergens: string[]
}

interface FilterOptions {
  categories: string[]
  allergens: string[]
}

const difficultyOptions = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Intermedio' },
  { value: 'hard', label: 'Difícil' }
]

export default function NewRecipePage() {
  const router = useRouter()
  const { success, error } = useToastHelpers()
  
  const [loading, setLoading] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    allergens: []
  })
  
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    description: '',
    difficulty: '',
    prep_time: '',
    servings: '',
    production_servings: '',
    cost_per_serving: '',
    net_price: '',
    categories: '',
    instructions: '',
    allergens: []
  })

  const [errors, setErrors] = useState<Partial<RecipeFormData>>({})

  // Load filter options
  useEffect(() => {
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, allergensRes] = await Promise.all([
        apiGet('/recipe-categories'),
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
    const newErrors: Partial<RecipeFormData> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }
    
    if (!formData.difficulty) {
      newErrors.difficulty = 'La dificultad es obligatoria'
    }
    
    if (!formData.servings.trim()) {
      newErrors.servings = 'Las porciones son obligatorias'
    } else if (isNaN(Number(formData.servings)) || Number(formData.servings) <= 0) {
      newErrors.servings = 'Las porciones deben ser un número positivo'
    }

    // Optional numeric validations
    if (formData.prep_time && (isNaN(Number(formData.prep_time)) || Number(formData.prep_time) < 0)) {
      newErrors.prep_time = 'El tiempo debe ser un número positivo'
    }
    
    if (formData.production_servings && (isNaN(Number(formData.production_servings)) || Number(formData.production_servings) <= 0)) {
      newErrors.production_servings = 'Las porciones de producción deben ser un número positivo'
    }
    
    if (formData.cost_per_serving && (isNaN(Number(formData.cost_per_serving)) || Number(formData.cost_per_serving) < 0)) {
      newErrors.cost_per_serving = 'El costo por porción debe ser un número positivo'
    }
    
    if (formData.net_price && (isNaN(Number(formData.net_price)) || Number(formData.net_price) < 0)) {
      newErrors.net_price = 'El precio neto debe ser un número positivo'
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
      const recipeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        difficulty: formData.difficulty,
        prep_time: formData.prep_time ? Number(formData.prep_time) : null,
        servings: Number(formData.servings),
        production_servings: formData.production_servings ? Number(formData.production_servings) : null,
        cost_per_serving: formData.cost_per_serving ? Number(formData.cost_per_serving) : null,
        net_price: formData.net_price ? Number(formData.net_price) : null,
        categories: formData.categories.trim() || null,
        instructions: formData.instructions.trim() || null,
        allergens: formData.allergens.length > 0 ? formData.allergens : null
      }

      const response = await apiPost('/recipes', recipeData)
      
      success(`Receta "${recipeData.name}" creada exitosamente`, 'Receta Creada')
      
      // Redirect to recipe detail page
      router.push(`/recipes/${response.data.recipe_id}`)
      
    } catch (err: any) {
      console.error('Error creating recipe:', err)
      error('No se pudo crear la receta. Intente nuevamente.', 'Error al Crear')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/recipes')
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
                <ChefHat className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Nueva Receta</h1>
              </div>
              <p className="text-gray-600">
                Crea una nueva receta para tu colección
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
                label="Nombre de la receta"
                placeholder="Ej: Paella Valenciana"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
            </div>

            <Select
              label="Dificultad"
              placeholder="Selecciona la dificultad"
              options={difficultyOptions}
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
              error={errors.difficulty}
              required
            />

            <Input
              label="Tiempo de preparación (minutos)"
              type="number"
              placeholder="Ej: 45"
              value={formData.prep_time}
              onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
              error={errors.prep_time}
            />

            <Input
              label="Porciones"
              type="number"
              placeholder="Ej: 4"
              value={formData.servings}
              onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
              error={errors.servings}
              required
            />

            <Input
              label="Porciones de producción"
              type="number"
              placeholder="Ej: 20"
              value={formData.production_servings}
              onChange={(e) => setFormData({ ...formData, production_servings: e.target.value })}
              error={errors.production_servings}
              helperText="Para producción en mayor escala"
            />

            {categoryOptions.length > 0 && (
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                options={categoryOptions}
                value={formData.categories}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
              />
            )}
          </div>

          <div className="mt-6">
            <TextArea
              label="Descripción"
              placeholder="Describe brevemente la receta..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Costos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Costo por porción (€)"
              type="number"
              step="0.01"
              placeholder="Ej: 3.50"
              value={formData.cost_per_serving}
              onChange={(e) => setFormData({ ...formData, cost_per_serving: e.target.value })}
              error={errors.cost_per_serving}
            />

            <Input
              label="Precio neto total (€)"
              type="number"
              step="0.01"
              placeholder="Ej: 14.00"
              value={formData.net_price}
              onChange={(e) => setFormData({ ...formData, net_price: e.target.value })}
              error={errors.net_price}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instrucciones</h2>
          
          <TextArea
            label="Pasos de preparación"
            placeholder="Describe paso a paso cómo preparar la receta..."
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            rows={8}
          />
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
            {loading ? 'Creando...' : 'Crear Receta'}
          </Button>
        </div>
      </form>
    </div>
  )
}