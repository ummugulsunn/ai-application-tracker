'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { integrationService, SyncResult } from '@/lib/integrations/integrationService'

interface SyncStatusProps {
  onRefresh?: () => void
}

interface SyncStatusData {
  lastFullSync?: Date
  isOnline: boolean
  pendingChanges: number
  syncInProgress: boolean
  recentResults: SyncResult[]
  errors: string[]
}

export function SyncStatus({ onRefresh }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncInProgress: false,
    recentResults: [],
    errors: []
  })
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true)

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }))
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load initial sync status
    loadSyncStatus()
    
    // Set up auto-sync if enabled
    let syncInterval: NodeJS.Timeout
    if (autoSyncEnabled) {
      syncInterval = setInterval(() => {
        if (syncStatus.isOnline && !syncStatus.syncInProgress) {
          performBackgroundSync()
        }
      }, 15 * 60 * 1000) // 15 minutes
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (syncInterval) clearInterval(syncInterval)
    }
  }, [autoSyncEnabled, syncStatus.isOnline, syncStatus.syncInProgress])

  const loadSyncStatus = () => {
    // In a real implementation, this would load from localStorage or API
    const lastSync = localStorage.getItem('last_full_sync')
    const pendingChanges = parseInt(localStorage.getItem('pending_changes') || '0')
    
    setSyncStatus(prev => ({
      ...prev,
      lastFullSync: lastSync ? new Date(lastSync) : undefined,
      pendingChanges
    }))
  }

  const performBackgroundSync = async () => {
    if (syncStatus.syncInProgress) return
    
    setSyncStatus(prev => ({ ...prev, syncInProgress: true, errors: [] }))
    
    try {
      const results = await integrationService.performFullSync()
      
      // Process results
      const allResults: SyncResult[] = [
        ...results.jobBoards,
        ...results.calendar,
        ...results.email,
        ...results.storage
      ]
      
      const errors = allResults
        .filter(result => !result.success)
        .flatMap(result => result.errors)
      
      setSyncStatus(prev => ({
        ...prev,
        lastFullSync: new Date(),
        recentResults: allResults,
        errors,
        pendingChanges: 0,
        syncInProgress: false
      }))
      
      // Update localStorage
      localStorage.setItem('last_full_sync', new Date().toISOString())
      localStorage.setItem('pending_changes', '0')
      
      onRefresh?.()
    } catch (error) {
      setSyncStatus(prev => ({
        ...prev,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
        syncInProgress: false
      }))
    }
  }

  const manualSync = async () => {
    await performBackgroundSync()
  }

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-500'
    if (syncStatus.syncInProgress) return 'bg-yellow-500'
    if (syncStatus.errors.length > 0) return 'bg-orange-500'
    if (syncStatus.pendingChanges > 0) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline'
    if (syncStatus.syncInProgress) return 'Syncing...'
    if (syncStatus.errors.length > 0) return 'Sync errors'
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending`
    return 'Up to date'
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <div>
              <h3 className="font-medium text-gray-900">Sync Status</h3>
              <p className="text-sm text-gray-600">{getStatusText()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className="mr-2"
              />
              Auto-sync
            </label>
            <Button
              size="sm"
              onClick={manualSync}
              disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {syncStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </div>
        
        {syncStatus.lastFullSync && (
          <div className="mt-3 text-sm text-gray-500">
            Last sync: {formatTimeAgo(syncStatus.lastFullSync)}
          </div>
        )}
      </Card>

      {/* Offline Notice */}
      {!syncStatus.isOnline && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <div className="text-yellow-600">⚠️</div>
            <div>
              <h4 className="font-medium text-yellow-900">You're offline</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Changes will be synced automatically when you're back online.
                {syncStatus.pendingChanges > 0 && ` ${syncStatus.pendingChanges} changes are waiting to sync.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sync Errors */}
      {syncStatus.errors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-3">
            <div className="text-red-600">❌</div>
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Sync Errors</h4>
              <div className="mt-2 space-y-1">
                {syncStatus.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-700">
                    • {error}
                  </p>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={manualSync}
                className="mt-3 text-red-600 border-red-300 hover:bg-red-50"
              >
                Retry Sync
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Sync Results */}
      {syncStatus.recentResults.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Recent Sync Activity</h4>
          <div className="space-y-2">
            {syncStatus.recentResults.slice(0, 5).map((result, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-600">
                    {result.itemsProcessed} items processed
                  </span>
                </div>
                <span className="text-gray-500">
                  {formatTimeAgo(result.lastSync)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sync Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {syncStatus.recentResults.reduce((sum, result) => sum + result.itemsAdded, 0)}
          </div>
          <div className="text-sm text-gray-600">Items Added</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {syncStatus.recentResults.reduce((sum, result) => sum + result.itemsUpdated, 0)}
          </div>
          <div className="text-sm text-gray-600">Items Updated</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {syncStatus.pendingChanges}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold text-red-600">
            {syncStatus.errors.length}
          </div>
          <div className="text-sm text-gray-600">Errors</div>
        </Card>
      </div>
    </div>
  )
}