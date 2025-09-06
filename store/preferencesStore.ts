import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserPreferences } from '@/types/auth'

interface PreferencesStore {
  preferences: UserPreferences | null
  isLoading: boolean
  
  // Actions
  setPreferences: (preferences: UserPreferences) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  setLoading: (loading: boolean) => void
  
  // API actions
  loadPreferences: () => Promise<void>
  savePreferences: (preferences: Partial<UserPreferences>) => Promise<boolean>
  
  // Utility methods
  getPreference: <K extends keyof UserPreferences>(key: K) => UserPreferences[K] | undefined
  resetToDefaults: () => void
}

const defaultPreferences: UserPreferences = {
  // Notification preferences
  emailNotifications: true,
  reminderFrequency: "Daily",
  aiRecommendations: true,
  followUpReminders: true,
  interviewReminders: true,
  applicationDeadlines: true,
  
  // Dashboard customization
  dashboardLayout: "comfortable",
  defaultView: "table",
  itemsPerPage: 25,
  showCompletedApplications: true,
  defaultSortBy: "appliedDate",
  defaultSortOrder: "desc",
  
  // Privacy controls
  dataRetention: "2years",
  shareAnalytics: false,
  allowDataExport: true,
  
  // UI preferences
  theme: "system",
  language: "en",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: null,
      isLoading: false,

      setPreferences: (preferences) => {
        set({ preferences })
      },

      updatePreferences: (updates) => {
        const current = get().preferences || defaultPreferences
        set({ preferences: { ...current, ...updates } })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      loadPreferences: async () => {
        set({ isLoading: true })
        
        try {
          const response = await fetch("/api/auth/preferences")
          const result = await response.json()

          if (result.success) {
            set({ preferences: result.data })
          } else {
            // Use default preferences if none are found
            set({ preferences: defaultPreferences })
          }
        } catch (error) {
          console.error("Failed to load preferences:", error)
          // Use default preferences on error
          set({ preferences: defaultPreferences })
        } finally {
          set({ isLoading: false })
        }
      },

      savePreferences: async (updates) => {
        const current = get().preferences || defaultPreferences
        const newPreferences = { ...current, ...updates }
        
        set({ isLoading: true })
        
        try {
          const response = await fetch("/api/auth/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPreferences),
          })

          const result = await response.json()

          if (result.success) {
            set({ preferences: result.data.preferences })
            return true
          } else {
            console.error("Failed to save preferences:", result.error)
            return false
          }
        } catch (error) {
          console.error("Failed to save preferences:", error)
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      getPreference: (key) => {
        const preferences = get().preferences
        return preferences ? preferences[key] : defaultPreferences[key]
      },

      resetToDefaults: () => {
        set({ preferences: defaultPreferences })
      },
    }),
    {
      name: 'preferences-store',
      partialize: (state) => ({
        preferences: state.preferences,
      })
    }
  )
)

// Initialize preferences for authenticated users
export const initializePreferences = async () => {
  const store = usePreferencesStore.getState()
  
  // Only load if preferences haven't been loaded yet
  if (!store.preferences) {
    await store.loadPreferences()
  }
}

// Get a specific preference with fallback to default
export const getPreference = <K extends keyof UserPreferences>(
  key: K
): UserPreferences[K] => {
  const store = usePreferencesStore.getState()
  return store.preferences?.[key] ?? defaultPreferences[key]
}

// Apply theme preference to document
export const applyThemePreference = () => {
  const theme = getPreference('theme')
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else if (theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    // System preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// Format date according to user preference
export const formatDateByPreference = (date: Date): string => {
  const format = getPreference('dateFormat')
  
  switch (format) {
    case 'DD/MM/YYYY':
      return date.toLocaleDateString('en-GB')
    case 'YYYY-MM-DD':
      return date.toISOString().split('T')[0] || ''
    case 'MM/DD/YYYY':
    default:
      return date.toLocaleDateString('en-US')
  }
}

// Format currency according to user preference
export const formatCurrencyByPreference = (amount: number): string => {
  const currency = getPreference('currency')
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}