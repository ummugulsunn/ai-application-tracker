import { 
  ErrorHandler, 
  ErrorFactory, 
  ErrorCategory, 
  ErrorSeverity,
  handleError,
  commonRecoveryActions 
} from '@/lib/errorHandling'

// Mock browser APIs
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}

// Mock global objects
global.localStorage = mockLocalStorage as any
global.sessionStorage = mockSessionStorage as any
global.navigator = {
  onLine: true,
  userAgent: 'test-agent',
  sendBeacon: jest.fn(),
} as any

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
} as any

describe('Comprehensive Error Handling', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSessionStorage.getItem.mockReturnValue(null)
    
    // Reset singleton
    ;(ErrorHandler as any).instance = null
    
    errorHandler = ErrorHandler.getInstance()
  })

  describe('ErrorFactory', () => {
    it('should create errors with predefined configurations', () => {
      const error = ErrorFactory.create('NETWORK_ERROR')
      
      expect(error).toMatchObject({
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        recoverable: true,
      })
      expect(error.id).toBeDefined()
      expect(error.timestamp).toBeDefined()
    })

    it('should create errors with overrides', () => {
      const error = ErrorFactory.create('NETWORK_ERROR', {
        severity: ErrorSeverity.HIGH,
        context: 'API call',
      })
      
      expect(error.severity).toBe(ErrorSeverity.HIGH)
      expect(error.context).toBe('API call')
    })

    it('should create errors from Zod validation errors', () => {
      const zodError = {
        errors: [
          {
            path: ['email'],
            message: 'Invalid email format',
          }
        ]
      } as any
      
      const error = ErrorFactory.fromZodError(zodError, 'Form validation')
      
      expect(error.category).toBe(ErrorCategory.VALIDATION)
      expect(error.context).toBe('Form validation')
      expect(error.details.field).toBe('email')
    })

    it('should create errors from network errors', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'
      
      const error = ErrorFactory.fromNetworkError(networkError, 'API request')
      
      expect(error.category).toBe(ErrorCategory.NETWORK)
      expect(error.context).toBe('API request')
      expect(error.originalError).toBe(networkError)
    })

    it('should handle timeout errors', () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'AbortError'
      
      const error = ErrorFactory.fromNetworkError(timeoutError)
      
      expect(error.code).toBe('TIMEOUT_ERROR')
    })

    it('should create errors from storage errors', () => {
      const storageError = new Error('Storage quota exceeded')
      storageError.name = 'QuotaExceededError'
      
      const error = ErrorFactory.fromStorageError(storageError)
      
      expect(error.code).toBe('STORAGE_FULL')
      expect(error.category).toBe(ErrorCategory.STORAGE)
    })
  })

  describe('ErrorHandler', () => {
    it('should be a singleton', () => {
      const handler1 = ErrorHandler.getInstance()
      const handler2 = ErrorHandler.getInstance()
      
      expect(handler1).toBe(handler2)
    })

    it('should handle errors and store reports', () => {
      const error = ErrorFactory.create('NETWORK_ERROR')
      
      errorHandler.handle(error)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'app_error_reports',
        expect.stringContaining(error.id)
      )
    })

    it('should generate error statistics', () => {
      const error1 = ErrorFactory.create('NETWORK_ERROR')
      const error2 = ErrorFactory.create('VALIDATION_ERROR', { severity: ErrorSeverity.LOW })
      
      errorHandler.handle(error1)
      errorHandler.handle(error2)
      
      const stats = errorHandler.getErrorStatistics()
      
      expect(stats.total).toBe(2)
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1)
      expect(stats.bySeverity[ErrorSeverity.LOW]).toBe(1)
      expect(stats.byCategory[ErrorCategory.NETWORK]).toBe(1)
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1)
    })

    it('should limit stored reports', () => {
      // Create more than maxReports errors
      for (let i = 0; i < 60; i++) {
        const error = ErrorFactory.create('NETWORK_ERROR')
        errorHandler.handle(error)
      }
      
      const recentErrors = errorHandler.getRecentErrors()
      expect(recentErrors.length).toBeLessThanOrEqual(50)
    })

    it('should export reports as JSON', () => {
      const error = ErrorFactory.create('NETWORK_ERROR')
      errorHandler.handle(error)
      
      const exported = errorHandler.exportReports()
      const parsed = JSON.parse(exported)
      
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].error.id).toBe(error.id)
    })

    it('should clear reports', () => {
      const error = ErrorFactory.create('NETWORK_ERROR')
      errorHandler.handle(error)
      
      errorHandler.clearReports()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('app_error_reports')
    })
  })

  // Note: OfflineSyncManager tests would require more complex mocking
  // of React hooks and browser APIs, so we'll focus on core error handling

  describe('Recovery Actions', () => {
    it('should create recovery actions', () => {
      const mockAction = jest.fn()
      const recovery = commonRecoveryActions.retry(mockAction)
      
      expect(recovery).toMatchObject({
        id: 'retry',
        label: 'Try Again',
        description: 'Attempt the operation again',
        primary: true,
      })
      
      recovery.action()
      expect(mockAction).toHaveBeenCalled()
    })

    it('should create reload recovery action', () => {
      const recovery = commonRecoveryActions.reload()
      
      expect(recovery.id).toBe('reload')
      expect(recovery.label).toBe('Reload Page')
      expect(typeof recovery.action).toBe('function')
    })

    it('should create clear storage recovery action', () => {
      const recovery = commonRecoveryActions.clearStorage()
      
      expect(recovery.id).toBe('clear')
      expect(recovery.label).toBe('Clear Data')
      expect(typeof recovery.action).toBe('function')
    })
  })

  describe('Global Error Handling', () => {
    it('should handle unknown errors', () => {
      const unknownError = 'String error'
      const appError = handleError(unknownError, 'Test context')
      
      expect(appError.code).toBe('UNKNOWN_ERROR')
      expect(appError.context).toBe('Test context')
      expect(appError.message).toBe('String error')
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error message')
      const appError = handleError(error, 'Test context')
      
      expect(appError.originalError).toBe(error)
      expect(appError.context).toBe('Test context')
    })

    it('should handle network errors specifically', () => {
      const networkError = new Error('fetch failed')
      networkError.name = 'NetworkError'
      
      const appError = handleError(networkError, 'API call')
      
      expect(appError.category).toBe(ErrorCategory.NETWORK)
      expect(appError.context).toBe('API call')
    })

    it('should handle storage errors specifically', () => {
      const storageError = new Error('QuotaExceededError')
      storageError.name = 'QuotaExceededError'
      
      const appError = handleError(storageError, 'Local storage')
      
      expect(appError.category).toBe(ErrorCategory.STORAGE)
      expect(appError.code).toBe('STORAGE_FULL')
    })
  })

  describe('Error Persistence and Recovery', () => {
    it('should load persisted error reports on initialization', () => {
      const mockReports = [
        {
          error: ErrorFactory.create('NETWORK_ERROR'),
          userAgent: 'test',
          url: 'test',
        }
      ]
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockReports))
      
      // Create new instance to trigger loading
      ;(ErrorHandler as any).instance = null
      const newHandler = ErrorHandler.getInstance()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('app_error_reports')
    })

    it('should handle corrupted persisted data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json')
      
      // Should not throw error
      ;(ErrorHandler as any).instance = null
      const newHandler = ErrorHandler.getInstance()
      
      expect(newHandler.getRecentErrors()).toEqual([])
    })

    it('should queue error reports for offline sending', () => {
      mockNavigator.onLine = false
      
      const error = ErrorFactory.create('NETWORK_ERROR')
      errorHandler.handle(error)
      
      // Should store in queued reports
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'queued_error_reports',
        expect.any(String)
      )
    })
  })

  describe('Performance and Memory Management', () => {
    it('should limit error report storage to prevent memory leaks', () => {
      // Add many errors
      for (let i = 0; i < 100; i++) {
        const error = ErrorFactory.create('NETWORK_ERROR')
        errorHandler.handle(error)
      }
      
      const stats = errorHandler.getErrorStatistics()
      expect(stats.total).toBeLessThanOrEqual(50) // maxReports limit
    })

    it('should handle memory management for error reports', () => {
      // Test that error handler doesn't accumulate unlimited reports
      const initialStats = errorHandler.getErrorStatistics()
      
      // Add many errors
      for (let i = 0; i < 60; i++) {
        const error = ErrorFactory.create('NETWORK_ERROR')
        errorHandler.handle(error)
      }
      
      const finalStats = errorHandler.getErrorStatistics()
      expect(finalStats.total).toBeLessThanOrEqual(50) // Should be limited
    })
  })
})

describe('Error Handling Integration', () => {
  it('should provide comprehensive error context', () => {
    const error = ErrorFactory.create('VALIDATION_ERROR', {
      context: 'User form submission',
    })
    
    errorHandler.handle(error, {
      formData: { email: 'invalid-email' },
      userAction: 'submit',
    })
    
    const recentErrors = errorHandler.getRecentErrors()
    const errorReport = recentErrors[0]
    
    expect(errorReport.error.context).toBe('User form submission')
    expect(errorReport.additionalContext).toMatchObject({
      formData: { email: 'invalid-email' },
      userAction: 'submit',
    })
  })

  it('should handle errors with recovery actions', () => {
    const mockRetry = jest.fn()
    const error = ErrorFactory.create('NETWORK_ERROR', {
      recoveryActions: [commonRecoveryActions.retry(mockRetry)]
    })
    
    errorHandler.handle(error)
    
    const recentErrors = errorHandler.getRecentErrors()
    const errorReport = recentErrors[0]
    
    expect(errorReport.error.recoveryActions).toHaveLength(1)
    expect(errorReport.error.recoveryActions![0].id).toBe('retry')
  })
})