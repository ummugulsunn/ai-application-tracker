/**
 * Comprehensive error handling system with user-friendly messages and recovery options
 */

import { z } from 'zod'

// Error types and categories
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  STORAGE = 'storage',
  AI_SERVICE = 'ai_service',
  CSV_IMPORT = 'csv_import',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Base error interface
export interface AppError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  details?: any
  timestamp: string
  context?: string
  recoverable: boolean
  recoveryActions?: RecoveryAction[]
  originalError?: Error
}

// Recovery action interface
export interface RecoveryAction {
  id: string
  label: string
  description: string
  action: () => void | Promise<void>
  primary?: boolean
}

// Error reporting interface
export interface ErrorReport {
  error: AppError
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  additionalContext?: Record<string, any>
}

// Predefined error configurations
const ERROR_CONFIGS: Record<string, Partial<AppError>> = {
  // Validation errors
  INVALID_EMAIL: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    code: 'INVALID_EMAIL',
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address.',
    recoverable: true,
  },
  INVALID_PASSWORD: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    code: 'INVALID_PASSWORD',
    message: 'Password does not meet requirements',
    userMessage: 'Password must be at least 8 characters with uppercase, lowercase, and number.',
    recoverable: true,
  },
  REQUIRED_FIELD: {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    code: 'REQUIRED_FIELD',
    message: 'Required field is missing',
    userMessage: 'This field is required. Please fill it out.',
    recoverable: true,
  },

  // Network errors
  NETWORK_ERROR: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    recoverable: true,
  },
  TIMEOUT_ERROR: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    code: 'TIMEOUT_ERROR',
    message: 'Request timed out',
    userMessage: 'The request is taking longer than expected. Please try again.',
    recoverable: true,
  },

  // Authentication errors
  INVALID_CREDENTIALS: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid login credentials',
    userMessage: 'Invalid email or password. Please try again.',
    recoverable: true,
  },
  SESSION_EXPIRED: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    code: 'SESSION_EXPIRED',
    message: 'User session has expired',
    userMessage: 'Your session has expired. Please log in again.',
    recoverable: true,
  },

  // Storage errors
  STORAGE_FULL: {
    category: ErrorCategory.STORAGE,
    severity: ErrorSeverity.HIGH,
    code: 'STORAGE_FULL',
    message: 'Local storage is full',
    userMessage: 'Your device storage is full. Please free up some space or clear old data.',
    recoverable: true,
  },
  STORAGE_ERROR: {
    category: ErrorCategory.STORAGE,
    severity: ErrorSeverity.MEDIUM,
    code: 'STORAGE_ERROR',
    message: 'Failed to access local storage',
    userMessage: 'Unable to save data locally. Your changes may not be preserved.',
    recoverable: true,
  },

  // AI Service errors
  AI_SERVICE_UNAVAILABLE: {
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.MEDIUM,
    code: 'AI_SERVICE_UNAVAILABLE',
    message: 'AI service is temporarily unavailable',
    userMessage: 'AI features are temporarily unavailable. You can still use other features.',
    recoverable: true,
  },
  AI_RATE_LIMIT: {
    category: ErrorCategory.AI_SERVICE,
    severity: ErrorSeverity.LOW,
    code: 'AI_RATE_LIMIT',
    message: 'AI service rate limit exceeded',
    userMessage: 'You have reached the AI usage limit. Please try again later.',
    recoverable: true,
  },

  // CSV Import errors
  CSV_PARSE_ERROR: {
    category: ErrorCategory.CSV_IMPORT,
    severity: ErrorSeverity.MEDIUM,
    code: 'CSV_PARSE_ERROR',
    message: 'Failed to parse CSV file',
    userMessage: 'Unable to read the CSV file. Please check the file format.',
    recoverable: true,
  },
  CSV_INVALID_FORMAT: {
    category: ErrorCategory.CSV_IMPORT,
    severity: ErrorSeverity.LOW,
    code: 'CSV_INVALID_FORMAT',
    message: 'CSV file has invalid format',
    userMessage: 'The CSV file format is not recognized. Please use a standard CSV format.',
    recoverable: true,
  },
  CSV_TOO_LARGE: {
    category: ErrorCategory.CSV_IMPORT,
    severity: ErrorSeverity.MEDIUM,
    code: 'CSV_TOO_LARGE',
    message: 'CSV file is too large',
    userMessage: 'The file is too large to process. Please use a smaller file or split it.',
    recoverable: true,
  },

  // Server errors
  SERVER_ERROR: {
    category: ErrorCategory.SERVER_ERROR,
    severity: ErrorSeverity.HIGH,
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. Please try again later.',
    recoverable: true,
  },
  NOT_FOUND: {
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    code: 'NOT_FOUND',
    message: 'Resource not found',
    userMessage: 'The requested item could not be found.',
    recoverable: false,
  },
}

