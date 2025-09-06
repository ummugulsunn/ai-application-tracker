import { analytics } from './analytics'

// Performance monitoring
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  context?: Record<string, any>
}

interface ErrorReport {
  error: Error
  context: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

class MonitoringService {
  private performanceObserver?: PerformanceObserver
  private errorHandler?: (event: ErrorEvent) => void
  private unhandledRejectionHandler?: (event: PromiseRejectionEvent) => void

  constructor() {
    this.initializeMonitoring()
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor Core Web Vitals
    this.initializeWebVitals()

    // Monitor JavaScript errors
    this.initializeErrorTracking()

    // Monitor unhandled promise rejections
    this.initializeUnhandledRejectionTracking()

    // Monitor resource loading
    this.initializeResourceMonitoring()
  }

  private initializeWebVitals() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        this.reportMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          context: {
            element: lastEntry.element?.tagName,
            url: lastEntry.url
          }
        })
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.reportMetric({
            name: 'FID',
            value: entry.processingStart - entry.startTime,
            timestamp: Date.now(),
            context: {
              eventType: entry.name
            }
          })
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        this.reportMetric({
          name: 'CLS',
          value: clsValue,
          timestamp: Date.now()
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })

      // Time to First Byte (TTFB)
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          this.reportMetric({
            name: 'TTFB',
            value: entry.responseStart - entry.requestStart,
            timestamp: Date.now()
          })
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
    }
  }

  private initializeErrorTracking() {
    this.errorHandler = (event: ErrorEvent) => {
      this.reportError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    }
    window.addEventListener('error', this.errorHandler)
  }

  private initializeUnhandledRejectionTracking() {
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason))
      
      this.reportError(error, {
        type: 'unhandled_promise_rejection',
        reason: event.reason
      })
    }
    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler)
  }

  private initializeResourceMonitoring() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          // Report slow resources
          if (entry.duration > 1000) {
            this.reportMetric({
              name: 'slow_resource',
              value: entry.duration,
              timestamp: Date.now(),
              context: {
                name: entry.name,
                type: entry.initiatorType,
                size: entry.transferSize
              }
            })
          }

          // Report failed resources
          if (entry.responseStatus >= 400) {
            this.reportError(new Error(`Resource failed to load: ${entry.name}`), {
              status: entry.responseStatus,
              type: entry.initiatorType,
              size: entry.transferSize
            })
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
    }
  }

  reportMetric(metric: PerformanceMetric) {
    // Send to analytics
    analytics.trackPerformance(metric.name, metric.value, metric.context)

    // Log critical performance issues
    if (this.isCriticalMetric(metric)) {
      console.warn(`Critical performance issue: ${metric.name} = ${metric.value}ms`, metric.context)
    }
  }

  reportError(error: Error, context: Record<string, any> = {}) {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    }

    // Send to analytics
    analytics.trackError(error, context)

    // Send to error tracking service (e.g., Sentry)
    this.sendToErrorTracking(errorReport)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', errorReport)
    }
  }

  private isCriticalMetric(metric: PerformanceMetric): boolean {
    const thresholds = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1
      TTFB: 600  // 600ms
    }

    const threshold = thresholds[metric.name as keyof typeof thresholds]
    return threshold !== undefined && metric.value > threshold
  }

  private async sendToErrorTracking(errorReport: ErrorReport) {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: errorReport.error.message,
          stack: errorReport.error.stack,
          context: errorReport.context,
          timestamp: errorReport.timestamp,
          sessionId: errorReport.sessionId,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      })
    } catch (error) {
      console.warn('Failed to send error report:', error)
    }
  }

  private getSessionId(): string {
    // Get session ID from analytics or generate one
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Manual performance tracking
  startTiming(name: string): () => void {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.reportMetric({
        name: `custom_${name}`,
        value: duration,
        timestamp: Date.now()
      })
    }
  }

  // Track user interactions
  trackUserInteraction(action: string, element?: string) {
    analytics.trackUserAction(action, {
      element,
      timestamp: Date.now()
    })
  }

  // Clean up observers
  destroy() {
    if (this.errorHandler) {
      window.removeEventListener('error', this.errorHandler)
    }
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler)
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }
  }
}

// Global monitoring instance
export const monitoring = new MonitoringService()

// React hook for monitoring
export function useMonitoring() {
  return {
    reportError: monitoring.reportError.bind(monitoring),
    reportMetric: monitoring.reportMetric.bind(monitoring),
    startTiming: monitoring.startTiming.bind(monitoring),
    trackUserInteraction: monitoring.trackUserInteraction.bind(monitoring)
  }
}