'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  WifiIcon,
  SignalSlashIcon
} from '@heroicons/react/24/outline'
import { AppError, ErrorSeverity, RecoveryAction } from '@/lib/errorHandling'

interface ErrorNotificationProps {
  error: AppError
  onDismiss: () => void
  onRetry?: () => void
  autoHide?: boolean
  autoHideDelay?: number
}

export function ErrorNotification({ 
  error, 
  onDismiss, 
  onRetry,
  autoHide = false,
  autoHideDelay = 5000 
}: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000)

  useEffect(() => {
    if (!autoHide) return

    const timer = setTimeout(() => {
      handleDismiss()
    }, autoHideDelay)

    const countdown = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdown)
    }
  }, [autoHide, autoHideDelay])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation
  }

  const getIcon = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return <XCircleIcon className="w-5 h-5" />
      case ErrorSeverity.HIGH:
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case ErrorSeverity.MEDIUM:
        return <InformationCircleIcon className="w-5 h-5" />
      case ErrorSeverity.LOW:
        return <CheckCircleIcon className="w-5 h-5" />
      default:
        return <InformationCircleIcon className="w-5 h-5" />
    }
  }

  const getColorClasses = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-50 border-red-200 text-red-800'
      case ErrorSeverity.HIGH:
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case ErrorSeverity.LOW:
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIconColorClasses = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'text-red-500'
      case ErrorSeverity.HIGH:
        return 'text-orange-500'
      case ErrorSeverity.MEDIUM:
        return 'text-yellow-500'
      case ErrorSeverity.LOW:
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const handleRecoveryAction = async (action: RecoveryAction) => {
    try {
      await action.action()
      handleDismiss()
    } catch (actionError) {
      console.error('Recovery action failed:', actionError)
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className="fixed top-4 right-4 z-50 max-w-md w-full"
      >
        <div className={`rounded-lg border p-4 shadow-lg ${getColorClasses()}`}>
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getIconColorClasses()}`}>
              {getIcon()}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {error.severity === ErrorSeverity.CRITICAL ? 'Critical Error' :
                   error.severity === ErrorSeverity.HIGH ? 'Error' :
                   error.severity === ErrorSeverity.MEDIUM ? 'Warning' : 'Notice'}
                </h3>
                
                <div className="flex items-center space-x-2">
                  {autoHide && timeLeft > 0 && (
                    <span className="text-xs opacity-60">
                      {timeLeft}s
                    </span>
                  )}
                  
                  <button
                    onClick={handleDismiss}
                    className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
                    aria-label="Dismiss notification"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <p className="mt-1 text-sm opacity-90">
                {error.userMessage}
              </p>

              {error.context && (
                <p className="mt-1 text-xs opacity-70">
                  Context: {error.context}
                </p>
              )}

              {/* Recovery Actions */}
              {error.recoveryActions && error.recoveryActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {error.recoveryActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleRecoveryAction(action)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        action.primary
                          ? 'bg-current text-white hover:opacity-90'
                          : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                      }`}
                      title={action.description}
                    >
                      {action.id === 'retry' && <ArrowPathIcon className="w-3 h-3 mr-1" />}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Network Status Indicator */}
              {error.category === 'network' && (
                <div className="mt-2 flex items-center text-xs opacity-70">
                  {navigator.onLine ? (
                    <>
                      <WifiIcon className="w-3 h-3 mr-1" />
                      <span>Online - Retrying automatically</span>
                    </>
                  ) : (
                    <>
                      <SignalSlashIcon className="w-3 h-3 mr-1" />
                      <span>Offline - Will retry when connection is restored</span>
                    </>
                  )}
                </div>
              )}

              {/* Error ID for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs opacity-50 font-mono">
                  ID: {error.id}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Toast-style notification manager
interface NotificationState {
  id: string
  error: AppError
  timestamp: number
}

export function useErrorNotifications() {
  const [notifications, setNotifications] = useState<NotificationState[]>([])

  const showError = (error: AppError) => {
    const notification: NotificationState = {
      id: error.id,
      error,
      timestamp: Date.now(),
    }

    setNotifications(prev => {
      // Remove duplicate notifications
      const filtered = prev.filter(n => n.error.code !== error.code)
      return [...filtered, notification]
    })

    // Auto-remove low severity notifications
    if (error.severity === ErrorSeverity.LOW) {
      setTimeout(() => {
        dismissNotification(notification.id)
      }, 3000)
    }
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const dismissAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    showError,
    dismissNotification,
    dismissAll,
  }
}

// Global notification container
export function ErrorNotificationContainer() {
  const { notifications, dismissNotification } = useErrorNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <ErrorNotification
            key={notification.id}
            error={notification.error}
            onDismiss={() => dismissNotification(notification.id)}
            autoHide={notification.error.severity === ErrorSeverity.LOW}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook to integrate with error handler
export function useErrorHandler() {
  const { showError } = useErrorNotifications()

  const handleError = (error: AppError) => {
    showError(error)
  }

  return { handleError }
}