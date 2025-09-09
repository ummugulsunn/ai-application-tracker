'use client'

import React from 'react'
import { ErrorHandler, ErrorFactory } from '@/lib/errorHandling'
import type { JSONObject, JSONValue, ApplicationActionData } from '@/types/strict'

export interface OfflineAction {
  id: string
  type: string
  data: JSONObject
  timestamp: number
  retryCount: number
  maxRetries: number
  priority: 'low' | 'medium' | 'high'
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
}

export interface SyncResult {
  success: boolean
  actionId: string
  error?: Error
  response?: JSONValue
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private queue: OfflineAction[] = []
  private isOnline = true
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private errorHandler = ErrorHandler.getInstance()
  private listeners: Array<(queue: OfflineAction[]) => void> = []

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.loadQueue()
      this.setupEventListeners()
      this.startPeriodicSync()
    }
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Listen for page visibility changes to sync when user returns
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncQueue()
      }
    })

    // Sync before page unload
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        // Try to sync critical actions synchronously
        this.syncCriticalActions()
      }
    })
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.syncQueue()
      }
    }, 30000)
  }

  addAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const fullAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.queue.push(fullAction)
    this.saveQueue()
    this.notifyListeners()

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncQueue()
    }

    return fullAction.id
  }

  async syncQueue(): Promise<SyncResult[]> {
    if (!this.isOnline || this.isSyncing || this.queue.length === 0) {
      return []
    }

    this.isSyncing = true
    const results: SyncResult[] = []

    try {
      // Sort by priority and timestamp
      const sortedQueue = [...this.queue].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.timestamp - b.timestamp
      })

      // Process actions in batches to avoid overwhelming the server
      const batchSize = 5
      for (let i = 0; i < sortedQueue.length; i += batchSize) {
        const batch = sortedQueue.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map(action => this.processAction(action))
        )

        batchResults.forEach((result, index) => {
          const action = batch[index]
          if (!action) return
          
          if (result.status === 'fulfilled') {
            results.push(result.value)
            if (result.value.success) {
              this.removeFromQueue(action.id)
            } else {
              this.handleFailedAction(action, result.value.error)
            }
          } else {
            results.push({
              success: false,
              actionId: action.id,
              error: new Error(result.reason),
            })
            this.handleFailedAction(action, new Error(result.reason))
          }
        })

        // Small delay between batches
        if (i + batchSize < sortedQueue.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    } catch (error) {
      console.error('Sync queue error:', error)
      this.errorHandler.handle(
        ErrorFactory.create('SYNC_ERROR', {
          message: 'Failed to sync offline actions',
          context: 'OfflineSyncManager.syncQueue',
          originalError: error as Error,
        })
      )
    } finally {
      this.isSyncing = false
      this.saveQueue()
      this.notifyListeners()
    }

    return results
  }

  private async processAction(action: OfflineAction): Promise<SyncResult> {
    try {
      const response = await fetch(action.endpoint, {
        method: action.method,
        headers: {
          'Content-Type': 'application/json',
          ...action.headers,
        },
        body: action.method !== 'GET' ? JSON.stringify(action.data) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      return {
        success: true,
        actionId: action.id,
        response: responseData,
      }
    } catch (error) {
      return {
        success: false,
        actionId: action.id,
        error: error as Error,
      }
    }
  }

  private handleFailedAction(action: OfflineAction, error?: Error): void {
    action.retryCount++

    if (action.retryCount >= action.maxRetries) {
      // Max retries reached, remove from queue and log error
      this.removeFromQueue(action.id)
      
      this.errorHandler.handle(
        ErrorFactory.create('SYNC_MAX_RETRIES', {
          message: `Failed to sync action after ${action.maxRetries} retries`,
          userMessage: 'Some changes could not be saved. Please try again manually.',
          context: `Action: ${action.type}`,
          details: { action, error },
          originalError: error,
        })
      )
    } else {
      // Schedule retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, action.retryCount), 30000)
      setTimeout(() => {
        if (this.isOnline) {
          this.syncQueue()
        }
      }, delay)
    }
  }

  private syncCriticalActions(): void {
    // Synchronously attempt to sync high-priority actions
    const criticalActions = this.queue.filter(action => action.priority === 'high')
    
    criticalActions.forEach(action => {
      try {
        // Use sendBeacon for critical actions during page unload
        if (navigator.sendBeacon && action.method === 'POST') {
          const data = new Blob([JSON.stringify(action.data)], {
            type: 'application/json',
          })
          navigator.sendBeacon(action.endpoint, data)
        }
      } catch (error) {
        console.error('Failed to send critical action:', error)
      }
    })
  }

  private removeFromQueue(actionId: string): void {
    this.queue = this.queue.filter(action => action.id !== actionId)
  }

  private saveQueue(): void {
    try {
      localStorage.setItem('offline_sync_queue', JSON.stringify(this.queue))
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  private loadQueue(): void {
    try {
      const saved = localStorage.getItem('offline_sync_queue')
      if (saved) {
        this.queue = JSON.parse(saved)
        
        // Clean up old actions (older than 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        this.queue = this.queue.filter(action => action.timestamp > oneDayAgo)
        this.saveQueue()
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.queue = []
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.queue])
      } catch (error) {
        console.error('Error notifying sync listener:', error)
      }
    })
  }

  // Public methods
  getQueueLength(): number {
    return this.queue.length
  }

  getQueue(): OfflineAction[] {
    return [...this.queue]
  }

  clearQueue(): void {
    this.queue = []
    this.saveQueue()
    this.notifyListeners()
  }

  removeAction(actionId: string): boolean {
    const initialLength = this.queue.length
    this.removeFromQueue(actionId)
    
    if (this.queue.length < initialLength) {
      this.saveQueue()
      this.notifyListeners()
      return true
    }
    
    return false
  }

  onQueueChange(listener: (queue: OfflineAction[]) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  getStatus(): {
    isOnline: boolean
    isSyncing: boolean
    queueLength: number
    lastSyncAttempt?: number
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.queue.length,
    }
  }

  // Utility methods for common actions
  addApplicationAction(data: ApplicationActionData, priority: 'low' | 'medium' | 'high' = 'medium'): string {
    return this.addAction({
      type: 'ADD_APPLICATION',
      data,
      priority,
      endpoint: '/api/applications',
      method: 'POST',
      maxRetries: 3,
    })
  }

  updateApplicationAction(id: string, data: ApplicationActionData, priority: 'low' | 'medium' | 'high' = 'medium'): string {
    return this.addAction({
      type: 'UPDATE_APPLICATION',
      data: { id, ...data },
      priority,
      endpoint: `/api/applications/${id}`,
      method: 'PUT',
      maxRetries: 3,
    })
  }

  deleteApplicationAction(id: string, priority: 'low' | 'medium' | 'high' = 'high'): string {
    return this.addAction({
      type: 'DELETE_APPLICATION',
      data: { id },
      priority,
      endpoint: `/api/applications/${id}`,
      method: 'DELETE',
      maxRetries: 5,
    })
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.listeners = []
  }
}

