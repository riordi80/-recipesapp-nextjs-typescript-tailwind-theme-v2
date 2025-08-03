'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Euro, 
  Utensils,
  Download,
  ChefHat
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  budget?: number
  notes?: string
  created_at: string
  updated_at: string
}

interface EventRecipe {
  recipe_id: number
  recipe_name: string
  portions: number
  course_type: 'starter' | 'main' | 'side' | 'dessert' | 'beverage'
  notes?: string
  cost_per_serving?: number
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  planned: 'Planificado',
  confirmed: 'Confirmado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

const courseTypeLabels = {
  starter: 'Entrante',
  main: 'Principal',
  side: 'Acompañamiento',
  dessert: 'Postre',
  beverage: 'Bebida'
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const isNewEvent = eventId === 'new'

  // State
  const [event, setEvent] = useState<Event | null>(null)
  const [eventRecipes, setEventRecipes] = useState<EventRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(isNewEvent)
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    guests_count: 1,
    location: '',
    status: 'planned' as const,
    budget: '',
    notes: ''
  })

  // Load event data
  useEffect(() => {
    if (!isNewEvent) {
      loadEventData()
    } else {
      setLoading(false)
    }
  }, [eventId, isNewEvent])

  const loadEventData = async () => {
    try {
      setLoading(true)
      const eventResponse = await apiGet<Event & { menu?: EventRecipe[] }>(`/events/${eventId}`)
      
      const eventData = eventResponse.data
      setEvent(eventData)
      setEventRecipes(eventData.menu || [])
      
      // Set form data
      setFormData({
        name: eventData.name,
        description: eventData.description || '',
        event_date: eventData.event_date,
        event_time: eventData.event_time || '',
        guests_count: eventData.guests_count,
        location: eventData.location || '',
        status: eventData.status,
        budget: eventData.budget?.toString() || '',
        notes: eventData.notes || ''
      })
      
      setError(null)
    } catch (err: any) {
      setError('Error al cargar el evento')
      console.error('Error loading event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const eventData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        guests_count: parseInt(formData.guests_count.toString())
      }

      if (isNewEvent) {
        const response = await apiPost<{ event_id: number }>('/events', eventData)
        router.push(`/events/${response.data.event_id}`)
      } else {
        await apiPut(`/events/${eventId}`, eventData)
        await loadEventData()
        setIsEditing(false)
        setMessage('Evento actualizado correctamente')
      }
    } catch (err: any) {
      setError('Error al guardar el evento')
      console.error('Error saving event:', err)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/events/${eventId}`)
      router.push('/events')
    } catch (err: any) {
      setError('Error al eliminar el evento')
      console.error('Error deleting event:', err)
      // Keep modal open on error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return timeString.slice(0, 5)
  }

  const calculateTotalCost = () => {
    return eventRecipes.reduce((total, recipe) => {
      return total + (recipe.cost_per_serving || 0) * recipe.portions
    }, 0)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/events')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver a Eventos</span>
          </button>

          <div className="flex items-center space-x-2">
            {!isNewEvent && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={openDeleteModal}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{isNewEvent ? 'Crear' : 'Guardar'}</span>
                </button>
                {!isNewEvent && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadEventData()
                    }}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-orange-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewEvent ? 'Nuevo Evento' : (event?.name || 'Cargando...')}
            </h1>
            {event && !isEditing && (
              <p className="text-gray-600 mt-1">
                {formatDate(event.event_date)} 
                {event.event_time && ` • ${formatTime(event.event_time)}`}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {event && !isEditing && (
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[event.status]}`}>
              {statusLabels[event.status]}
            </span>
          </div>
        )}
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del Evento</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Evento
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre del evento"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{event?.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Descripción del evento"
                  />
                ) : (
                  <p className="text-gray-900">{event?.description || 'Sin descripción'}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event && formatDate(event.event_date)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  {isEditing ? (
                    <input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.event_time ? formatTime(event.event_time) : 'Sin hora especificada'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guests and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Invitados
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1"
                      value={formData.guests_count}
                      onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.guests_count}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ubicación del evento"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.location || 'Sin ubicación especificada'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Budget */}
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="planned">Planificado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Notas adicionales"
                  />
                ) : (
                  <p className="text-gray-900">{event?.notes || 'Sin notas'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Stats */}
          {event && !isEditing && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>
              </div>
              <div className="p-6 space-y-4">
                {event.budget && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Presupuesto:</span>
                    <div className="flex items-center space-x-1">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {event.budget.toLocaleString('es-ES', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Costo Total Menú:</span>
                  <div className="flex items-center space-x-1">
                    <Euro className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {calculateTotalCost().toLocaleString('es-ES', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Recetas en Menú:</span>
                  <span className="font-medium text-gray-900">{eventRecipes.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          {!isEditing && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Menú del Evento</h3>
                <button className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Añadir Receta</span>
                </button>
              </div>
              
              <div className="p-6">
                {eventRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {eventRecipes.map((recipe) => (
                      <div key={recipe.recipe_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <ChefHat className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{recipe.recipe_name}</p>
                            <p className="text-sm text-gray-500">
                              {courseTypeLabels[recipe.course_type]} • {recipe.portions} porciones
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {recipe.cost_per_serving && (
                            <p className="text-sm font-medium text-gray-900">
                              €{(recipe.cost_per_serving * recipe.portions).toLocaleString('es-ES', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Utensils className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No hay recetas en el menú</p>
                    <button className="mt-2 text-orange-600 hover:text-orange-700 transition-colors">
                      Añadir primera receta
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el evento "${event?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}