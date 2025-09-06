'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { HydrationErrorBoundary } from '@/components/HydrationErrorBoundary'
import { ErrorNotificationContainer, useErrorNotifications } from '@/components/ui/ErrorNotification'
import { ErrorRecoveryModal, useErrorRecovery } from '@/components/ui/ErrorRecovery'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { ErrorHandler, AppError, ErrorFactory } from '@/lib/errorHandling'
import { OfflineSyncManager } from '@/lib/offline/syncManager'

interface ErrorContextType {
  reportError: (error: Error | AppError, context?: string) => void
  showErrorRecovery: (error: AppError) => void
  clearAllErrors: () => void
  getErrorStats: () => any
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}

interface ErrorProviderProps {
  children: React.ReactNode
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const { showError, dismissAll } = useErrorNotifications()
  const { showErrorRecovery } = useErrorRecovery()
  const [errorHandler] = useState(() => ErrorHandler.getInstance())
  const [syncManager] = useState(() => OfflineSyncManager.getInstance())

  useEffect(() => {
    // Listen for app errors
    const handleAppError = (event: CustomEvent) => {
      const { error } = event.detail
      showError(error)
    }

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = ErrorFactory.create('UNHANDLED_PROMISE_REJECTION', {
        message: 'Unhandled promise rejection',
        userMessage: 'An unexpected error occurred. The application will continue to work.',
        context: 'Promise rejection',
        originalError: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      })
      
      errorHandler.handle(error)
      showError(error)
      
      // Prevent the default browser behavior
      event.preventDefault()
    }

    // Listen for global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = ErrorFactory.create('GLOBAL_ERROR', {
        message: event.message,
        userMessage: 'A JavaScript error occurred. Some features may not work properly.',
        context: `${event.filename}:${event.lineno}:${event.colno}`,
        originalError: event.error,
      })
      
      errorHandler.handle(error)
      showError(error)
    }

    // Listen for network errors
    const handleNetworkError = () => {
      if (!navigator.onLine) {
        const error = ErrorFactory.create('NETWORK_OFFLINE', {
          message: 'Network connection lost',
          userMessage: 'You are now offline. Changes will be saved locally and synced when you reconnect.',
        })
        
        errorHandler.handle(error)
        showError(error)
      }
    }

    // Listen for storage quota exceeded errors
    const handleStorageError = () => {
      const error = ErrorFactory.create('STORAGE_QUOTA_EXCEEDED', {
        message: 'Storage quota exceeded',
        userMessage: 'Your device storage is full. Please free up space or clear old data.',
      })
      
      errorHandler.handle(error)
      showError(error)
    }

    // Add event listeners
    window.addEventListener('app-error', handleAppError as EventListener)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('offline', handleNetworkError)
    
    // Monitor storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const checkStorage = async () => {
        try {
          const estimate = await navigator.storage.estimate()
          const usageRatio = (estimate.usage || 0) / (estimate.quota || 1)
          
          if (usageRatio > 0.9) {
            handleStorageError()
          }
        } catch (e) {
          // Ignore storage check errors
        }
      }
      
      checkStorage()
      const storageInterval = setInterval(checkStorage, 60000) // Check every minute
      
      return () => {
        window.removeEventListener('app-error', handleAppError as EventListener)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        window.removeEventListener('error', handleGlobalError)
        window.removeEventListener('offline', handleNetworkError)
        clearInterval(storageInterval)
      }
    }

    return () => {
      window.removeEventListener('app-error', handleAppError as EventListener)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('offline', handleNetworkError)
    }
  }, [errorHandler, showError])

  const reportError = (error: Error | AppError, context?: string) => {
    let appError: AppError
    
    if ('id' in error && 'category' in error) {
      // Already an AppError
      appError = error as AppError
    } else {
      // Convert Error to AppError
      appError = ErrorFactory.create('MANUAL_REPORT', {
        message: error.message,
        userMessage: 'An error was reported. Our team has been notified.',
        context,
        originalError: error as Error,
      })
    }
    
    errorHandler.handle(appError)
    showError(appError)
  }

  const clearAllErrors = () => {
    dismissAll()
    errorHandler.clearReports()
  }

  const getErrorStats = () => {
    return errorHandler.getErrorStatistics()
  }

  const contextValue: ErrorContextType = {
    reportError,
    showErrorRecovery,
    clearAllErrors,
    getErrorStats,
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      <HydrationErrorBoundary
        onHydrationError={(error, errorInfo) => {
          const appError = ErrorFactory.create('HYDRATION_ERROR', {
            message: error.message,
            userMessage: 'There was a rendering issue. The page will recover automatically.',
            context: 'Hydration Error Boundary',
            originalError: error,
          })
          errorHandler.handle(appError, { componentStack: errorInfo.componentStack })
        }}
      >
        <ErrorBoundary
          onError={(error, errorInfo) => {
            const appError = ErrorFactory.create('REACT_ERROR_BOUNDARY', {
              message: error.message,
              userMessage: 'A component error occurred. Please try refreshing the page.',
              context: 'React Error Boundary',
              originalError: error,
            })
            errorHandler.handle(appError, { componentStack: errorInfo.componentStack })
          }}
        >
          {children}
          
          {/* Global UI Components */}
          <ErrorNotificationContainer />
          <ErrorRecoveryModal />
          <OfflineIndicator />
        </ErrorBoundary>
      </HydrationErrorBoundary>
    </ErrorContext.Provider>
  )
}

// Higher-order component for wrapping the entire app
export function withErrorProvider<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => (
    <ErrorProvider>
      <Component {...props} />
    </ErrorProvider>
  )

  WrappedComponent.displayName = `withErrorProvider(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for reporting errors in components
export function useErrorReporting() {
  const { reportError } = useError()
  
  const reportAsyncError = async (asyncFn: () => Promise<any>, context?: string) => {
    try {
      return await asyncFn()
    } catch (error) {
      reportError(error as Error, context)
      throw error // Re-throw so calling code can handle it
    }
  }

  const reportSyncError = (syncFn: () => any, context?: string) => {
    try {
      return syncFn()
    } catch (error) {
      reportError(error as Error, context)
      throw error // Re-throw so calling code can handle it
    }
  }

  return {
    reportError,
    reportAsyncError,
    reportSyncError,
  }
}

// Development-only error testing component
export function ErrorTester() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const { reportError } = useError()

  const testErrors = [
    {
      name: 'Network Error',
      fn: () => reportError(new Error('Simulated network failure'), 'Error Tester')
    },
    {
      name: 'Validation Error',
      fn: () => {
        const error = ErrorFactory.create('VALIDATION_ERROR', {
          message: 'Test validation error',
          userMessage: 'Please check your input and try again.',
        })
        reportError(error)
      }
    },
    {
      name: 'Critical Error',
      fn: () => {
        const error = ErrorFactory.create('CRITICAL_TEST', {
          message: 'Test critical error',
          userMessage: 'A critical error occurred for testing purposes.',
          severity: 'critical' as any,
        })
        reportError(error)
      }
    },
    {
      name: 'Async Error',
      fn: async () => {
        throw new Error('Simulated async error')
      }
    },
  ]

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 space-y-2">
      <h3 className="text-sm font-medium text-yellow-800">Error Tester (Dev Only)</h3>
      <div className="space-y-1">
        {testErrors.map((test) => (
          <button
            key={test.name}
            onClick={test.fn}
            className="block w-full text-left text-xs px-2 py-1 bg-yellow-200 hover:bg-yellow-300 rounded"
          >
            {test.name}
          </button>
        ))}
      </div>
    </div>
  )
}