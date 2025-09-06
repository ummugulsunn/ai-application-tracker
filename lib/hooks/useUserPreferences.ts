import { useEffect } from 'react'
import { usePreferencesStore, applyThemePreference, initializePreferences } from '@/store/preferencesStore'
import { useAuthStore } from '@/store/authStore'
import { UserPreferences } from '@/types/auth'

export function useUserPreferences() {
  const { isAuthenticated } = useAuthStore()
  const { preferences, isLoading, loadPreferences, savePreferences, getPreference } = usePreferencesStore()

  // Initialize preferences when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !preferences) {
      initializePreferences()
    }
  }, [isAuthenticated, preferences])

  // Apply theme preference when it changes
  useEffect(() => {
    if (preferences?.theme) {
      applyThemePreference()
    }
  }, [preferences?.theme])

  // Listen for system theme changes when using system preference
  useEffect(() => {
    if (preferences?.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        applyThemePreference()
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    return
  }, [preferences?.theme])

  return {
    preferences,
    isLoading,
    loadPreferences,
    savePreferences,
    getPreference,
  }
}

// Hook for dashboard-specific preferences
export function useDashboardPreferences() {
  const { getPreference } = useUserPreferences()

  return {
    layout: getPreference('dashboardLayout'),
    defaultView: getPreference('defaultView'),
    itemsPerPage: getPreference('itemsPerPage'),
    showCompleted: getPreference('showCompletedApplications'),
    defaultSortBy: getPreference('defaultSortBy'),
    defaultSortOrder: getPreference('defaultSortOrder'),
  }
}

// Hook for notification preferences
export function useNotificationPreferences() {
  const { getPreference } = useUserPreferences()

  return {
    emailNotifications: getPreference('emailNotifications'),
    reminderFrequency: getPreference('reminderFrequency'),
    aiRecommendations: getPreference('aiRecommendations'),
    followUpReminders: getPreference('followUpReminders'),
    interviewReminders: getPreference('interviewReminders'),
    applicationDeadlines: getPreference('applicationDeadlines'),
  }
}

// Hook for UI preferences
export function useUIPreferences() {
  const { getPreference } = useUserPreferences()

  return {
    theme: getPreference('theme'),
    language: getPreference('language'),
    timezone: getPreference('timezone'),
    dateFormat: getPreference('dateFormat'),
    currency: getPreference('currency'),
  }
}

// Hook for privacy preferences
export function usePrivacyPreferences() {
  const { getPreference } = useUserPreferences()

  return {
    dataRetention: getPreference('dataRetention'),
    shareAnalytics: getPreference('shareAnalytics'),
    allowDataExport: getPreference('allowDataExport'),
  }
}