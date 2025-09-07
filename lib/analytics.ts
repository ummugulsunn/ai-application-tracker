import { featureFlags, FEATURE_FLAGS } from './featureFlags'

// Privacy-focused analytics configuration
interface AnalyticsConfig {
  enabled: boolean
  endpoint?: string
  batchSize: number
  flushInterval: number
  respectDoNotTrack: boolean
  anonymizeIPs: boolean
  cookieConsent: boolean
}

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
  anonymousId: string
}

interface UserProperties {
  userId?: string
  sessionId: string
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  referrer?: string
}

class PrivacyFocusedAnalytics {
  private config: AnalyticsConfig
  private eventQueue: AnalyticsEvent[] = []
  private sessionId: string
  private anonymousId: string
  private userId?: string
  private flushTimer?: NodeJS.Timeout
  private userProperties: UserProperties

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      respectDoNotTrack: true,
      anonymizeIPs: true,
      cookieConsent: false,
      ...config
    }

    this.sessionId = this.generateSessionId()
    this.anonymousId = this.getOrCreateAnonymousId()
    this.userProperties = this.collectUserProperties()

    // Check if analytics should be enabled
    this.config.enabled = this.shouldEnableAnalytics()

    if (this.config.enabled) {
      this.startFlushTimer()
      this.trackPageView()
    }
  }

  private shouldEnableAnalytics(): boolean {
    // Check feature flag
    if (!featureFlags.isEnabled(FEATURE_FLAGS.ANALYTICS_TRACKING)) {
      return false
    }

    // Respect Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      return false
    }

    // Check cookie consent if required
    if (this.config.cookieConsent && !this.hasCookieConsent()) {
      return false
    }

    // Only enable in production by default
    return process.env.NODE_ENV === 'production'
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
    return navigator.doNotTrack === '1' || 
           (navigator as any).msDoNotTrack === '1' ||
           (window as any).doNotTrack === '1'
  }

  private hasCookieConsent(): boolean {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem('analytics-consent') === 'true'
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getOrCreateAnonymousId(): string {
    if (typeof localStorage === 'undefined') {
      return `anon_${Math.random().toString(36).substr(2, 9)}`
    }

    let anonymousId = localStorage.getItem('analytics-anonymous-id')
    if (!anonymousId) {
      anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('analytics-anonymous-id', anonymousId)
    }
    return anonymousId
  }

  private collectUserProperties(): UserProperties {
    const properties: UserProperties = {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown'
    }

    if (typeof document !== 'undefined' && document.referrer) {
      // Anonymize referrer to protect privacy
      try {
        const referrerUrl = new URL(document.referrer)
        properties.referrer = referrerUrl.hostname
      } catch {
        properties.referrer = 'unknown'
      }
    }

    return properties
  }

  setUserId(userId: string) {
    this.userId = userId
    this.userProperties.userId = userId
  }

  track(event: string, properties: Record<string, any> = {}) {
    if (!this.config.enabled) return

    // Sanitize properties to remove PII
    const sanitizedProperties = this.sanitizeProperties(properties)

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: sanitizedProperties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      anonymousId: this.anonymousId
    }

    this.eventQueue.push(analyticsEvent)

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  trackPageView(path?: string) {
    if (typeof window === 'undefined') return

    const pagePath = path || window.location.pathname
    this.track('page_view', {
      path: pagePath,
      title: document.title,
      ...this.userProperties
    })
  }

  trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 1000), // Limit stack trace length
      error_name: error.name,
      ...context
    })
  }

  trackPerformance(metric: string, value: number, context?: Record<string, any>) {
    this.track('performance', {
      metric,
      value,
      ...context
    })
  }

  trackUserAction(action: string, context?: Record<string, any>) {
    this.track('user_action', {
      action,
      ...context
    })
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    // List of keys that might contain PII
    const piiKeys = ['email', 'phone', 'address', 'name', 'firstName', 'lastName', 'ssn', 'creditCard']
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip PII fields
      if (piiKeys.some(piiKey => key.toLowerCase().includes(piiKey.toLowerCase()))) {
        continue
      }
      
      // Limit string length to prevent large data
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...'
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }

  private async flush() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      // Send to analytics endpoint
      if (this.config.endpoint) {
        await fetch(this.config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            events,
            timestamp: Date.now()
          })
        })
      } else {
        // Fallback: send to our internal analytics API
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            events,
            timestamp: Date.now()
          })
        })
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error)
      // Re-queue events for retry (with limit to prevent memory issues)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events)
      }
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
    }
    this.flush() // Final flush
  }

  // Cookie consent management
  grantConsent() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('analytics-consent', 'true')
      this.config.cookieConsent = true
      this.config.enabled = this.shouldEnableAnalytics()
      
      if (this.config.enabled && !this.flushTimer) {
        this.startFlushTimer()
        this.trackPageView()
      }
    }
  }

  revokeConsent() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('analytics-consent', 'false')
      localStorage.removeItem('analytics-anonymous-id')
      this.config.enabled = false
      
      if (this.flushTimer) {
        clearInterval(this.flushTimer)
        this.flushTimer = undefined
      }
      
      this.eventQueue = []
    }
  }
}

// Global analytics instance
export const analytics = new PrivacyFocusedAnalytics()

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    grantConsent: analytics.grantConsent.bind(analytics),
    revokeConsent: analytics.revokeConsent.bind(analytics)
  }
}