// Error factory class
export class ErrorFactory {
  static create(
    errorCode: string,
    overrides?: Partial<AppError>,
    originalError?: Error
  ): AppError {
    const config = ERROR_CONFIGS[errorCode] || {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      userMessage: 'Something unexpected happened. Please try again.',
      recoverable: true,
    }

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      recoverable: true,
      ...config,
      ...overrides,
      originalError,
    } as AppError
  }

  static fromZodError(zodError: z.ZodError, context?: string): AppError {
    const firstError = zodError.errors[0]
    const fieldName = firstError?.path.join('.') || 'field'
    
    return this.create('REQUIRED_FIELD', {
      message: `Validation failed for ${fieldName}: ${firstError?.message}`,
      userMessage: firstError?.message || 'Please check your input and try again.',
      details: {
        field: fieldName,
        errors: zodError.errors,
      },
      context,
    })
  }

  static fromNetworkError(error: Error, context?: string): AppError {
    if (error.name === 'AbortError') {
      return this.create('TIMEOUT_ERROR', { context })
    }
    
    return this.create('NETWORK_ERROR', {
      message: error.message,
      context,
      originalError: error,
    })
  }

  static fromStorageError(error: Error, context?: string): AppError {
    if (error.name === 'QuotaExceededError') {
      return this.create('STORAGE_FULL', { context })
    }
    
    return this.create('STORAGE_ERROR', {
      message: error.message,
      context,
      originalError: error,
    })
  }
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorReports: ErrorReport[] = []
  private maxReports = 50
  private isOnline = true
  private retryQueue: Array<{ error: AppError; retryCount: number; maxRetries: number }> = []

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  constructor() {
    // Initialize online status monitoring
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processRetryQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    }
    
    // Load persisted error reports
    this.loadPersistedReports()
  }

  handle(error: AppError, additionalContext?: Record<string, any>): void {
    // Enhanced logging with structured data
    this.logError(error, additionalContext)

    // Create comprehensive error report
    const report: ErrorReport = {
      error,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      additionalContext: {
        ...additionalContext,
        isOnline: this.isOnline,
        timestamp: new Date().toISOString(),
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight,
        } : undefined,
        performance: this.getPerformanceMetrics(),
      },
    }

    // Store report with enhanced persistence
    this.storeReport(report)

    // Add to retry queue if recoverable and network-related
    if (error.recoverable && this.isNetworkError(error)) {
      this.addToRetryQueue(error)
    }

    // Handle based on severity with graceful degradation
    this.handleErrorBySeverity(error)

    // Attempt to send error report to monitoring service
    this.sendErrorReport(report)
  }

  private storeReport(report: ErrorReport): void {
    this.errorReports.push(report)
    
    // Keep only recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(-this.maxReports)
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('app_error_reports', JSON.stringify(this.errorReports))
    } catch (e) {
      console.warn('Failed to store error reports in localStorage:', e)
    }
  }

  private handleCriticalError(error: AppError): void {
    // For critical errors, we might want to reload the page or redirect
    console.error('CRITICAL ERROR:', error)
    
    // Show modal or redirect to error page
    if (typeof window !== 'undefined') {
      const shouldReload = confirm(
        `${error.userMessage}\n\nWould you like to reload the page?`
      )
      if (shouldReload) {
        window.location.reload()
      }
    }
  }

  private handleHighSeverityError(error: AppError): void {
    // Show prominent error notification
    this.showErrorNotification(error, 'error')
  }

  private handleMediumSeverityError(error: AppError): void {
    // Show standard error notification
    this.showErrorNotification(error, 'warning')
  }

  private handleLowSeverityError(error: AppError): void {
    // Show subtle notification or inline error
    this.showErrorNotification(error, 'info')
  }

  private showErrorNotification(error: AppError, type: 'error' | 'warning' | 'info'): void {
    // Dispatch custom event for error notification system
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('app-error', {
        detail: { error, type }
      })
      window.dispatchEvent(event)
    }
    
    // Also log to console for debugging
    console.log(`${type.toUpperCase()}: ${error.userMessage}`)
  }

  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorReports.slice(-limit)
  }

  clearReports(): void {
    this.errorReports = []
    try {
      localStorage.removeItem('app_error_reports')
    } catch (e) {
      console.warn('Failed to clear error reports from localStorage:', e)
    }
  }

  exportReports(): string {
    return JSON.stringify(this.errorReports, null, 2)
  }

  // Enhanced error logging with structured data
  private logError(error: AppError, additionalContext?: Record<string, any>): void {
    const logData = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      timestamp: error.timestamp,
      context: error.context,
      recoverable: error.recoverable,
      additionalContext,
      stackTrace: error.originalError?.stack,
    }

    // Use appropriate console method based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData)
        break
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData)
        break
      case ErrorSeverity.LOW:
        console.info('ℹ️ LOW SEVERITY ERROR:', logData)
        break
    }

    // Send to external logging service if available
    this.sendToLoggingService(logData)
  }

  private sendToLoggingService(logData: any): void {
    // Only attempt if online and in production
    if (!this.isOnline || process.env.NODE_ENV !== 'production') {
      return
    }

    try {
      // This would integrate with services like Sentry, LogRocket, etc.
      // For now, we'll just store it for batch sending
      const logsToSend = JSON.parse(localStorage.getItem('pending_logs') || '[]')
      logsToSend.push(logData)
      
      // Keep only recent logs to prevent storage overflow
      if (logsToSend.length > 100) {
        logsToSend.splice(0, logsToSend.length - 100)
      }
      
      localStorage.setItem('pending_logs', JSON.stringify(logsToSend))
    } catch (e) {
      console.warn('Failed to queue log for external service:', e)
    }
  }

  private getCurrentUserId(): string | undefined {
    try {
      // Try to get user ID from various sources
      const authData = localStorage.getItem('auth_user')
      if (authData) {
        const user = JSON.parse(authData)
        return user.id || user.email
      }
    } catch (e) {
      // Ignore errors getting user ID
    }
    return undefined
  }

  private getSessionId(): string {
    try {
      let sessionId = sessionStorage.getItem('session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        sessionStorage.setItem('session_id', sessionId)
      }
      return sessionId
    } catch (e) {
      return 'unknown'
    }
  }

  private getPerformanceMetrics(): any {
    if (typeof window === 'undefined' || !window.performance) {
      return null
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const memory = (performance as any).memory

      return {
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        memory: memory ? {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        } : null,
      }
    } catch (e) {
      return null
    }
  }

  private isNetworkError(error: AppError): boolean {
    return error.category === ErrorCategory.NETWORK || 
           error.code === 'NETWORK_ERROR' || 
           error.code === 'TIMEOUT_ERROR'
  }

  private addToRetryQueue(error: AppError, maxRetries = 3): void {
    const existingEntry = this.retryQueue.find(entry => entry.error.id === error.id)
    
    if (existingEntry) {
      existingEntry.retryCount++
    } else {
      this.retryQueue.push({
        error,
        retryCount: 0,
        maxRetries,
      })
    }
  }

  private async processRetryQueue(): Promise<void> {
    if (!this.isOnline || this.retryQueue.length === 0) {
      return
    }

    const itemsToRetry = [...this.retryQueue]
    
    for (const item of itemsToRetry) {
      if (item.retryCount < item.maxRetries) {
        try {
          // Attempt to retry the original operation
          await this.retryOperation(item.error)
          
          // Remove from queue on success
          this.retryQueue = this.retryQueue.filter(entry => entry.error.id !== item.error.id)
        } catch (retryError) {
          item.retryCount++
          
          // Remove from queue if max retries reached
          if (item.retryCount >= item.maxRetries) {
            this.retryQueue = this.retryQueue.filter(entry => entry.error.id !== item.error.id)
            
            // Log final failure
            console.error('Max retries reached for error:', item.error.id)
          }
        }
      }
    }
  }

  private async retryOperation(error: AppError): Promise<void> {
    // This would contain logic to retry the original operation
    // For now, we'll just simulate a retry
    console.log('Retrying operation for error:', error.id)
    
    // In a real implementation, you would:
    // 1. Identify the original operation from the error context
    // 2. Re-execute the operation
    // 3. Handle success/failure appropriately
  }

  private handleErrorBySeverity(error: AppError): void {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.handleCriticalError(error)
        break
      case ErrorSeverity.HIGH:
        this.handleHighSeverityError(error)
        break
      case ErrorSeverity.MEDIUM:
        this.handleMediumSeverityError(error)
        break
      case ErrorSeverity.LOW:
        this.handleLowSeverityError(error)
        break
    }
  }

  private loadPersistedReports(): void {
    try {
      const stored = localStorage.getItem('app_error_reports')
      if (stored) {
        this.errorReports = JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to load persisted error reports:', e)
      this.errorReports = []
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    if (!this.isOnline) {
      // Queue for later sending
      this.queueErrorReport(report)
      return
    }

    try {
      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      }
    } catch (e) {
      // Queue for retry if sending fails
      this.queueErrorReport(report)
    }
  }

  private queueErrorReport(report: ErrorReport): void {
    try {
      const queuedReports = JSON.parse(localStorage.getItem('queued_error_reports') || '[]')
      queuedReports.push(report)
      
      // Keep only recent reports
      if (queuedReports.length > 20) {
        queuedReports.splice(0, queuedReports.length - 20)
      }
      
      localStorage.setItem('queued_error_reports', JSON.stringify(queuedReports))
    } catch (e) {
      console.warn('Failed to queue error report:', e)
    }
  }

  // Public method to get error statistics
  getErrorStatistics(): {
    total: number
    bySeverity: Record<ErrorSeverity, number>
    byCategory: Record<ErrorCategory, number>
    recent: number
  } {
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    const stats = {
      total: this.errorReports.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      recent: 0,
    }

    // Initialize counters
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0
    })
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = 0
    })

    // Count errors
    this.errorReports.forEach(report => {
      const errorTime = new Date(report.error.timestamp).getTime()
      
      stats.bySeverity[report.error.severity]++
      stats.byCategory[report.error.category]++
      
      if (errorTime > oneHourAgo) {
        stats.recent++
      }
    })

    return stats
  }
}

