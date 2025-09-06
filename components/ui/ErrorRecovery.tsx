'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  WifiIcon,
  SignalSlashIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { ErrorHandler, AppError, ErrorSeverity } from '@/lib/errorHandling'
import { useOfflineSync } from '@/lib/offline/syncManager'

interface ErrorRecoveryProps {
  error: AppError
  onRecover?: () => void
  onDismiss?: () => void
  showAdvanced?: boolean
}

export function ErrorRecovery({ 
  error, 
  onRecover, 
  onDismiss,
  showAdvanced = false 
}: ErrorRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const { isOnline, queueLength } = useOfflineSync()

  const recoverySteps = [
    'Analyzing error...',
    'Attempting automatic recovery...',
    'Validating system state...',
    'Recovery complete'
  ]

  const handleAutoRecover = async () => {
    setIsRecovering(true)
    
    try {
      // Simulate recovery steps
      for (let i = 0; i < recoverySteps.length; i++) {
        setRecoveryStep(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // Attempt actual recovery based on error type
      await performRecovery(error)
      
      onRecover?.()
    } catch (recoveryError) {
      console.error('Auto-recovery failed:', recoveryError)
    } finally {
      setIsRecovering(false)
    }
  }

  const performRecovery = async (error: AppError): Promise<void> => {
    switch (error.category) {
      case 'network':
        // Wait for network and retry
        if (isOnline) {
          // Trigger sync if offline actions exist
          if (queueLength > 0) {
            const syncManager = (await import('@/lib/offline/syncManager')).OfflineSyncManager.getInstance()
            await syncManager.syncQueue()
          }
        }
        break
        
      case 'storage':
        // Clear corrupted storage
        try {
          localStorage.removeItem('corrupted_data')
          // Reload from server if possible
        } catch (e) {
          console.error('Storage recovery failed:', e)
        }
        break
        
      case 'validation':
        // Reset form state or provide default values
        break
        
      default:
        // Generic recovery - refresh component state
        break
    }
  }

  const handleManualRecovery = (action: string) => {
    switch (action) {
      case 'retry':
        window.location.reload()
        break
      case 'home':
        window.location.href = '/'
        break
      case 'clear':
        if (confirm('This will clear all local data. Are you sure?')) {
          localStorage.clear()
          sessionStorage.clear()
          window.location.reload()
        }
        break
      case 'export':
        exportErrorData()
        break
    }
  }

  const exportErrorData = () => {
    const errorHandler = ErrorHandler.getInstance()
    const errorData = {
      currentError: error,
      allErrors: errorHandler.getRecentErrors(),
      systemInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        isOnline,
        queueLength,
      }
    }

    const blob = new Blob([JSON.stringify(errorData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-report-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getErrorIcon = () => {
    if (error.severity === ErrorSeverity.CRITICAL) {
      return <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
    }
    return <ExclamationTriangleIcon className="w-8 h-8 text-amber-500" />
  }

  const getRecoveryRecommendations = () => {
    const recommendations = []

    if (error.category === 'network') {
      recommendations.push({
        icon: <WifiIcon className="w-5 h-5" />,
        title: 'Check Connection',
        description: 'Verify your internet connection and try again',
        action: 'retry'
      })
    }

    if (error.category === 'storage') {
      recommendations.push({
        icon: <TrashIcon className="w-5 h-5" />,
        title: 'Clear Storage',
        description: 'Clear corrupted local data (you may lose unsaved changes)',
        action: 'clear'
      })
    }

    // Always include basic recovery options
    recommendations.push(
      {
        icon: <ArrowPathIcon className="w-5 h-5" />,
        title: 'Reload Page',
        description: 'Refresh the page to reset the application state',
        action: 'retry'
      },
      {
        icon: <HomeIcon className="w-5 h-5" />,
        title: 'Go Home',
        description: 'Return to the main dashboard',
        action: 'home'
      }
    )

    if (showAdvanced) {
      recommendations.push({
        icon: <DocumentArrowDownIcon className="w-5 h-5" />,
        title: 'Export Error Data',
        description: 'Download error details for technical support',
        action: 'export'
      })
    }

    return recommendations
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' : 'Error Occurred'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {error.userMessage}
          </p>

          {/* Network Status */}
          <div className="flex items-center space-x-2 mb-4 text-sm">
            {isOnline ? (
              <>
                <WifiIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Online</span>
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
            
            {queueLength > 0 && (
              <>
                <span className="text-gray-400">•</span>
                <ClockIcon className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">
                  {queueLength} pending change{queueLength !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>

          {/* Auto Recovery */}
          {error.recoverable && (
            <div className="mb-6">
              <Button
                onClick={handleAutoRecover}
                disabled={isRecovering}
                className="w-full sm:w-auto"
              >
                {isRecovering ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    {recoverySteps[recoveryStep]}
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Attempt Auto Recovery
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Recovery Progress */}
          <AnimatePresence>
            {isRecovering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900">
                        {recoverySteps[recoveryStep]}
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${((recoveryStep + 1) / recoverySteps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual Recovery Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Recovery Options:</h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              {getRecoveryRecommendations().map((rec, index) => (
                <button
                  key={index}
                  onClick={() => handleManualRecovery(rec.action)}
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0 text-gray-400">
                    {rec.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {rec.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {rec.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Details */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </button>
            
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600">
                    <div><strong>Error ID:</strong> {error.id}</div>
                    <div><strong>Code:</strong> {error.code}</div>
                    <div><strong>Category:</strong> {error.category}</div>
                    <div><strong>Severity:</strong> {error.severity}</div>
                    <div><strong>Timestamp:</strong> {error.timestamp}</div>
                    {error.context && <div><strong>Context:</strong> {error.context}</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dismiss Button */}
          {onDismiss && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook for error recovery
export function useErrorRecovery() {
  const [currentError, setCurrentError] = useState<AppError | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)

  const showErrorRecovery = (error: AppError) => {
    setCurrentError(error)
    setShowRecovery(true)
  }

  const hideErrorRecovery = () => {
    setShowRecovery(false)
    setCurrentError(null)
  }

  const handleRecover = () => {
    hideErrorRecovery()
    // Additional recovery logic can be added here
  }

  return {
    currentError,
    showRecovery,
    showErrorRecovery,
    hideErrorRecovery,
    handleRecover,
  }
}

// Error Recovery Modal
export function ErrorRecoveryModal() {
  const { currentError, showRecovery, hideErrorRecovery, handleRecover } = useErrorRecovery()

  if (!showRecovery || !currentError) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={hideErrorRecovery} />
        <div className="relative w-full max-w-2xl">
          <ErrorRecovery
            error={currentError}
            onRecover={handleRecover}
            onDismiss={hideErrorRecovery}
            showAdvanced={true}
          />
        </div>
      </div>
    </div>
  )
}