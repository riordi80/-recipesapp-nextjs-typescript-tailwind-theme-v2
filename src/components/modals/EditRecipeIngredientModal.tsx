'use client'

import { useState, useEffect } from 'react'
import FormModal from '@/components/ui/FormModal'

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

interface EditRecipeIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (ingredientData: RecipeIngredient) => void
  ingredient: RecipeIngredient | null
  sections: Section[]
}

export default function EditRecipeIngredientModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  ingredient,
  sections
}: EditRecipeIngredientModalProps) {
  const [formData, setFormData] = useState({
    quantity_per_serving: '',
    unit: '',
    base_price: '',
    waste_percent: '0',
    section_id: undefined as number | undefined
  })

  // Cargar datos del ingrediente cuando se abre el modal
  useEffect(() => {
    if (isOpen && ingredient) {
      setFormData({
        quantity_per_serving: ingredient.quantity_per_serving.toString(),
        unit: ingredient.unit || '',
        base_price: ingredient.base_price.toString(),
        waste_percent: ((ingredient.waste_percent || 0) * 100).toString(), // Convert decimal to percentage
        section_id: ingredient.section_id
      })
    }
  }, [isOpen, ingredient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ingredient) return

    if (!formData.quantity_per_serving || parseFloat(formData.quantity_per_serving) <= 0) {
      alert('La cantidad por porción debe ser mayor a 0')
      return
    }

    if (!formData.base_price || parseFloat(formData.base_price) < 0) {
      alert('El precio debe ser un número válido')
      return
    }

    // Crear objeto con datos actualizados
    const updatedIngredient: RecipeIngredient = {
      ...ingredient,
      quantity_per_serving: parseFloat(formData.quantity_per_serving),
      unit: formData.unit,
      base_price: parseFloat(formData.base_price),
      waste_percent: parseFloat(formData.waste_percent) / 100, // Convert percentage to decimal
      section_id: formData.section_id
    }

    onUpdate(updatedIngredient)
    onClose()
  }

  if (!ingredient) return null

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`Editar ingrediente en receta: ${ingredient.name}`}
      size="md"
      submitText="Actualizar"
    >
      <div className="space-y-6">
        {/* Información del ingrediente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Ingrediente</h4>
          <p className="text-gray-700">{ingredient.name}</p>
        </div>

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

        {/* Datos editables */}
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