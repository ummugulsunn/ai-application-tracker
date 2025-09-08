'use client'

import { useState, useEffect, useCallback } from 'react'
import { integrationService, IntegrationConfig, SyncResult } from '@/lib/integrations/integrationService'

export interface UseIntegrationsReturn {
  // State
  integrations: Record<string, IntegrationConfig>
  syncResults: Record<string, SyncResult>
  isLoading: boolean
  isSyncing: boolean
  errors: string[]
  lastSync: Date | null
  
  // Actions
  enableIntegration: (platform: string, config?: Partial<IntegrationConfig>) => Promise<void>
  disableIntegration: (platform: string) => Promise<void>
  syncPlatform: (platform: string) => Promise<SyncResult>
  syncAll: () => Promise<Record<string, SyncResult[]>>
  clearErrors: () => void
  
  // Utilities
  isIntegrationEnabled: (platform: string) => boolean
  getIntegrationStatus: (platform: string) => 'connected' | 'disconnected' | 'error' | 'syncing'
  getPendingChanges: () => number
}

export function useIntegrations(): UseIntegrationsReturn {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationConfig>>({})
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations()
  }, [])

  // Set up auto-sync
  useEffect(() => {
    const interval = setInterval(() => {
      const enabledIntegrations = Object.entries(integrations).filter(([_, config]) => config.enabled)
      if (enabledIntegrations.length > 0 && !isSyncing) {
        performAutoSync()
      }
    }, 15 * 60 * 1000) // 15 minutes

    return () => clearInterval(interval)
  }, [integrations, isSyncing])

  const loadIntegrations = useCallback(() => {
    const platforms = [
      'linkedin', 'indeed', 'glassdoor',
      'calendar_google', 'calendar_outlook',
      'email_gmail', 'email_outlook',
      'storage_google_drive', 'storage_dropbox'
    ]

    const loadedIntegrations: Record<string, IntegrationConfig> = {}
    
    platforms.forEach(platform => {
      const config = integrationService.getConfig(platform)
      if (config) {
        loadedIntegrations[platform] = config
      }
    })

    setIntegrations(loadedIntegrations)
    
    // Load last sync time
    const lastSyncTime = localStorage.getItem('last_full_sync')
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime))
    }
  }, [])

  const enableIntegration = useCallback(async (
    platform: string, 
    configOverrides?: Partial<IntegrationConfig>
  ) => {
    setIsLoading(true)
    setErrors([])

    try {
      const config: IntegrationConfig = {
        enabled: true,
        lastSync: new Date(),
        syncInterval: 60,
        ...configOverrides
      }

      integrationService.setConfig(platform, config)
      
      setIntegrations(prev => ({
        ...prev,
        [platform]: config
      }))

      // Perform initial sync
      if (config.enabled) {
        await syncPlatform(platform)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable integration'
      setErrors(prev => [...prev, errorMessage])
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disableIntegration = useCallback(async (platform: string) => {
    setIsLoading(true)
    setErrors([])

    try {
      const config: IntegrationConfig = {
        enabled: false,
        lastSync: undefined,
        syncInterval: 60
      }

      integrationService.setConfig(platform, config)
      
      setIntegrations(prev => ({
        ...prev,
        [platform]: config
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable integration'
      setErrors(prev => [...prev, errorMessage])
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const syncPlatform = useCallback(async (platform: string): Promise<SyncResult> => {
    setIsSyncing(true)
    setErrors([])

    try {
      let result: SyncResult

      // Determine platform type and call appropriate sync method
      if (platform.includes('calendar_')) {
        const provider = platform.replace('calendar_', '') as 'google' | 'outlook'
        result = await integrationService.syncCalendar(provider)
      } else if (platform.includes('email_')) {
        const provider = platform.replace('email_', '') as 'gmail' | 'outlook'
        result = await integrationService.syncEmails(provider)
      } else if (platform.includes('storage_')) {
        const provider = platform.replace('storage_', '').replace('_', '-') as 'google-drive' | 'dropbox'
        result = await integrationService.syncCloudStorage(provider)
      } else {
        // Job board sync
        const results = await integrationService.syncJobBoards()
        result = results.find(r => r.success) || results[0] || {
          success: false,
          itemsProcessed: 0,
          itemsAdded: 0,
          itemsUpdated: 0,
          errors: ['Platform not found'],
          lastSync: new Date()
        }
      }

      setSyncResults(prev => ({
        ...prev,
        [platform]: result
      }))

      // Update integration config with last sync time
      const currentConfig = integrationService.getConfig(platform)
      if (currentConfig) {
        integrationService.setConfig(platform, {
          ...currentConfig,
          lastSync: result.lastSync
        })
        
        setIntegrations(prev => ({
          ...prev,
          [platform]: {
            ...currentConfig,
            lastSync: result.lastSync
          }
        }))
      }

      if (!result.success && result.errors.length > 0) {
        setErrors(prev => [...prev, ...result.errors])
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      setErrors(prev => [...prev, errorMessage])
      
      const failedResult: SyncResult = {
        success: false,
        itemsProcessed: 0,
        itemsAdded: 0,
        itemsUpdated: 0,
        errors: [errorMessage],
        lastSync: new Date()
      }
      
      setSyncResults(prev => ({
        ...prev,
        [platform]: failedResult
      }))
      
      return failedResult
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const syncAll = useCallback(async (): Promise<Record<string, SyncResult[]>> => {
    setIsSyncing(true)
    setErrors([])

    try {
      const results = await integrationService.performFullSync()
      
      // Update sync results
      const allResults: Record<string, SyncResult> = {}
      
      results.jobBoards.forEach((result, index) => {
        const platforms = ['linkedin', 'indeed', 'glassdoor']
        if (platforms[index]) {
          allResults[platforms[index]] = result
        }
      })
      
      results.calendar.forEach((result, index) => {
        const platforms = ['calendar_google', 'calendar_outlook']
        if (platforms[index]) {
          allResults[platforms[index]] = result
        }
      })
      
      results.email.forEach((result, index) => {
        const platforms = ['email_gmail', 'email_outlook']
        if (platforms[index]) {
          allResults[platforms[index]] = result
        }
      })
      
      results.storage.forEach((result, index) => {
        const platforms = ['storage_google_drive', 'storage_dropbox']
        if (platforms[index]) {
          allResults[platforms[index]] = result
        }
      })

      setSyncResults(prev => ({ ...prev, ...allResults }))
      
      // Update last sync time
      const now = new Date()
      setLastSync(now)
      localStorage.setItem('last_full_sync', now.toISOString())
      
      // Collect all errors
      const allErrors = [
        ...results.jobBoards.flatMap(r => r.errors),
        ...results.calendar.flatMap(r => r.errors),
        ...results.email.flatMap(r => r.errors),
        ...results.storage.flatMap(r => r.errors)
      ]
      
      if (allErrors.length > 0) {
        setErrors(allErrors)
      }

      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Full sync failed'
      setErrors([errorMessage])
      throw error
    } finally {
      setIsSyncing(false)
    }
  }, [])

  const performAutoSync = useCallback(async () => {
    if (isSyncing) return
    
    try {
      await syncAll()
    } catch (error) {
      console.error('Auto-sync failed:', error)
    }
  }, [isSyncing, syncAll])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const isIntegrationEnabled = useCallback((platform: string): boolean => {
    return integrations[platform]?.enabled || false
  }, [integrations])

  const getIntegrationStatus = useCallback((platform: string): 'connected' | 'disconnected' | 'error' | 'syncing' => {
    if (isSyncing) return 'syncing'
    
    const config = integrations[platform]
    if (!config?.enabled) return 'disconnected'
    
    const result = syncResults[platform]
    if (result && !result.success) return 'error'
    
    return 'connected'
  }, [integrations, syncResults, isSyncing])

  const getPendingChanges = useCallback((): number => {
    const pending = localStorage.getItem('pending_changes')
    return pending ? parseInt(pending) : 0
  }, [])

  return {
    // State
    integrations,
    syncResults,
    isLoading,
    isSyncing,
    errors,
    lastSync,
    
    // Actions
    enableIntegration,
    disableIntegration,
    syncPlatform,
    syncAll,
    clearErrors,
    
    // Utilities
    isIntegrationEnabled,
    getIntegrationStatus,
    getPendingChanges
  }
}