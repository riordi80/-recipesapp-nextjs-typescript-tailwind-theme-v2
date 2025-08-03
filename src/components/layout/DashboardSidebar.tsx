'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  Users, 
  Calendar,
  Settings, 
  User, 
  HelpCircle,
  LogOut,
  Menu,
  X,
  BookOpen,
  Palette
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Recetas', 
    href: '/recipes', 
    icon: BookOpen,
    children: [
      { name: 'Categorías', href: '/recipes/categories' },
    ]
  },
  { 
    name: 'Ingredientes', 
    href: '/ingredients', 
    icon: Package,
    children: [
      { name: 'Inventario', href: '/ingredients' },
      { name: 'Alérgenos', href: '/allergens' }
    ]
  },
  { 
    name: 'Proveedores', 
    href: '/suppliers', 
    icon: Users,
    children: [
      { name: 'Lista Proveedores', href: '/suppliers' },
      { name: 'Pedidos', href: '/suppliers/orders' }
    ]
  },
  { 
    name: 'Eventos', 
    href: '/events', 
    icon: Calendar,
    children: [
      { name: 'Eventos', href: '/events' },
      { name: 'Menús', href: '/events/menus' }
    ]
  },
]

const bottomNavigation = [
  { name: 'Demo Componentes', href: '/demo/components', icon: Palette },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  { name: 'Ayuda', href: '/dashboard/help', icon: HelpCircle },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isNavItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <span className="text-xl font-bold text-gray-900">RecetasAPI</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-2 rounded-full">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role === 'admin' ? 'Administrador' : 
               user?.role === 'chef' ? 'Chef' : 
               user?.role === 'supplier_manager' ? 'Gestor de Proveedores' : user?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isNavItemActive(item.href)
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  {
                    'bg-orange-100 text-orange-700': isActive,
                    'text-gray-700 hover:bg-gray-100': !isActive
                  }
                )}
                onClick={() => {
                  if (isMobileMenuOpen) {
                    setIsMobileMenuOpen(false)
                  }
                }}
              >
                <item.icon 
                  className={clsx('mr-3 h-5 w-5', {
                    'text-orange-600': isActive,
                    'text-gray-500': !isActive
                  })} 
                />
                {item.name}
              </Link>
              
              {/* Subnavigation */}
              {item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={clsx(
                        'block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors',
                        {
                          'text-orange-600 bg-orange-50': pathname === child.href
                        }
                      )}
                      onClick={() => {
                        if (isMobileMenuOpen) {
                          setIsMobileMenuOpen(false)
                        }
                      }}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 px-3 py-4 space-y-1">
        {bottomNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false)
              }
            }}
          >
            <item.icon className="mr-3 h-5 w-5 text-gray-500" />
            {item.name}
          </Link>
        ))}
        
        <button 
          onClick={handleLogout}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-md border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}