import React, { createContext, useState, useEffect } from 'react'

export const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Leer preferencia guardada
    const saved = localStorage.getItem('theme-preference')
    if (saved) return saved === 'dark'
    // Si no hay preferencia guardada, usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
