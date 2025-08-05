'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SettingsContextType {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: React.ReactNode
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [soundEnabled, setSoundEnabledState] = useState(true)

  // Cargar configuración desde localStorage al inicializar
  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem('toast-sound-enabled')
    if (savedSoundEnabled !== null) {
      setSoundEnabledState(JSON.parse(savedSoundEnabled))
    }
  }, [])

  // Función para actualizar el estado y persistir en localStorage
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled)
    localStorage.setItem('toast-sound-enabled', JSON.stringify(enabled))
  }

  const value = {
    soundEnabled,
    setSoundEnabled
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}