// React hook for using the sync manager
export function useOfflineSync() {
  const [syncManager] = React.useState(() => OfflineSyncManager.getInstance())
  const [status, setStatus] = React.useState(syncManager.getStatus())
  const [queue, setQueue] = React.useState(syncManager.getQueue())

  React.useEffect(() => {
    const updateStatus = () => setStatus(syncManager.getStatus())
    const updateQueue = (newQueue: OfflineAction[]) => setQueue(newQueue)

    // Update status periodically
    const statusInterval = setInterval(updateStatus, 1000)
    
    // Listen for queue changes
    const unsubscribe = syncManager.onQueueChange(updateQueue)

    // Initial update
    updateStatus()
    updateQueue(syncManager.getQueue())

    return () => {
      clearInterval(statusInterval)
      unsubscribe()
    }
  }, [syncManager])

  return {
    ...status,
    queue,
    addAction: syncManager.addAction.bind(syncManager),
    syncQueue: syncManager.syncQueue.bind(syncManager),
    clearQueue: syncManager.clearQueue.bind(syncManager),
    removeAction: syncManager.removeAction.bind(syncManager),
    addApplicationAction: syncManager.addApplicationAction.bind(syncManager),
    updateApplicationAction: syncManager.updateApplicationAction.bind(syncManager),
    deleteApplicationAction: syncManager.deleteApplicationAction.bind(syncManager),
  }
}