'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { apiGet } from '@/lib/api'
import FormModal from '@/components/ui/FormModal'
import { defaultIngredientValues } from '@/constants/forms'

interface Ingredient {
  ingredient_id: number
  name: string
  unit: string
  cost_per_unit?: number
}

interface Section {
  section_id: number
  name: string
}

interface RecipeIngredient {
  ingredient_id: number
  name: string
  quantity_per_serving: number
  unit: string
  base_price: number
  waste_percent: number
  section_id?: number
}

interface AddIngredientToRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (ingredient: RecipeIngredient) => void
  sections: Section[]
  existingIngredients: RecipeIngredient[]
}

export default function AddIngredientToRecipeModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  sections,
  existingIngredients 
}: AddIngredientToRecipeModalProps) {
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  
  // Form data usando constantes exactas del frontend original
  const [formData, setFormData] = useState({
    ...defaultIngredientValues,
    section_id: sections.length > 0 ? sections[0].section_id : undefined
  })

  useEffect(() => {
    if (isOpen) {
      loadAvailableIngredients()
      resetForm()
    }
  }, [isOpen]) // Dependencies are intentionally limited

  const loadAvailableIngredients = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Ingredient[]>('/ingredients')
      // Filtrar ingredientes que ya están en la receta
      const existingIds = existingIngredients.map(ing => ing.ingredient_id)
      const filtered = response.data?.filter(ing => !existingIds.includes(ing.ingredient_id)) || []
      setAvailableIngredients(filtered)
    } catch (error) {
      console.error('Error loading ingredients:', error)
      setAvailableIngredients([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedIngredient(null)
    setSearchTerm('')
    setFormData({
      ...defaultIngredientValues,
      section_id: sections.length > 0 ? sections[0].section_id : undefined
    })
  }

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleIngredientSelect = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setFormData({
      ...formData,
      unit: ingredient.unit || '',
      base_price: ingredient.cost_per_unit?.toString() || ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedIngredient) {
      alert('Debes seleccionar un ingrediente')
      return
    }

    if (!formData.quantity_per_serving || parseFloat(formData.quantity_per_serving) <= 0) {
      alert('La cantidad por porción debe ser mayor a 0')
      return
    }

    if (!formData.base_price || parseFloat(formData.base_price) < 0) {
      alert('El precio debe ser un número válido')
      return
    }

    // Formato exacto esperado por el backend (como en el frontend original)
    const ingredientData: RecipeIngredient = {
      ingredient_id: selectedIngredient.ingredient_id,
      name: selectedIngredient.name,
      quantity_per_serving: parseFloat(formData.quantity_per_serving),
      unit: formData.unit,
      base_price: parseFloat(formData.base_price),
      waste_percent: parseFloat(formData.waste_percent) / 100, // Convert percentage to decimal (EXACTO del original)
      section_id: formData.section_id
    }

    onAdd(ingredientData)
    onClose()
    resetForm()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Añadir Ingrediente a la Receta"
      size="lg"
      loading={loading}
      submitText="Añadir Ingrediente"
      submitDisabled={!selectedIngredient}
    >
      <div className="space-y-6">
        {/* Búsqueda de ingrediente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Ingrediente <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Buscar ingrediente..."
            />
          </div>

          {/* Lista de ingredientes disponibles */}
          <div className="mt-2 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando ingredientes...</div>
            ) : filteredIngredients.length > 0 ? (
              filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.ingredient_id}
                  type="button"
                  onClick={() => handleIngredientSelect(ingredient)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedIngredient?.ingredient_id === ingredient.ingredient_id
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{ingredient.name}</div>
                  <div className="text-sm text-gray-500">
                    {ingredient.unit} • {ingredient.cost_per_unit ? `${ingredient.cost_per_unit}€/${ingredient.unit}` : 'Sin precio'}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron ingredientes disponibles' : 'Escribe para buscar ingredientes'}
              </div>
            )}
          </div>
        </div>

        {/* Ingrediente seleccionado */}
        {selectedIngredient && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Ingrediente Seleccionado</h4>
            <p className="text-orange-700">{selectedIngredient.name}</p>
          </div>
        )}

        {/* Sección (si hay secciones disponibles) */}
        {sections.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sección (opcional)
            </label>
            <select
              value={formData.section_id || ''}
              onChange={(e) => setFormData({ ...formData, section_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Sin sección</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Datos del ingrediente en la receta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad por porción <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity_per_serving}
              onChange={(e) => setFormData({ ...formData, quantity_per_serving: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unidad
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="kg, litros, unidades..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio por unidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merma (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.waste_percent}
              onChange={(e) => setFormData({ ...formData, waste_percent: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </FormModal>
  )
}