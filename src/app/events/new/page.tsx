'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ArrowLeft, Save, X } from 'lucide-react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { useToastHelpers } from '@/context/ToastContext'
import { apiPost } from '@/lib/api'

interface EventFormData {
  name: string
  description: string
  event_date: string
  event_time: string
  guests_count: string
  location: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | ''
  budget: string
  notes: string
}

const statusOptions = [
  { value: 'planned', label: 'Planificado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' }
]

export default function NewEventPage() {
  const router = useRouter()
  const { success, error } = useToastHelpers()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    guests_count: '',
    location: '',
    status: 'planned',
    budget: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Partial<EventFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<EventFormData> = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }
    
    if (!formData.event_date) {
      newErrors.event_date = 'La fecha es obligatoria'
    }
    
    if (!formData.guests_count.trim()) {
      newErrors.guests_count = 'El número de invitados es obligatorio'
    } else if (isNaN(Number(formData.guests_count)) || Number(formData.guests_count) <= 0) {
      newErrors.guests_count = 'El número de invitados debe ser un número positivo'
    }

    // Optional numeric validations
    if (formData.budget && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) {
      newErrors.budget = 'El presupuesto debe ser un número positivo'
    }

    // Date validation
    if (formData.event_date) {
      const selectedDate = new Date(formData.event_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.event_date = 'La fecha no puede ser anterior a hoy'
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
      const eventData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        guests_count: Number(formData.guests_count),
        location: formData.location.trim() || null,
        status: formData.status || 'planned',
        budget: formData.budget ? Number(formData.budget) : null,
        notes: formData.notes.trim() || null
      }

      const response = await apiPost('/events', eventData)
      
      success(`Evento "${eventData.name}" creado exitosamente`, 'Evento Creado')
      
      // Redirect to event detail page
      router.push(`/events/${response.data.event_id}`)
      
    } catch (err: any) {
      console.error('Error creating event:', err)
      error('No se pudo crear el evento. Intente nuevamente.', 'Error al Crear')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/events')
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

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
                <Calendar className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Nuevo Evento</h1>
              </div>
              <p className="text-gray-600">
                Crea un nuevo evento para tu calendario
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
                label="Nombre del evento"
                placeholder="Ej: Cena de Gala Anual"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
            </div>

            <Input
              label="Fecha del evento"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              error={errors.event_date}
              min={today}
              required
            />

            <Input
              label="Hora del evento"
              type="time"
              value={formData.event_time}
              onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
              helperText="Opcional"
            />

            <Input
              label="Número de invitados"
              type="number"
              placeholder="Ej: 50"
              value={formData.guests_count}
              onChange={(e) => setFormData({ ...formData, guests_count: e.target.value })}
              error={errors.guests_count}
              required
            />

            <Select
              label="Estado"
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            />

            <div className="md:col-span-2">
              <Input
                label="Ubicación"
                placeholder="Ej: Salón Principal, Hotel Majestic"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6">
            <TextArea
              label="Descripción"
              placeholder="Describe el evento..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Presupuesto</h2>
          
          <Input
            label="Presupuesto total (€)"
            type="number"
            step="0.01"
            placeholder="Ej: 2500.00"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            error={errors.budget}
            helperText="Presupuesto estimado para el evento"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas Adicionales</h2>
          
          <TextArea
            label="Notas"
            placeholder="Notas especiales, requerimientos, observaciones..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>

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
            {loading ? 'Creando...' : 'Crear Evento'}
          </Button>
        </div>
      </form>
    </div>
  )
}