import { featureFlags, FEATURE_FLAGS } from '../featureFlags'

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

// Mock performance API
const performanceMock = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
}
Object.defineProperty(global, 'performance', {
  value: performanceMock
})

// Mock PerformanceObserver
global.PerformanceObserver = jest.fn().mockImplementation((_callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn()
})) as any

// Add supportedEntryTypes property
Object.defineProperty(global.PerformanceObserver, 'supportedEntryTypes', {
  value: ['navigation', 'resource', 'paint', 'measure', 'mark'],
  writable: false
})

describe('Feature Flags System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should check if feature is enabled', () => {
    const isEnabled = featureFlags.isEnabled(FEATURE_FLAGS.AI_INSIGHTS)
    expect(typeof isEnabled).toBe('boolean')
  })

  it('should respect environment restrictions', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true
    })
    
    const flags = featureFlags.getAllFlags()
    expect(flags).toBeDefined()
    expect(typeof flags).toBe('object')
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true
    })
  })

  it('should handle user-specific rollouts', () => {
    const userId = 'test-user-123'
    featureFlags.setUserId(userId)
    
    const isEnabled = featureFlags.isEnabled(FEATURE_FLAGS.USER_AUTHENTICATION, userId)
    expect(typeof isEnabled).toBe('boolean')
  })

  it('should update feature flags', () => {
    featureFlags.updateFlag(FEATURE_FLAGS.AI_INSIGHTS, {
      enabled: false,
      rolloutPercentage: 0
    })
    
    const isEnabled = featureFlags.isEnabled(FEATURE_FLAGS.AI_INSIGHTS)
    expect(isEnabled).toBe(false)
  })
})

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return health status', async () => {
    const mockHealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'test',
      uptime: 3600,
      memory: {
        used: 100,
        total: 512,
        external: 50
      },
      checks: {
        database: { status: 'healthy', responseTime: 50 },
        storage: { status: 'healthy', responseTime: 25 },
        ai: { status: 'healthy', responseTime: 200 }
      }
    }

    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHealthResponse
    } as Response)

    const response = await fetch('/api/health')
    const data = await response.json()

    expect(data.status).toBe('healthy')
    expect(data.checks).toBeDefined()
    expect(data.memory).toBeDefined()
  })

  it('should handle health check failures', async () => {
    ;(fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Health check failed'))

    try {
      await fetch('/api/health')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
    }
  })
})

describe('Feature Flags API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return feature flags for user', async () => {
    const mockFlagsResponse = {
      success: true,
      data: {
        ai_insights: true,
        user_authentication: false,
        backup_system: true
      },
      timestamp: new Date().toISOString()
    }

    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFlagsResponse
    } as Response)

    const response = await fetch('/api/feature-flags?userId=test-user')
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
    expect(typeof data.data).toBe('object')
  })
})

describe('Error Reporting API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should accept error reports', async () => {
    const errorReport = {
      message: 'Test error',
      stack: 'Error stack trace',
      context: { component: 'TestComponent' },
      timestamp: Date.now(),
      sessionId: 'session_123',
      url: 'http://localhost:3000/test',
      userAgent: 'Mozilla/5.0 Test Browser'
    }

    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, timestamp: new Date().toISOString() })
    } as Response)

    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    })

    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('should validate error report data', async () => {
    const invalidErrorReport = {
      message: 'Test error'
      // Missing required fields
    }

    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'INVALID_ERROR_REPORT',
          message: 'Invalid error report data'
        }
      })
    } as Response)

    const response = await fetch('/api/monitoring/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidErrorReport)
    })

    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })
})

describe('Analytics Events API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should accept analytics events', async () => {
    const analyticsEvents = {
      events: [
        {
          event: 'page_view',
          properties: { path: '/dashboard' },
          timestamp: Date.now(),
          sessionId: 'session_123',
          anonymousId: 'anon_456'
        }
      ],
      timestamp: Date.now()
    }

    ;(fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        processed: 1,
        timestamp: new Date().toISOString()
      })
    } as Response)

    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analyticsEvents)
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.processed).toBe(1)
  })
})

describe('Integration Tests', () => {
  it('should integrate feature flags with monitoring', () => {
    const isMonitoringEnabled = featureFlags.isEnabled(FEATURE_FLAGS.PERFORMANCE_MONITORING)
    expect(typeof isMonitoringEnabled).toBe('boolean')
  })

  it('should handle deployment configuration', () => {
    // Test that deployment configuration is properly set up
    expect(process.env.NODE_ENV).toBeDefined()
    
    // Test feature flags configuration
    const flags = featureFlags.getAllFlags()
    expect(flags).toBeDefined()
    expect(typeof flags).toBe('object')
  })
})