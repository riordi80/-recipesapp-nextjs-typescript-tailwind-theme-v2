'use client'

import { useState } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'

interface FilterBarProps {
  // Search
  searchText: string
  onSearchTextChange: (value: string) => void
  
  // Category
  categoryOptions: string[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  
  // Prep Time
  prepTimeOptions: number[]
  selectedPrepTime: number | null
  onPrepTimeChange: (value: number | null) => void
  
  // Difficulty
  difficultyOptions: Array<{ value: string; label: string }>
  selectedDifficulty: string
  onDifficultyChange: (value: string) => void
  
  // Ingredient
  ingredientOptions: string[]
  selectedIngredient: string
  onIngredientChange: (value: string) => void
  
  // Allergens
  allergenOptions: string[]
  selectedAllergens: string[]
  onAllergensChange: (values: string[]) => void
}

export default function FilterBar({
  searchText,
  onSearchTextChange,
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  prepTimeOptions,
  selectedPrepTime,
  onPrepTimeChange,
  difficultyOptions,
  selectedDifficulty,
  onDifficultyChange,
  ingredientOptions,
  selectedIngredient,
  onIngredientChange,
  allergenOptions,
  selectedAllergens,
  onAllergensChange
}: FilterBarProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showAllergenDropdown, setShowAllergenDropdown] = useState(false)

  const hasActiveFilters = selectedCategory || selectedPrepTime || selectedDifficulty || 
                          selectedIngredient || selectedAllergens.length > 0

  const clearAllFilters = () => {
    onCategoryChange('')
    onPrepTimeChange(null)
    onDifficultyChange('')
    onIngredientChange('')
    onAllergensChange([])
  }

  const handleAllergenToggle = (allergen: string) => {
    if (selectedAllergens.includes(allergen)) {
      onAllergensChange(selectedAllergens.filter(a => a !== allergen))
    } else {
      onAllergensChange([...selectedAllergens, allergen])
    }
  }

  const formatPrepTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      {/* Main Filter Row */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={searchText}
              onChange={(e) => onSearchTextChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-w-0"
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-w-0"
            >
              <option value="">Todas las dificultades</option>
              {difficultyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                showAdvancedFilters || hasActiveFilters
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {[selectedCategory, selectedPrepTime, selectedDifficulty, selectedIngredient]
                    .filter(Boolean).length + (selectedAllergens.length > 0 ? 1 : 0)}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Prep Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de preparación
              </label>
              <select
                value={selectedPrepTime || ''}
                onChange={(e) => onPrepTimeChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Cualquier tiempo</option>
                {prepTimeOptions.map(time => (
                  <option key={time} value={time}>
                    Hasta {formatPrepTime(time)}
                  </option>
                ))}
              </select>
            </div>

            {/* Ingredient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contiene ingrediente
              </label>
              <select
                value={selectedIngredient}
                onChange={(e) => onIngredientChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Cualquier ingrediente</option>
                {ingredientOptions.map(ingredient => (
                  <option key={ingredient} value={ingredient}>
                    {ingredient}
                  </option>
                ))}
              </select>
            </div>

            {/* Allergens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excluir alérgenos
              </label>
              <div className="relative">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    setShowAllergenDropdown(!showAllergenDropdown)
                  }}
                  onFocus={(e) => e.target.blur()}
                  onChange={() => {}} // Prevent React warning
                  value=""
                >
                  <option value="">
                    {selectedAllergens.length === 0 
                      ? 'Seleccionar alérgenos...'
                      : selectedAllergens.length === 1
                      ? selectedAllergens[0]
                      : `${selectedAllergens.length} alérgenos seleccionados`
                    }
                  </option>
                </select>
                
                {showAllergenDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {allergenOptions.map(allergen => (
                      <label key={allergen} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAllergens.includes(allergen)}
                          onChange={() => handleAllergenToggle(allergen)}
                          className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{allergen}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearAllFilters}
                  className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Limpiar filtros</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Filters Tags */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Categoría: {selectedCategory}
                    <button
                      onClick={() => onCategoryChange('')}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedPrepTime && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Tiempo: {formatPrepTime(selectedPrepTime)}
                    <button
                      onClick={() => onPrepTimeChange(null)}
                      className="ml-1 hover:text-green-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Dificultad: {difficultyOptions.find(d => d.value === selectedDifficulty)?.label}
                    <button
                      onClick={() => onDifficultyChange('')}
                      className="ml-1 hover:text-yellow-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedIngredient && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Ingrediente: {selectedIngredient}
                    <button
                      onClick={() => onIngredientChange('')}
                      className="ml-1 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedAllergens.map(allergen => (
                  <span key={allergen} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                    Sin {allergen}
                    <button
                      onClick={() => handleAllergenToggle(allergen)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}