// Utility functions
export const handleError = (error: unknown, context?: string): AppError => {
  const errorHandler = ErrorHandler.getInstance()
  
  let appError: AppError

  if (error instanceof z.ZodError) {
    appError = ErrorFactory.fromZodError(error, context)
  } else if (error instanceof Error) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      appError = ErrorFactory.fromNetworkError(error, context)
    } else if (error.name === 'QuotaExceededError' || error.message.includes('storage')) {
      appError = ErrorFactory.fromStorageError(error, context)
    } else {
      appError = ErrorFactory.create('SERVER_ERROR', {
        message: error.message,
        context,
        originalError: error,
      })
    }
  } else {
    appError = ErrorFactory.create('UNKNOWN_ERROR', {
      message: String(error),
      context,
    })
  }

  errorHandler.handle(appError)
  return appError
}

export const createRecoveryAction = (
  id: string,
  label: string,
  description: string,
  action: () => void | Promise<void>,
  primary = false
): RecoveryAction => ({
  id,
  label,
  description,
  action,
  primary,
})

// Common recovery actions
export const commonRecoveryActions = {
  retry: (retryFn: () => void | Promise<void>) =>
    createRecoveryAction('retry', 'Try Again', 'Attempt the operation again', retryFn, true),
  
  reload: () =>
    createRecoveryAction('reload', 'Reload Page', 'Refresh the current page', () => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }),
  
  goHome: () =>
    createRecoveryAction('home', 'Go Home', 'Return to the main page', () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }),
  
  clearStorage: () =>
    createRecoveryAction('clear', 'Clear Data', 'Clear local data and start fresh', () => {
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
      }
    }),
}

// Error boundary integration
export const errorBoundaryHandler = (error: Error, errorInfo: React.ErrorInfo): void => {
  const appError = ErrorFactory.create('CLIENT_ERROR', {
    message: error.message,
    context: 'React Error Boundary',
    details: {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    },
    originalError: error,
    severity: ErrorSeverity.HIGH,
  })

  ErrorHandler.getInstance().handle(appError, {
    componentStack: errorInfo.componentStack,
  })
}