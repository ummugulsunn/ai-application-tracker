'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUserPreferences } from '@/lib/hooks/useUserPreferences'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { preferences, savePreferences } = useUserPreferences()
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  const theme = preferences?.theme || 'system'

  const setTheme = async (newTheme: Theme) => {
    await savePreferences({ theme: newTheme })
  }

  useEffect(() => {
    const applyTheme = () => {
      let resolved: 'light' | 'dark' = 'light'

      if (theme === 'dark') {
        resolved = 'dark'
      } else if (theme === 'light') {
        resolved = 'light'
      } else {
        // System preference
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }

      setResolvedTheme(resolved)

      // Apply to document
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.style.colorScheme = 'dark'
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.style.colorScheme = 'light'
      }
    }

    applyTheme()

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
    return undefined
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}