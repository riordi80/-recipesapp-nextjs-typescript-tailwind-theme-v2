'use client'

import { Plus, List, Truck } from 'lucide-react'

interface QuickActionsProps {
  onNavigateToTab: (tabId: string) => void
}

export default function QuickActions({ onNavigateToTab }: QuickActionsProps) {
  const actions = [
    {
      label: 'Generar Lista de Compras',
      icon: Plus,
      variant: 'add' as const,
      onClick: () => onNavigateToTab('shopping-list'),
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      hoverColor: 'hover:bg-green-200'
    },
    {
      label: 'Ver Pedidos Activos',  
      icon: List,
      variant: 'view' as const,
      onClick: () => onNavigateToTab('active-orders'),
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:bg-blue-200'
    },
    {
      label: 'Gestionar Proveedores',
      icon: Truck,
      variant: 'edit' as const, 
      onClick: () => onNavigateToTab('suppliers'),
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      hoverColor: 'hover:bg-orange-200'
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Acciones Rápidas
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border border-gray-200 transition-colors ${action.hoverColor} hover:shadow-md`}
            >
              <div className={`p-3 rounded-lg mb-3 ${action.bgColor}`}>
                <IconComponent className={`h-6 w-6 ${action.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}