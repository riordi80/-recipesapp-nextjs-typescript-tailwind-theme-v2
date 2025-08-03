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
  Clock, 
  Users, 
  Euro,
  ChefHat,
  AlertTriangle
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import AddIngredientToRecipeModal from '@/components/modals/AddIngredientToRecipeModal'
import EditRecipeIngredientModal from '@/components/modals/EditRecipeIngredientModal'
import ManageSectionsModal from '@/components/modals/ManageSectionsModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Recipe {
  recipe_id: number
  name: string
  instructions?: string
  prep_time?: number
  servings: number
  production_servings: number
  difficulty?: 'easy' | 'medium' | 'hard'
  net_price: number
  is_featured_recipe: boolean
  tax_id: number
  cost_per_serving?: number
  created_at: string
  updated_at: string
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

interface Category {
  category_id: number
  name: string
}

interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Allergen {
  name: string
}

interface Section {
  section_id: number
  name: string
}

import { 
  difficultyOptions, 
  difficultyTranslations, 
  difficultyColors, 
  defaultRecipeValues 
} from '@/constants/forms'

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recipeId = params.id as string
  const isNewRecipe = recipeId === 'new'

  // State
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [nutrition, setNutrition] = useState<Nutrition | null>(null)
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(true) // Siempre iniciar en modo edición
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Modal states
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleteRecipeOpen, setIsDeleteRecipeOpen] = useState(false)
  const [ingredientToEdit, setIngredientToEdit] = useState<RecipeIngredient | null>(null)
  const [ingredientToDelete, setIngredientToDelete] = useState<RecipeIngredient | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    ...defaultRecipeValues,
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    price_per_serving: '' // Nuevo campo para precio por comensal
  })

  // Load data
  useEffect(() => {
    if (!isNewRecipe) {
      loadRecipeData()
    } else {
      initializeNewRecipe()
    }
    loadAvailableCategories()
  }, [recipeId, isNewRecipe]) // Dependencies are intentionally limited to avoid infinite loops

  const initializeNewRecipe = () => {
    setRecipe({
      recipe_id: 0,
      name: '',
      instructions: '',
      prep_time: undefined,
      servings: 1,
      production_servings: 1,
      difficulty: undefined,
      net_price: 0,
      is_featured_recipe: false,
      tax_id: 1,
      created_at: '',
      updated_at: ''
    })
    setIngredients([])
    setCategories([])
    setSelectedCategoryIds([])
    setNutrition(null)
    setAllergens([])
    setLoading(false)
  }

  const loadAvailableCategories = async () => {
    try {
      const response = await apiGet<Category[]>('/recipe-categories')
      setAvailableCategories(response.data)
    } catch (err) {
      // Fallback categories
      setAvailableCategories([
        { category_id: 1, name: 'Entrante' },
        { category_id: 2, name: 'Principal' },
        { category_id: 3, name: 'Postre' },
        { category_id: 4, name: 'Bebida' },
        { category_id: 5, name: 'Comida vegetariana' },
        { category_id: 6, name: 'Ensaladas' }
      ])
    }
  }

  const loadRecipeData = async () => {
    try {
      setLoading(true)
      
      // Load basic recipe data, ingredients, and sections
      const [recipeResponse, ingredientsResponse, sectionsResponse] = await Promise.all([
        apiGet<Recipe>(`/recipes/${recipeId}`),
        apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`),
        apiGet<Section[]>(`/recipes/${recipeId}/sections`)
      ])
      
      const recipeData = recipeResponse.data
      setRecipe(recipeData)
      setIngredients(ingredientsResponse.data || [])
      setSections(sectionsResponse.data || [])
      
      // Set form data
      setFormData({
        name: recipeData.name,
        instructions: recipeData.instructions || '',
        prep_time: recipeData.prep_time?.toString() || '',
        servings: recipeData.servings,
        production_servings: recipeData.production_servings,
        difficulty: recipeData.difficulty || '',
        net_price: recipeData.net_price.toString(),
        price_per_serving: (recipeData.net_price / recipeData.servings).toString(),
        is_featured_recipe: recipeData.is_featured_recipe,
        tax_id: recipeData.tax_id
      })
      
      // Load additional data (non-blocking)
      loadAdditionalData()
      
      setError(null)
    } catch (err) {
      setError('Error al cargar la receta')
      console.error('Error loading recipe:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAdditionalData = async () => {
    // Load nutrition
    try {
      const nutritionResponse = await apiGet<Nutrition>(`/recipes/${recipeId}/nutrition`)
      setNutrition(nutritionResponse.data)
    } catch (nutritionErr) {
      setNutrition(null)
    }
    
    // Load allergens
    try {
      const allergensResponse = await apiGet<Allergen[]>(`/recipes/${recipeId}/allergens`)
      setAllergens(allergensResponse.data || [])
    } catch (allergensErr) {
      setAllergens([])
    }
    
    // Load categories
    try {
      const recipesListResponse = await apiGet<Array<{recipe_id: number, categories: string | string[]}>>('/recipes')
      const recipeWithCategories = recipesListResponse.data.find(r => r.recipe_id === parseInt(recipeId))
      if (recipeWithCategories?.categories) {
        const cats = typeof recipeWithCategories.categories === 'string' 
          ? recipeWithCategories.categories.split(', ').map((cat: string) => cat.trim())
          : Array.isArray(recipeWithCategories.categories) 
          ? recipeWithCategories.categories 
          : [recipeWithCategories.categories]
        setCategories(cats)
      }
    } catch (categoriesErr) {
      setCategories([])
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'El nombre de la receta es obligatorio'
      }
      
      if (!formData.servings || formData.servings <= 0) {
        errors.servings = 'El número de comensales es obligatorio y debe ser mayor a 0'
      }
      
      if (!formData.production_servings || formData.production_servings <= 0) {
        errors.production_servings = 'Las raciones mínimas son obligatorias y deben ser mayor a 0'
      }
      
      if (!formData.price_per_serving || parseFloat(formData.price_per_serving) <= 0) {
        errors.price_per_serving = 'El precio por comensal es obligatorio y debe ser mayor a 0'
      }
      
      if (formData.servings < formData.production_servings) {
        errors.servings = `Los comensales (${formData.servings}) no pueden ser menores que las raciones mínimas (${formData.production_servings})`
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setMessage('Por favor, corrige los errores en el formulario')
        return
      }

      const recipeData = {
        ...formData,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        net_price: parseFloat(formData.price_per_serving) * formData.servings, // Calcular precio total automáticamente
        difficulty: formData.difficulty || null
      }

      if (isNewRecipe) {
        const response = await apiPost<{ id: number }>('/recipes', recipeData)
        const newRecipeId = response.data.id
        
        // Save categories
        if (selectedCategoryIds.length > 0) {
          try {
            await apiPut(`/recipes/${newRecipeId}/categories`, { 
              categoryIds: selectedCategoryIds 
            })
          } catch (categoryErr) {
            console.warn('Error saving categories:', categoryErr)
          }
        }
        
        // Recalculate costs
        try {
          await apiPut(`/recipes/${newRecipeId}/costs`)
        } catch (costErr) {
          console.warn('Error calculating costs:', costErr)
        }
        
        router.push(`/recipes/${newRecipeId}`)
      } else {
        await apiPut(`/recipes/${recipeId}`, recipeData)
        
        // Save categories
        try {
          await apiPut(`/recipes/${recipeId}/categories`, { 
            categoryIds: selectedCategoryIds 
          })
        } catch (categoryErr) {
          console.warn('Error saving categories:', categoryErr)
        }
        
        // Recalculate costs
        await apiPut(`/recipes/${recipeId}/costs`)
        
        await loadRecipeData()
        setIsEditing(false)
        setMessage('Receta actualizada correctamente')
        setTimeout(() => setMessage(null), 3000)
      }
      
      setValidationErrors({})
    } catch (err) {
      setError(isNewRecipe ? 'Error al crear la receta' : 'Error al guardar la receta')
      console.error('Error saving recipe:', err)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteRecipeOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/recipes/${recipeId}`)
      router.push('/recipes')
    } catch (err) {
      setError('Error al eliminar la receta')
      console.error('Error deleting recipe:', err)
      // Keep modal open on error
    }
  }

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId])
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
    }
  }

  const toggleEdit = () => {
    if (!isEditing && categories.length > 0 && availableCategories.length > 0) {
      const categoryIds = categories.map(categoryName => {
        const found = availableCategories.find(cat => cat.name === categoryName)
        return found ? found.category_id : null
      }).filter(id => id !== null) as number[]
      setSelectedCategoryIds(categoryIds)
    }
    setIsEditing(!isEditing)
  }

  // Función para añadir ingrediente a la receta
  const handleAddIngredient = async (ingredientData: RecipeIngredient) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, añadir al estado temporal
        setIngredients([...ingredients, ingredientData])
      } else {
        // Para recetas existentes, hacer llamada al backend
        await apiPost(`/recipes/${recipeId}/ingredients`, ingredientData)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      setMessage('Ingrediente añadido correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error adding ingredient:', error)
      setError('Error al añadir el ingrediente')
    }
  }

  // Función para editar ingrediente de la receta
  const handleEditIngredient = async (updatedIngredient: RecipeIngredient) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, actualizar en el estado temporal
        setIngredients(ingredients.map(ing => 
          ing.ingredient_id === updatedIngredient.ingredient_id ? updatedIngredient : ing
        ))
      } else {
        // Encontrar el ingrediente original para obtener la sección actual
        const originalIngredient = ingredients.find(ing => ing.ingredient_id === updatedIngredient.ingredient_id)
        
        // Preparar datos para el backend según la estructura esperada
        const updateData = {
          quantity_per_serving: updatedIngredient.quantity_per_serving,
          section_id: updatedIngredient.section_id,
          current_section_id: originalIngredient?.section_id || null,
          // Agregar otros campos que podrían ser necesarios
          base_price: updatedIngredient.base_price,
          waste_percent: updatedIngredient.waste_percent,
          unit: updatedIngredient.unit
        }
        
        // Para recetas existentes, hacer llamada al backend
        await apiPut(`/recipes/${recipeId}/ingredients/${updatedIngredient.ingredient_id}`, updateData)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      setMessage('Ingrediente actualizado correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating ingredient:', error)
      setError('Error al actualizar el ingrediente')
    }
  }

  // Función para eliminar ingrediente
  const handleDeleteIngredient = async () => {
    if (!ingredientToDelete) return

    try {
      if (isNewRecipe) {
        // Para recetas nuevas, eliminar del estado temporal
        setIngredients(ingredients.filter(ing => ing.ingredient_id !== ingredientToDelete.ingredient_id))
      } else {
        // Para recetas existentes, hacer llamada al backend
        await apiDelete(`/recipes/${recipeId}/ingredients/${ingredientToDelete.ingredient_id}`)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      setMessage('Ingrediente eliminado correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      setError('Error al eliminar el ingrediente')
    } finally {
      setIsDeleteConfirmOpen(false)
      setIngredientToDelete(null)
    }
  }

  // Funciones para gestionar secciones
  const handleAddSection = async (sectionName: string) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, crear sección temporal
        const newSection: Section = {
          section_id: Date.now(), // ID temporal
          name: sectionName
        }
        setSections([...sections, newSection])
      } else {
        // Para recetas existentes, crear en el backend
        await apiPost(`/recipes/${recipeId}/sections`, { name: sectionName })
        // Recargar tanto secciones como ingredientes para actualizar la vista
        const [sectionsResponse, ingredientsResponse] = await Promise.all([
          apiGet<Section[]>(`/recipes/${recipeId}/sections`),
          apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        ])
        setSections(sectionsResponse.data || [])
        setIngredients(ingredientsResponse.data || [])
      }
      setMessage('Sección creada correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error creating section:', error)
      setError('Error al crear la sección')
    }
  }

  const handleUpdateSection = async (updatedSection: Section) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, actualizar en estado temporal
        setSections(sections.map(sec => 
          sec.section_id === updatedSection.section_id ? updatedSection : sec
        ))
      } else {
        // Para recetas existentes, actualizar en el backend
        await apiPut(`/recipes/${recipeId}/sections/${updatedSection.section_id}`, { name: updatedSection.name })
        // Recargar secciones
        const response = await apiGet<Section[]>(`/recipes/${recipeId}/sections`)
        setSections(response.data || [])
      }
      setMessage('Sección actualizada correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error updating section:', error)
      setError('Error al actualizar la sección')
    }
  }

  const handleDeleteSection = async (sectionId: number) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, eliminar del estado temporal
        setSections(sections.filter(sec => sec.section_id !== sectionId))
        // También actualizar ingredientes para quitar la sección
        setIngredients(ingredients.map(ing => 
          ing.section_id === sectionId ? { ...ing, section_id: undefined } : ing
        ))
      } else {
        // Para recetas existentes, eliminar del backend
        await apiDelete(`/recipes/${recipeId}/sections/${sectionId}`)
        // Recargar secciones e ingredientes
        const [sectionsResponse, ingredientsResponse] = await Promise.all([
          apiGet<Section[]>(`/recipes/${recipeId}/sections`),
          apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        ])
        setSections(sectionsResponse.data || [])
        setIngredients(ingredientsResponse.data || [])
      }
      setMessage('Sección eliminada correctamente')
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting section:', error)
      setError('Error al eliminar la sección')
    }
  }

  // Función para obtener los ingredientes a mostrar (igual que en el original)
  const getDisplayIngredients = () => {
    return ingredients
  }

  // Calcular métricas de coste basadas en datos reales (EXACTO del original)
  const calculateCostMetrics = () => {
    if (!recipe) return null

    const netPrice = parseFloat(formData.net_price) || parseFloat(recipe.net_price?.toString()) || 0
    const servings = parseInt(formData.servings?.toString()) || parseInt(recipe.servings?.toString()) || 1
    const productionServings = parseInt(formData.production_servings?.toString()) || parseInt(recipe.production_servings?.toString()) || 1
    
    // Calcular coste total directamente para el número de servings
    let totalCost = 0
    let costPerServing = 0
    
    const displayIngredients = getDisplayIngredients()
    if (displayIngredients && displayIngredients.length > 0) {
      totalCost = displayIngredients.reduce((total, ingredient) => {
        const quantity = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
        const price = parseFloat(ingredient.base_price?.toString()) || 0
        const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
        const wasteMultiplier = 1 + wastePercent
        // Coste para todos los servings
        return total + (quantity * price * wasteMultiplier * servings)
      }, 0)
      
      // Calcular coste por porción a partir del total
      costPerServing = servings > 0 ? totalCost / servings : 0
    }
    
    // Calcular margen y precio sugerido
    // net_price ya es el precio total de la receta, no por porción
    const totalNetPrice = netPrice
    const pricePerServing = netPrice / servings // Calcular precio por porción para mostrar
    const currentMargin = totalNetPrice - totalCost
    const currentMarginPercent = totalNetPrice > 0 ? ((totalNetPrice - totalCost) / totalNetPrice) * 100 : 0
    const suggestedPrice40 = costPerServing > 0 ? costPerServing / 0.6 : 0 // 40% margen sobre coste por porción

    return {
      totalCost,
      costPerServing,
      netPrice,
      totalNetPrice,
      pricePerServing,
      currentMargin,
      currentMarginPercent,
      suggestedPrice40,
      productionServings,
      servings
    }
  }

  // Funciones de formateo EXACTAS del original
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

  const formatDecimal = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0'
    
    return numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false // Sin separadores de miles para números simples
    })
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

  if (!recipe && !isNewRecipe) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se encontró la receta</p>
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
              onClick={() => router.push('/recipes')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewRecipe ? 'Nueva Receta' : (recipe?.name || 'Cargando...')}
              </h1>
              {recipe && !isEditing && recipe.difficulty && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                    {difficultyTranslations[recipe.difficulty]}
                  </span>
                  {categories.length > 0 && (
                    <span className="text-sm text-gray-500">• {categories.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewRecipe && !isEditing && (
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
                  {isNewRecipe ? 'Crear' : 'Guardar'}
                </button>
                {!isNewRecipe && (
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      loadRecipeData()
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
        {recipe && !isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Raciones mínimas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{recipe.production_servings}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Prep.</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {recipe.prep_time ? `${recipe.prep_time}m` : 'N/A'}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Margen</p>
                  {(() => {
                    const metrics = calculateCostMetrics()
                    return (
                      <div className="mt-1">
                        <p className={`text-2xl font-bold ${metrics && metrics.currentMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {metrics ? formatCurrency(metrics.currentMargin) : formatCurrency(0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {metrics ? `${formatDecimal(metrics.currentMarginPercent, 1)}%` : '0%'}
                        </p>
                      </div>
                    )
                  })()}
                </div>
                <div className={`p-3 rounded-lg ${(() => {
                  const metrics = calculateCostMetrics()
                  return metrics && metrics.currentMargin >= 0 ? 'bg-green-100' : 'bg-red-100'
                })()}`}>
                  <Euro className={`h-6 w-6 ${(() => {
                    const metrics = calculateCostMetrics()
                    return metrics && metrics.currentMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  })()}`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingredientes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{ingredients.length}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <ChefHat className="h-6 w-6 text-orange-600" />
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Información Básica</h3>
              
              <div className="space-y-6">
                {/* Name and Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la receta <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Nombre de la receta"
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{recipe?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categorías
                    </label>
                    {isEditing ? (
                      <div className="space-y-2 max-h-24 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {availableCategories.map((category) => (
                          <label key={category.category_id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(category.category_id)}
                              onChange={(e) => handleCategoryChange(category.category_id, e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {categories.length > 0 ? categories.join(', ') : 'Sin categoría'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Time, Difficulty, Production Servings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiempo (min)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.prep_time}
                        onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Minutos"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {recipe?.prep_time ? `${recipe.prep_time} min` : 'No especificado'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dificultad
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '' | 'easy' | 'medium' | 'hard' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar</option>
                        {difficultyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {recipe?.difficulty ? difficultyTranslations[recipe.difficulty] : 'No especificado'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raciones mínimas <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          min="1"
                          value={formData.production_servings}
                          onChange={(e) => setFormData({ ...formData, production_servings: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {validationErrors.production_servings && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.production_servings}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{recipe?.production_servings}</p>
                    )}
                  </div>
                </div>

                {/* Servings and Price */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comensales <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          min={recipe?.production_servings || 1}
                          value={formData.servings}
                          onChange={(e) => {
                            const newServings = parseInt(e.target.value) || 1
                            setFormData({ 
                              ...formData, 
                              servings: newServings,
                              net_price: formData.price_per_serving 
                                ? (parseFloat(formData.price_per_serving) * newServings).toString()
                                : formData.net_price
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        {validationErrors.servings && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.servings}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">{recipe?.servings}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio por comensal <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price_per_serving}
                          onChange={(e) => {
                            const newPricePerServing = e.target.value
                            setFormData({ 
                              ...formData, 
                              price_per_serving: newPricePerServing,
                              net_price: newPricePerServing && formData.servings 
                                ? (parseFloat(newPricePerServing) * formData.servings).toString()
                                : formData.net_price
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {validationErrors.price_per_serving && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.price_per_serving}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {recipe?.net_price && recipe.servings 
                          ? formatCurrency(recipe.net_price / recipe.servings)
                          : formatCurrency(0)
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio total
                    </label>
                    <p className="text-sm text-gray-900">
                      {isEditing && formData.price_per_serving && formData.servings
                        ? formatCurrency(parseFloat(formData.price_per_serving) * formData.servings)
                        : recipe?.net_price 
                        ? formatCurrency(recipe.net_price)
                        : 'Calculado automáticamente'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Analysis - Mobile only */}
            {(() => {
              const metrics = calculateCostMetrics()
              if (!metrics) return null
              
              return (
                <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Análisis de Costes</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste Total:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste por Comensal:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.costPerServing)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio de Venta:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.netPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-600">Margen:</span>
                      <div className="text-right">
                        <span className={`font-medium ${metrics.currentMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(metrics.currentMargin)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatDecimal(metrics.currentMarginPercent, 1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <span className="text-sm text-green-700">Precio Sugerido (40%):</span>
                      <span className="font-medium text-green-700">{formatCurrency(metrics.suggestedPrice40)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Ingredients */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🥕 Ingredientes</h3>
                {isEditing && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setIsManageSectionsOpen(true)}
                      className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Secciones
                    </button>
                    <button 
                      onClick={() => setIsAddIngredientOpen(true)}
                      className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir
                    </button>
                  </div>
                )}
              </div>
              
              {ingredients.length > 0 || sections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Organizar ingredientes por secciones - cada sección en su columna */}
                  {(() => {
                    // Crear un mapa de ingredientes por sección
                    const ingredientsBySection = ingredients.reduce((acc, ingredient) => {
                      const sectionId = ingredient.section_id || 'no-section'
                      if (!acc[sectionId]) {
                        acc[sectionId] = []
                      }
                      acc[sectionId].push(ingredient)
                      return acc
                    }, {} as Record<string, RecipeIngredient[]>)

                    // Asegurar que todas las secciones aparezcan, incluso si están vacías
                    sections.forEach(section => {
                      const sectionId = section.section_id.toString()
                      if (!ingredientsBySection[sectionId]) {
                        ingredientsBySection[sectionId] = []
                      }
                    })

                    return Object.entries(ingredientsBySection).map(([sectionId, sectionIngredients]) => {
                      const section = sectionId === 'no-section' ? null : sections.find(s => s.section_id === parseInt(sectionId))
                      
                      return (
                        <div key={sectionId} className="space-y-3">
                          {/* Encabezado de sección */}
                          {section ? (
                            <h4 className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                              {section.name}
                            </h4>
                          ) : sections.length > 0 ? (
                            <h4 className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                              Sin sección
                            </h4>
                          ) : null}
                          
                          {/* Ingredientes de la sección */}
                          <div className="space-y-2">
                            {sectionIngredients.length > 0 ? sectionIngredients.map((ingredient, index) => {
                              const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
                              const wasteMultiplier = 1 + wastePercent
                              const quantityPerServing = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
                              const price = parseFloat(ingredient.base_price?.toString()) || 0
                              
                              // Calcular cantidad total para el número actual de porciones
                              const currentServings = parseInt(formData.servings?.toString() || '') || parseInt(recipe?.servings?.toString() || '') || 1
                              const totalQuantity = quantityPerServing * currentServings
                              const ingredientCost = totalQuantity * price * wasteMultiplier
                              
                              return (
                                <div key={`${sectionId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{ingredient.name || 'Sin nombre'}</p>
                                    <div className="text-xs text-gray-500">
                                      <div className="font-medium">
                                        {formatDecimal(totalQuantity, 2)} {ingredient.unit || ''}
                                      </div>
                                      <div className="text-xs" style={{ color: '#64748b' }}>
                                        ({quantityPerServing} {ingredient.unit || ''} por porción)
                                      </div>
                                      {wastePercent > 0 && (
                                        <span className="text-orange-600"> (+{formatDecimal(wastePercent * 100, 1)}% merma)</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-gray-900">{formatCurrency(ingredientCost)}</p>
                                      <p className="text-xs text-gray-500">{formatCurrency(price)}/{ingredient.unit}</p>
                                    </div>
                                    {isEditing && (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => {
                                            setIngredientToEdit(ingredient)
                                            setIsEditIngredientOpen(true)
                                          }}
                                          className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                                          title="Editar ingrediente"
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setIngredientToDelete(ingredient)
                                            setIsDeleteConfirmOpen(true)
                                          }}
                                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                                          title="Eliminar ingrediente"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            }) : (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                Sección vacía
                                {isEditing && (
                                  <div className="mt-2">
                                    <button 
                                      onClick={() => setIsAddIngredientOpen(true)}
                                      className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                                    >
                                      Añadir ingrediente
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">🥕</div>
                  <p className="text-sm text-gray-500">No hay ingredientes registrados</p>
                  {isEditing && (
                    <button 
                      onClick={() => setIsAddIngredientOpen(true)}
                      className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
                    >
                      Añadir primer ingrediente
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👨‍🍳 Instrucciones</h3>
              
              {isEditing ? (
                <textarea
                  rows={8}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Instrucciones paso a paso..."
                />
              ) : (
                <div className="prose max-w-none">
                  {recipe?.instructions ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                      {recipe.instructions}
                    </pre>
                  ) : (
                    <p className="text-gray-500 italic">No hay instrucciones registradas</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Analysis */}
            {(() => {
              const metrics = calculateCostMetrics()
              if (!metrics) return null
              
              return (
                <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Análisis de Costes</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste Total:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste por Comensal:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.costPerServing)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio de Venta:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.netPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-600">Margen:</span>
                      <div className="text-right">
                        <span className={`font-medium ${metrics.currentMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(metrics.currentMargin)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatDecimal(metrics.currentMarginPercent, 1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <span className="text-sm text-green-700">Precio Sugerido (40%):</span>
                      <span className="font-medium text-green-700">{formatCurrency(metrics.suggestedPrice40)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Additional Info Cards */}
            {nutrition && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🍎 Información Nutricional</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Calorías:</span>
                    <span className="text-sm font-medium text-gray-900">{nutrition.calories} kcal</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Proteínas:</span>
                    <span className="text-sm font-medium text-gray-900">{nutrition.protein}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Carbohidratos:</span>
                    <span className="text-sm font-medium text-gray-900">{nutrition.carbs}g</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Grasas:</span>
                    <span className="text-sm font-medium text-gray-900">{nutrition.fat}g</span>
                  </div>
                </div>
              </div>
            )}

            {allergens.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alérgenos</h3>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((allergen, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {allergen.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <AddIngredientToRecipeModal
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        onAdd={handleAddIngredient}
        sections={sections}
        existingIngredients={ingredients}
      />

      <EditRecipeIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => {
          setIsEditIngredientOpen(false)
          setIngredientToEdit(null)
        }}
        onUpdate={handleEditIngredient}
        ingredient={ingredientToEdit}
        sections={sections}
      />

      <ManageSectionsModal
        isOpen={isManageSectionsOpen}
        onClose={() => setIsManageSectionsOpen(false)}
        sections={sections}
        onAddSection={handleAddSection}
        onUpdateSection={handleUpdateSection}
        onDeleteSection={handleDeleteSection}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setIngredientToDelete(null)
        }}
        onConfirm={handleDeleteIngredient}
        title="Eliminar Ingrediente"
        message={`¿Estás seguro de que quieres eliminar "${ingredientToDelete?.name}" de esta receta?`}
        confirmText="Eliminar"
        type="danger"
      />

      <ConfirmModal
        isOpen={isDeleteRecipeOpen}
        onClose={() => setIsDeleteRecipeOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar la receta "${recipe?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  )
}