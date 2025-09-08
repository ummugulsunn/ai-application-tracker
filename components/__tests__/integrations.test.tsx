/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IntegrationManager } from '@/components/integrations/IntegrationManager'
import { PrivacySettings } from '@/components/integrations/PrivacySettings'
import { SyncStatus } from '@/components/integrations/SyncStatus'
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
    performFullSync: jest.fn(),
    getPrivacySettings: jest.fn(),
    updatePrivacySettings: jest.fn()
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

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
})

describe('Integration Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    ;(integrationService.getConfig as jest.Mock).mockReturnValue(null)
    ;(integrationService.getPrivacySettings as jest.Mock).mockReturnValue({
      allowDataSync: true,
      allowCloudBackup: false,
      allowEmailTracking: false,
      allowCalendarSync: true,
      dataRetentionDays: 365
    })
  })

  describe('IntegrationManager', () => {
    it('should render integration categories and platforms', () => {
      render(<IntegrationManager />)
      
      expect(screen.getByText('Integration Manager')).toBeInTheDocument()
      expect(screen.getByText('Job Boards')).toBeInTheDocument()
      expect(screen.getByText('Calendar')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Storage')).toBeInTheDocument()
    })

    it('should show LinkedIn integration card in job boards tab', () => {
      render(<IntegrationManager />)
      
      // Job Boards tab should be active by default
      expect(screen.getByText('LinkedIn')).toBeInTheDocument()
      expect(screen.getByText('Import applications from LinkedIn job searches and Easy Apply')).toBeInTheDocument()
    })

    it('should switch between tabs', () => {
      render(<IntegrationManager />)
      
      // Click on Calendar tab
      fireEvent.click(screen.getByText('Calendar'))
      
      expect(screen.getByText('Google Calendar')).toBeInTheDocument()
      expect(screen.getByText('Outlook Calendar')).toBeInTheDocument()
    })

    it('should toggle integration on/off', async () => {
      ;(integrationService.getConfig as jest.Mock).mockReturnValue({
        enabled: false,
        syncInterval: 60
      })

      render(<IntegrationManager />)
      
      // Get all checkboxes and select the first one (LinkedIn)
      const toggles = screen.getAllByRole('checkbox', { hidden: true })
      const linkedinToggle = toggles[0]
      
      fireEvent.click(linkedinToggle)
      
      await waitFor(() => {
        expect(integrationService.setConfig).toHaveBeenCalledWith('linkedin', {
          enabled: true,
          lastSync: expect.any(Date),
          syncInterval: 60
        })
      })
    })

    it('should perform sync when sync button is clicked', async () => {
      const mockResults = [{
        success: true,
        itemsProcessed: 5,
        itemsAdded: 3,
        itemsUpdated: 2,
        errors: [],
        lastSync: new Date()
      }]

      ;(integrationService.syncJobBoards as jest.Mock).mockResolvedValue(mockResults)

      render(<IntegrationManager />)
      
      const syncButton = screen.getByText('Sync All')
      fireEvent.click(syncButton)
      
      expect(syncButton).toHaveTextContent('Syncing...')
      
      await waitFor(() => {
        expect(integrationService.syncJobBoards).toHaveBeenCalled()
      })
    })

    it('should show sync results after successful sync', async () => {
      const mockResults = {
        jobBoards: [{
          success: true,
          itemsProcessed: 5,
          itemsAdded: 3,
          itemsUpdated: 2,
          errors: [],
          lastSync: new Date()
        }]
      }

      ;(integrationService.syncJobBoards as jest.Mock).mockResolvedValue(mockResults.jobBoards)

      const onSyncComplete = jest.fn()
      render(<IntegrationManager onSyncComplete={onSyncComplete} />)
      
      const syncButton = screen.getByText('Sync All')
      fireEvent.click(syncButton)
      
      await waitFor(() => {
        expect(screen.getByText('Recent Sync Results')).toBeInTheDocument()
        expect(onSyncComplete).toHaveBeenCalled()
      })
    })

    it('should show enabled integrations with connected status', () => {
      ;(integrationService.getConfig as jest.Mock).mockImplementation((platform) => {
        if (platform === 'linkedin') {
          return {
            enabled: true,
            lastSync: new Date('2024-01-15T10:00:00Z'),
            syncInterval: 60
          }
        }
        return null
      })

      render(<IntegrationManager />)
      
      // Should show green status indicator for enabled integration
      const statusIndicators = screen.getAllByRole('generic')
      const greenIndicator = statusIndicators.find(el => 
        el.className.includes('bg-green-500')
      )
      expect(greenIndicator).toBeInTheDocument()
    })
  })

  describe('PrivacySettings', () => {
    it('should render privacy settings with default values', () => {
      render(<PrivacySettings />)
      
      expect(screen.getByText('Privacy Settings')).toBeInTheDocument()
      expect(screen.getByText('Data Synchronization')).toBeInTheDocument()
      expect(screen.getByText('Cloud Backup')).toBeInTheDocument()
      expect(screen.getByText('Email Integration')).toBeInTheDocument()
      expect(screen.getByText('Calendar Integration')).toBeInTheDocument()
    })

    it('should show correct toggle states based on settings', () => {
      render(<PrivacySettings />)
      
      // Data sync should be enabled by default
      const dataSyncToggle = screen.getAllByRole('checkbox', { hidden: true })[0]
      expect(dataSyncToggle).toBeChecked()
      
      // Cloud backup should be disabled by default
      const cloudBackupToggle = screen.getAllByRole('checkbox', { hidden: true })[1]
      expect(cloudBackupToggle).not.toBeChecked()
    })

    it('should update settings when toggles are clicked', () => {
      render(<PrivacySettings />)
      
      const cloudBackupToggle = screen.getAllByRole('checkbox', { hidden: true })[1]
      fireEvent.click(cloudBackupToggle)
      
      expect(cloudBackupToggle).toBeChecked()
    })

    it('should save settings when save button is clicked', async () => {
      ;(integrationService.updatePrivacySettings as jest.Mock).mockResolvedValue(undefined)

      const onSettingsChange = jest.fn()
      render(<PrivacySettings onSettingsChange={onSettingsChange} />)
      
      const saveButton = screen.getByText('Save Settings')
      fireEvent.click(saveButton)
      
      expect(saveButton).toHaveTextContent('Saving...')
      
      await waitFor(() => {
        expect(integrationService.updatePrivacySettings).toHaveBeenCalled()
        expect(onSettingsChange).toHaveBeenCalled()
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument()
      })
    })

    it('should show data retention options', () => {
      render(<PrivacySettings />)
      
      expect(screen.getByText('Keep my data for:')).toBeInTheDocument()
      
      const retentionSelect = screen.getByDisplayValue('1 year')
      expect(retentionSelect).toBeInTheDocument()
    })

    it('should show data rights section', () => {
      render(<PrivacySettings />)
      
      expect(screen.getByText('Your Data Rights')).toBeInTheDocument()
      expect(screen.getByText('Export My Data')).toBeInTheDocument()
      expect(screen.getByText('Delete My Data')).toBeInTheDocument()
    })

    it('should show privacy notice', () => {
      render(<PrivacySettings />)
      
      expect(screen.getByText('Privacy Notice')).toBeInTheDocument()
      expect(screen.getByText(/Your privacy is important to us/)).toBeInTheDocument()
    })
  })

  describe('SyncStatus', () => {
    it('should render sync status with online indicator', () => {
      render(<SyncStatus />)
      
      expect(screen.getByText('Sync Status')).toBeInTheDocument()
      expect(screen.getByText('Up to date')).toBeInTheDocument()
    })

    it('should show offline status when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(<SyncStatus />)
      
      expect(screen.getByText('Offline')).toBeInTheDocument()
      expect(screen.getByText("You're offline")).toBeInTheDocument()
    })

    it('should show auto-sync toggle', () => {
      render(<SyncStatus />)
      
      const autoSyncCheckbox = screen.getByLabelText('Auto-sync')
      expect(autoSyncCheckbox).toBeInTheDocument()
      expect(autoSyncCheckbox).toBeChecked()
    })

    it('should perform manual sync when sync button is clicked', async () => {
      // Set navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      ;(integrationService.performFullSync as jest.Mock).mockResolvedValue({
        jobBoards: [],
        calendar: [],
        email: [],
        storage: []
      })

      render(<SyncStatus />)
      
      const syncButton = screen.getByText('Sync Now')
      fireEvent.click(syncButton)
      
      // The button should show syncing state
      expect(syncButton).toHaveTextContent('Syncing...')
      
      await waitFor(() => {
        expect(integrationService.performFullSync).toHaveBeenCalled()
      })
    })

    it('should show sync statistics', () => {
      render(<SyncStatus />)
      
      expect(screen.getByText('Items Added')).toBeInTheDocument()
      expect(screen.getByText('Items Updated')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Errors')).toBeInTheDocument()
    })

    it('should disable sync button when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })

      render(<SyncStatus />)
      
      const syncButton = screen.getByText('Sync Now')
      expect(syncButton).toBeDisabled()
    })

    it('should show last sync time when available', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'last_full_sync') {
          return new Date('2024-01-15T10:00:00Z').toISOString()
        }
        return null
      })

      render(<SyncStatus />)
      
      expect(screen.getByText(/Last sync:/)).toBeInTheDocument()
    })

    it('should call onRefresh callback after successful sync', async () => {
      // Set navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      ;(integrationService.performFullSync as jest.Mock).mockResolvedValue({
        jobBoards: [],
        calendar: [],
        email: [],
        storage: []
      })

      const onRefresh = jest.fn()
      render(<SyncStatus onRefresh={onRefresh} />)
      
      const syncButton = screen.getByText('Sync Now')
      fireEvent.click(syncButton)
      
      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should show sync errors when they occur', async () => {
      // Set navigator.onLine to true for this test
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      })

      const error = new Error('Sync failed')
      ;(integrationService.performFullSync as jest.Mock).mockRejectedValue(error)

      render(<SyncStatus />)
      
      const syncButton = screen.getByText('Sync Now')
      fireEvent.click(syncButton)
      
      await waitFor(() => {
        expect(screen.getByText('Sync Errors')).toBeInTheDocument()
        expect(screen.getByText(/Sync failed/)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})