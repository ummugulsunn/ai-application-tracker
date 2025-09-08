/**
 * @jest-environment jsdom
 */

import { integrationService, IntegrationConfig } from '@/lib/integrations/integrationService'

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

// Mock fetch
global.fetch = jest.fn()

describe('IntegrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Configuration Management', () => {
    it('should set and get integration config', () => {
      const config: IntegrationConfig = {
        enabled: true,
        apiKey: 'test-key',
        lastSync: new Date(),
        syncInterval: 60
      }

      integrationService.setConfig('linkedin', config)
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'integration_linkedin',
        JSON.stringify(config)
      )

      localStorageMock.getItem.mockReturnValue(JSON.stringify(config))
      const retrievedConfig = integrationService.getConfig('linkedin')
      
      expect(retrievedConfig).toEqual(config)
    })

    it('should return null for non-existent config', () => {
      const config = integrationService.getConfig('nonexistent')
      expect(config).toBeNull()
    })

    it('should load config from localStorage', () => {
      const config: IntegrationConfig = {
        enabled: true,
        syncInterval: 30
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(config))
      const retrievedConfig = integrationService.getConfig('indeed')
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('integration_indeed')
      expect(retrievedConfig).toEqual(config)
    })
  })

  describe('Job Board Sync', () => {
    it('should sync job boards successfully', async () => {
      const mockResponse = {
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // Mock getConfig to return enabled only for LinkedIn
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'linkedin') return { enabled: true }
        return null
      })

      const results = await integrationService.syncJobBoards()
      
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/job-boards/linkedin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should handle sync errors gracefully', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      })

      // Mock getConfig to return enabled only for LinkedIn
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'linkedin') return { enabled: true }
        return null
      })

      const results = await integrationService.syncJobBoards()
      
      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(false)
      expect(results[0].errors).toContain('Failed to sync linkedin: Internal Server Error')
    })

    it('should skip disabled integrations', async () => {
      // Mock getConfig to return enabled only for Indeed
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'indeed') return { enabled: true }
        return null // LinkedIn and Glassdoor are disabled
      })

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          itemsProcessed: 2,
          itemsAdded: 1,
          itemsUpdated: 1,
          errors: [],
          lastSync: new Date()
        })
      })

      const results = await integrationService.syncJobBoards()
      
      expect(results).toHaveLength(1) // Only Indeed should be synced
      expect(fetch).toHaveBeenCalledWith('/api/integrations/job-boards/indeed/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('Calendar Integration', () => {
    it('should sync Google Calendar successfully', async () => {
      const mockResponse = {
        success: true,
        itemsProcessed: 3,
        itemsAdded: 2,
        itemsUpdated: 1,
        errors: [],
        lastSync: new Date()
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // Mock getConfig to return enabled for Google Calendar
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'calendar_google') return { enabled: true }
        return null
      })

      const result = await integrationService.syncCalendar('google')
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/calendar/google/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should create calendar events', async () => {
      const eventData = {
        title: 'Interview with Tech Corp',
        description: 'Technical interview',
        startTime: new Date('2024-02-15T10:00:00Z'),
        endTime: new Date('2024-02-15T11:00:00Z'),
        location: 'Google Meet',
        attendees: ['interviewer@techcorp.com'],
        applicationId: 'app_123'
      }

      const mockResponse = {
        id: 'google_event_123',
        ...eventData
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockResponse })
      })

      const result = await integrationService.createCalendarEvent('google', eventData)
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/calendar/google/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })
    })

    it('should throw error when calendar integration is disabled', async () => {
      // Mock getConfig to return disabled for Google Calendar
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'calendar_google') return { enabled: false }
        return null
      })

      await expect(integrationService.syncCalendar('google'))
        .rejects.toThrow('google calendar integration not enabled')
    })
  })

  describe('Email Integration', () => {
    it('should sync Gmail successfully', async () => {
      const mockResponse = {
        success: true,
        itemsProcessed: 10,
        itemsAdded: 5,
        itemsUpdated: 3,
        errors: [],
        lastSync: new Date(),
        metadata: {
          emailsAnalyzed: 10,
          jobRelatedEmails: 5,
          applicationsLinked: 5,
          statusUpdates: 3
        }
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // Mock getConfig to return enabled for Gmail
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'email_gmail') return { enabled: true }
        return null
      })

      const result = await integrationService.syncEmails('gmail')
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/email/gmail/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })
  })

  describe('Cloud Storage Integration', () => {
    it('should sync Google Drive successfully', async () => {
      const mockResponse = {
        success: true,
        itemsProcessed: 2,
        itemsAdded: 0,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date(),
        metadata: {
          totalFiles: 5,
          backupFiles: 2,
          storageUsed: 1024 * 1024 * 100,
          storageTotal: 1024 * 1024 * 1024 * 15,
          storageUsedPercent: 1
        }
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // Mock getConfig to return enabled for Google Drive
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        if (platform === 'storage_google-drive') return { enabled: true }
        return null
      })

      const result = await integrationService.syncCloudStorage('google-drive')
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/storage/google-drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    })

    it('should backup data to cloud storage', async () => {
      const backupData = {
        applications: [{ id: '1', company: 'Test Corp' }],
        integrations: { linkedin: { enabled: true } }
      }

      const mockResponse = {
        success: true,
        fileId: 'backup_123',
        fileName: 'job_tracker_backup_2024-01-15.json',
        size: 1024,
        uploadDate: new Date(),
        provider: 'google-drive'
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await integrationService.backupToCloud('google-drive', backupData)
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/storage/google-drive/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: backupData })
      })
    })
  })

  describe('Data Migration', () => {
    it('should export data for migration', async () => {
      const mockExportData = {
        applications: [{ id: '1', company: 'Test Corp' }],
        integrations: { linkedin: { enabled: true } },
        metadata: {
          exportDate: new Date(),
          version: '1.0.0'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockExportData })
      })

      const result = await integrationService.exportForMigration()
      
      expect(result).toEqual(mockExportData)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/export', {
        method: 'GET'
      })
    })

    it('should import data from migration', async () => {
      const importData = {
        applications: [{ id: '1', company: 'Test Corp' }],
        integrations: { linkedin: { enabled: true } }
      }

      const mockResponse = {
        success: true,
        itemsProcessed: 2,
        itemsAdded: 1,
        itemsUpdated: 1,
        errors: [],
        lastSync: new Date()
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await integrationService.importFromMigration(importData)
      
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith('/api/integrations/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData)
      })
    })
  })

  describe('Privacy Settings', () => {
    it('should get default privacy settings', () => {
      const settings = integrationService.getPrivacySettings()
      
      expect(settings).toEqual({
        allowDataSync: true,
        allowCloudBackup: false,
        allowEmailTracking: false,
        allowCalendarSync: true,
        dataRetentionDays: 365
      })
    })

    it('should load privacy settings from localStorage', () => {
      const customSettings = {
        allowDataSync: false,
        allowCloudBackup: true,
        allowEmailTracking: true,
        allowCalendarSync: false,
        dataRetentionDays: 180
      }

      localStorageMock.getItem.mockReturnValue(JSON.stringify(customSettings))
      
      const settings = integrationService.getPrivacySettings()
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('privacy_settings')
      expect(settings).toEqual(customSettings)
    })

    it('should update privacy settings', async () => {
      const newSettings = {
        allowDataSync: false,
        allowCloudBackup: true,
        allowEmailTracking: false,
        allowCalendarSync: true,
        dataRetentionDays: 90
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Privacy settings updated successfully',
          settings: newSettings
        })
      })

      await integrationService.updatePrivacySettings(newSettings)
      
      expect(fetch).toHaveBeenCalledWith('/api/integrations/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      })
    })
  })

  describe('Full Sync', () => {
    it('should perform full sync across all platforms', async () => {
      // Mock getConfig to return specific enabled integrations
      ;(integrationService.getConfig as jest.Mock) = jest.fn().mockImplementation((platform) => {
        const enabledPlatforms = ['linkedin', 'calendar_google', 'email_gmail', 'storage_google-drive']
        if (enabledPlatforms.includes(platform)) return { enabled: true }
        return null
      })

      const mockJobBoardResponse = {
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }

      const mockCalendarResponse = {
        success: true,
        itemsProcessed: 2,
        itemsAdded: 1,
        itemsUpdated: 1,
        errors: [],
        lastSync: new Date()
      }

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockJobBoardResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCalendarResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCalendarResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCalendarResponse)
        })

      const results = await integrationService.performFullSync()
      
      expect(results.jobBoards).toHaveLength(1)
      expect(results.calendar).toHaveLength(1)
      expect(results.email).toHaveLength(1)
      expect(results.storage).toHaveLength(1)
    })
  })
})