'use client'

import React, { useState, useEffect } from 'react'
import { useOfflineSync } from '@/lib/offline/syncManager'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon, 
  SignalSlashIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'

// Network status hook
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
      
      // Try to detect connection type
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type || 'unknown')
      }
    }

    updateOnlineStatus()
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return { isOnline, connectionType }
}

export function OfflineIndicator() {
  const { isOnline, isSyncing, queueLength, syncQueue, clearQueue } = useOfflineSync()
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (isSyncing) {
      setSyncStatus('syncing')
    } else if (queueLength === 0 && lastSyncTime) {
      setSyncStatus('success')
      setTimeout(() => setSyncStatus('idle'), 2000)
    }
  }, [isSyncing, queueLength, lastSyncTime])

  const handleSync = async () => {
    try {
      await syncQueue()
      setLastSyncTime(new Date())
      setSyncStatus('success')
    } catch (error) {
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <ArrowPathIcon className="w-4 h-4 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {(!isOnline || queueLength > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className={`px-4 py-3 text-sm font-medium ${
            isOnline 
              ? 'bg-amber-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isOnline ? (
                  <CloudArrowUpIcon className="w-5 h-5" />
                ) : (
                  <SignalSlashIcon className="w-5 h-5" />
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span className="font-medium">
                    {isOnline 
                      ? `${queueLength} change${queueLength !== 1 ? 's' : ''} pending sync`
                      : 'You\'re offline'
                    }
                  </span>
                  
                  {!isOnline && queueLength > 0 && (
                    <span className="text-xs opacity-90">
                      {queueLength} change{queueLength !== 1 ? 's' : ''} will sync when reconnected
                    </span>
                  )}
                  
                  {lastSyncTime && (
                    <span className="text-xs opacity-75">
                      Last sync: {lastSyncTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getSyncStatusIcon()}
                
                {isOnline && queueLength > 0 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="text-xs py-1 px-3 border-white/30 text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearQueue}
                      className="text-xs py-1 px-2 text-white hover:bg-white/20"
                      title="Clear pending changes"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConnectionStatus({ className = '' }: { className?: string }) {
  const { isOnline, connectionType } = useNetworkStatus()

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isOnline ? (
        <>
          <WifiIcon className="w-4 h-4 text-success-600" />
          <span className="text-sm text-success-600">
            Online {connectionType !== 'unknown' && `(${connectionType})`}
          </span>
        </>
      ) : (
        <>
          <SignalSlashIcon className="w-4 h-4 text-danger-600" />
          <span className="text-sm text-danger-600">Offline</span>
        </>
      )}
    </div>
  )
}

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gradient-to-r from-orange-400 to-red-500 text-white"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <div>
              <p className="font-medium">You're currently offline</p>
              <p className="text-sm opacity-90">
                You can still view and edit your applications. Changes will sync when you're back online.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <span>✓ View applications</span>
              <span>✓ Add new entries</span>
              <span>✓ Export data</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}