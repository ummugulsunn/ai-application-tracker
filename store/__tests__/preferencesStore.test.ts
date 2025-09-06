import { usePreferencesStore, getPreference, formatDateByPreference, formatCurrencyByPreference } from '../preferencesStore'

// Mock fetch
global.fetch = jest.fn()

describe('preferencesStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    usePreferencesStore.setState({
      preferences: null,
      isLoading: false,
    })
  })

  it('initializes with null preferences', () => {
    const { preferences, isLoading } = usePreferencesStore.getState()
    expect(preferences).toBeNull()
    expect(isLoading).toBe(false)
  })

  it('sets preferences correctly', () => {
    const testPreferences = {
      emailNotifications: true,
      reminderFrequency: 'Daily' as const,
      aiRecommendations: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      dashboardLayout: 'comfortable' as const,
      defaultView: 'table' as const,
      itemsPerPage: 25,
      showCompletedApplications: true,
      defaultSortBy: 'appliedDate' as const,
      defaultSortOrder: 'desc' as const,
      dataRetention: '2years' as const,
      shareAnalytics: false,
      allowDataExport: true,
      theme: 'system' as const,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY' as const,
      currency: 'USD',
    }

    usePreferencesStore.getState().setPreferences(testPreferences)
    
    const { preferences } = usePreferencesStore.getState()
    expect(preferences).toEqual(testPreferences)
  })

  it('updates preferences correctly', () => {
    const initialPreferences = {
      emailNotifications: true,
      reminderFrequency: 'Daily' as const,
      aiRecommendations: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      dashboardLayout: 'comfortable' as const,
      defaultView: 'table' as const,
      itemsPerPage: 25,
      showCompletedApplications: true,
      defaultSortBy: 'appliedDate' as const,
      defaultSortOrder: 'desc' as const,
      dataRetention: '2years' as const,
      shareAnalytics: false,
      allowDataExport: true,
      theme: 'system' as const,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY' as const,
      currency: 'USD',
    }

    usePreferencesStore.getState().setPreferences(initialPreferences)
    
    const updates = {
      theme: 'dark' as const,
      emailNotifications: false,
    }

    usePreferencesStore.getState().updatePreferences(updates)
    
    const { preferences } = usePreferencesStore.getState()
    expect(preferences?.theme).toBe('dark')
    expect(preferences?.emailNotifications).toBe(false)
    expect(preferences?.reminderFrequency).toBe('Daily') // unchanged
  })

  it('loads preferences from API successfully', async () => {
    const mockPreferences = {
      emailNotifications: false,
      theme: 'dark' as const,
      reminderFrequency: 'Weekly' as const,
      aiRecommendations: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      dashboardLayout: 'comfortable' as const,
      defaultView: 'table' as const,
      itemsPerPage: 25,
      showCompletedApplications: true,
      defaultSortBy: 'appliedDate' as const,
      defaultSortOrder: 'desc' as const,
      dataRetention: '2years' as const,
      shareAnalytics: false,
      allowDataExport: true,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY' as const,
      currency: 'USD',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockPreferences }),
    })

    await usePreferencesStore.getState().loadPreferences()

    const { preferences, isLoading } = usePreferencesStore.getState()
    expect(preferences).toEqual(mockPreferences)
    expect(isLoading).toBe(false)
  })

  it('handles API errors when loading preferences', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    await usePreferencesStore.getState().loadPreferences()

    const { preferences, isLoading } = usePreferencesStore.getState()
    expect(preferences).toBeTruthy() // Should fall back to defaults
    expect(isLoading).toBe(false)
  })

  it('saves preferences to API successfully', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: { 
          preferences: { theme: 'dark', emailNotifications: false } 
        } 
      }),
    })

    const result = await usePreferencesStore.getState().savePreferences({
      theme: 'dark' as const,
      emailNotifications: false,
    })

    expect(result).toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/auth/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('"theme":"dark"'),
    })
  })

  it('handles API errors when saving preferences', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const result = await usePreferencesStore.getState().savePreferences({
      theme: 'dark' as const,
    })

    expect(result).toBe(false)
  })

  it('gets preference with fallback to default', () => {
    // No preferences set
    const theme = usePreferencesStore.getState().getPreference('theme')
    expect(theme).toBe('system') // default value

    // Set preferences
    usePreferencesStore.getState().setPreferences({
      theme: 'dark' as const,
      emailNotifications: true,
      reminderFrequency: 'Daily' as const,
      aiRecommendations: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      dashboardLayout: 'comfortable' as const,
      defaultView: 'table' as const,
      itemsPerPage: 25,
      showCompletedApplications: true,
      defaultSortBy: 'appliedDate' as const,
      defaultSortOrder: 'desc' as const,
      dataRetention: '2years' as const,
      shareAnalytics: false,
      allowDataExport: true,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY' as const,
      currency: 'USD',
    })

    const darkTheme = usePreferencesStore.getState().getPreference('theme')
    expect(darkTheme).toBe('dark')
  })

  it('resets to defaults correctly', () => {
    // Set some preferences
    usePreferencesStore.getState().setPreferences({
      theme: 'dark' as const,
      emailNotifications: false,
      reminderFrequency: 'Never' as const,
      aiRecommendations: true,
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      dashboardLayout: 'comfortable' as const,
      defaultView: 'table' as const,
      itemsPerPage: 25,
      showCompletedApplications: true,
      defaultSortBy: 'appliedDate' as const,
      defaultSortOrder: 'desc' as const,
      dataRetention: '2years' as const,
      shareAnalytics: false,
      allowDataExport: true,
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY' as const,
      currency: 'USD',
    })

    usePreferencesStore.getState().resetToDefaults()

    const { preferences } = usePreferencesStore.getState()
    expect(preferences?.theme).toBe('system')
    expect(preferences?.emailNotifications).toBe(true)
    expect(preferences?.reminderFrequency).toBe('Daily')
  })
})

describe('preference utility functions', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      preferences: {
        emailNotifications: true,
        reminderFrequency: 'Daily' as const,
        aiRecommendations: true,
        followUpReminders: true,
        interviewReminders: true,
        applicationDeadlines: true,
        dashboardLayout: 'comfortable' as const,
        defaultView: 'table' as const,
        itemsPerPage: 25,
        showCompletedApplications: true,
        defaultSortBy: 'appliedDate' as const,
        defaultSortOrder: 'desc' as const,
        dataRetention: '2years' as const,
        shareAnalytics: false,
        allowDataExport: true,
        theme: 'system' as const,
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'DD/MM/YYYY' as const,
        currency: 'EUR',
      },
      isLoading: false,
    })
  })

  it('gets preference with utility function', () => {
    const theme = getPreference('theme')
    expect(theme).toBe('system')
  })

  it('formats date according to preference', () => {
    const date = new Date('2023-12-25')
    const formatted = formatDateByPreference(date)
    
    // Should use DD/MM/YYYY format based on preference
    expect(formatted).toBe('25/12/2023')
  })

  it('formats currency according to preference', () => {
    const amount = 1234.56
    const formatted = formatCurrencyByPreference(amount)
    
    // Should use EUR currency based on preference
    expect(formatted).toContain('€')
    expect(formatted).toContain('1,234.56')
  })
})