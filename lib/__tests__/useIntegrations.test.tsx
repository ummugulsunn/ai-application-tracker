/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { useIntegrations } from '@/lib/hooks/useIntegrations'
import { integrationService } from '@/lib/integrations/integrationService'

// Mock the integration service
jest.mock('@/lib/integrations/integrationService', () => ({
  integrationService: {
    getConfig: jest.fn(),
    setConfig: jest.fn(),
    syncJobBoards: jest.fn(),
    syncCalendar: jest.fn(),
    syncEmails: jest.fn(),
    syncCloudStorage: jest.fn(),
    performFullSync: jest.fn()
  }
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useIntegrations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with empty integrations', () => {
    ;(integrationService.getConfig as jest.Mock).mockReturnValue(null)
    
    const { result } = renderHook(() => useIntegrations())
    
    expect(result.current.integrations).toEqual({})
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSyncing).toBe(false)
    expect(result.current.errors).toEqual([])
  })

  it('should load existing integrations on mount', () => {
    const mockConfig = {
      enabled: true,
      lastSync: new Date('2024-01-15T10:00:00Z'),
      syncInterval: 60
    }

    ;(integrationService.getConfig as jest.Mock).mockImplementation((platform) => {
      if (platform === 'linkedin') return mockConfig
      return null
    })

    const { result } = renderHook(() => useIntegrations())
    
    expect(result.current.integrations.linkedin).toEqual(mockConfig)
  })

  it('should enable integration successfully', async () => {
    ;(integrationService.getConfig as jest.Mock).mockReturnValue(null)
    ;(integrationService.syncJobBoards as jest.Mock).mockResolvedValue([{
      success: true,
      itemsProcessed: 5,
      itemsAdded: 3,
      itemsUpdated: 2,
      errors: [],
      lastSync: new Date()
    }])

    const { result } = renderHook(() => useIntegrations())
    
    await act(async () => {
      await result.current.enableIntegration('linkedin')
    })
    
    expect(integrationService.setConfig).toHaveBeenCalledWith('linkedin', {
      enabled: true,
      lastSync: expect.any(Date),
      syncInterval: 60
    })
    expect(result.current.integrations.linkedin.enabled).toBe(true)
  })

  it('should disable integration successfully', async () => {
    const { result } = renderHook(() => useIntegrations())
    
    await act(async () => {
      await result.current.disableIntegration('linkedin')
    })
    
    expect(integrationService.setConfig).toHaveBeenCalledWith('linkedin', {
      enabled: false,
      lastSync: undefined,
      syncInterval: 60
    })
    expect(result.current.integrations.linkedin.enabled).toBe(false)
  })

  it('should sync individual platform successfully', async () => {
    const mockResult = {
      success: true,
      itemsProcessed: 3,
      itemsAdded: 2,
      itemsUpdated: 1,
      errors: [],
      lastSync: new Date()
    }

    ;(integrationService.syncCalendar as jest.Mock).mockResolvedValue(mockResult)
    ;(integrationService.getConfig as jest.Mock).mockReturnValue({ enabled: true })

    const { result } = renderHook(() => useIntegrations())
    
    let syncResult
    await act(async () => {
      syncResult = await result.current.syncPlatform('calendar_google')
    })
    
    expect(integrationService.syncCalendar).toHaveBeenCalledWith('google')
    expect(syncResult).toEqual(mockResult)
    expect(result.current.syncResults.calendar_google).toEqual(mockResult)
  })

  it('should handle sync errors gracefully', async () => {
    const error = new Error('Sync failed')
    ;(integrationService.syncCalendar as jest.Mock).mockRejectedValue(error)

    const { result } = renderHook(() => useIntegrations())
    
    let syncResult
    await act(async () => {
      syncResult = await result.current.syncPlatform('calendar_google')
    })
    
    expect(result.current.errors).toContain('Sync failed')
    expect(syncResult.success).toBe(false)
    expect(syncResult.errors).toContain('Sync failed')
  })

  it('should sync all platforms successfully', async () => {
    const mockResults = {
      jobBoards: [{
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }],
      calendar: [{
        success: true,
        itemsProcessed: 2,
        itemsAdded: 1,
        itemsUpdated: 1,
        errors: [],
        lastSync: new Date()
      }],
      email: [],
      storage: []
    }

    ;(integrationService.performFullSync as jest.Mock).mockResolvedValue(mockResults)
    localStorageMock.setItem.mockImplementation(() => {})

    const { result } = renderHook(() => useIntegrations())
    
    let syncResults
    await act(async () => {
      syncResults = await result.current.syncAll()
    })
    
    expect(integrationService.performFullSync).toHaveBeenCalled()
    expect(syncResults).toEqual(mockResults)
    expect(result.current.lastSync).toBeInstanceOf(Date)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'last_full_sync',
      expect.any(String)
    )
  })

  it('should check if integration is enabled', () => {
    const mockConfig = { enabled: true, syncInterval: 60 }
    ;(integrationService.getConfig as jest.Mock).mockImplementation((platform) => {
      if (platform === 'linkedin') return mockConfig
      return null
    })

    const { result } = renderHook(() => useIntegrations())
    
    expect(result.current.isIntegrationEnabled('linkedin')).toBe(true)
    expect(result.current.isIntegrationEnabled('indeed')).toBe(false)
  })

  it('should get integration status correctly', () => {
    const mockConfig = { enabled: true, syncInterval: 60 }
    ;(integrationService.getConfig as jest.Mock).mockImplementation((platform) => {
      if (platform === 'linkedin') return mockConfig
      return null
    })

    const { result } = renderHook(() => useIntegrations())
    
    // Set up sync results
    act(() => {
      result.current.syncResults.linkedin = {
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }
    })
    
    expect(result.current.getIntegrationStatus('linkedin')).toBe('connected')
    expect(result.current.getIntegrationStatus('indeed')).toBe('disconnected')
  })

  it('should return syncing status during sync', async () => {
    ;(integrationService.syncJobBoards as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([{
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }]), 100))
    )

    const { result } = renderHook(() => useIntegrations())
    
    act(() => {
      result.current.syncPlatform('linkedin')
    })
    
    expect(result.current.getIntegrationStatus('linkedin')).toBe('syncing')
  })

  it('should clear errors', () => {
    const { result } = renderHook(() => useIntegrations())
    
    // Set some errors
    act(() => {
      result.current.errors.push('Test error')
    })
    
    expect(result.current.errors).toContain('Test error')
    
    act(() => {
      result.current.clearErrors()
    })
    
    expect(result.current.errors).toEqual([])
  })

  it('should get pending changes count', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'pending_changes') return '5'
      return null
    })

    const { result } = renderHook(() => useIntegrations())
    
    expect(result.current.getPendingChanges()).toBe(5)
  })

  it('should return 0 for pending changes when not set', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useIntegrations())
    
    expect(result.current.getPendingChanges()).toBe(0)
  })

  it('should handle job board sync for specific platforms', async () => {
    const mockResults = [{
      success: true,
      itemsProcessed: 5,
      itemsAdded: 3,
      itemsUpdated: 2,
      errors: [],
      lastSync: new Date()
    }]

    ;(integrationService.syncJobBoards as jest.Mock).mockResolvedValue(mockResults)

    const { result } = renderHook(() => useIntegrations())
    
    let syncResult
    await act(async () => {
      syncResult = await result.current.syncPlatform('linkedin')
    })
    
    expect(integrationService.syncJobBoards).toHaveBeenCalled()
    expect(syncResult).toEqual(mockResults[0])
  })

  it('should handle email sync for specific providers', async () => {
    const mockResult = {
      success: true,
      itemsProcessed: 10,
      itemsAdded: 5,
      itemsUpdated: 3,
      errors: [],
      lastSync: new Date()
    }

    ;(integrationService.syncEmails as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useIntegrations())
    
    let syncResult
    await act(async () => {
      syncResult = await result.current.syncPlatform('email_gmail')
    })
    
    expect(integrationService.syncEmails).toHaveBeenCalledWith('gmail')
    expect(syncResult).toEqual(mockResult)
  })

  it('should handle storage sync for specific providers', async () => {
    const mockResult = {
      success: true,
      itemsProcessed: 2,
      itemsAdded: 0,
      itemsUpdated: 2,
      errors: [],
      lastSync: new Date()
    }

    ;(integrationService.syncCloudStorage as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useIntegrations())
    
    let syncResult
    await act(async () => {
      syncResult = await result.current.syncPlatform('storage_google_drive')
    })
    
    expect(integrationService.syncCloudStorage).toHaveBeenCalledWith('google-drive')
    expect(syncResult).toEqual(mockResult)
  })
})