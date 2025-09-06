/**
 * Performance Monitoring System
 * Tracks and reports application performance metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'render' | 'interaction' | 'network' | 'memory' | 'custom'
  metadata?: Record<string, any>
}

interface PerformanceBudget {
  [key: string]: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []
  private budgets: PerformanceBudget = {
    'first-contentful-paint': 1000,
    'largest-contentful-paint': 2000,
    'first-input-delay': 100,
    'cumulative-layout-shift': 0.1,
    'time-to-interactive': 3000,
    'component-render': 100,
    'csv-processing': 2000,
    'api-request': 500
  }

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          this.recordMetric({
            name: 'largest-contentful-paint',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            category: 'render',
            metadata: { element: (lastEntry as any).element?.tagName }
          })
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as any
          this.recordMetric({
            name: 'first-input-delay',
            value: fidEntry.processingStart ? fidEntry.processingStart - entry.startTime : 0,
            timestamp: Date.now(),
            category: 'interaction',
            metadata: { eventType: entry.name }
          })
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

      // Navigation Observer
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const navEntry = entry as any
          this.recordMetric({
            name: 'navigation-timing',
            value: navEntry.loadEventEnd ? navEntry.loadEventEnd - navEntry.fetchStart : 0,
            timestamp: Date.now(),
            category: 'network',
            metadata: {
              domContentLoaded: navEntry.domContentLoadedEventEnd ? navEntry.domContentLoadedEventEnd - navEntry.fetchStart : 0,
              firstPaint: navEntry.responseEnd ? navEntry.responseEnd - navEntry.fetchStart : 0
            }
          })
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navigationObserver)

      // Resource Observer
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 100) { // Only track slow resources
            const resourceEntry = entry as any
            this.recordMetric({
              name: 'resource-timing',
              value: entry.duration,
              timestamp: Date.now(),
              category: 'network',
              metadata: {
                name: entry.name,
                type: resourceEntry.initiatorType || 'unknown',
                size: resourceEntry.transferSize || 0
              }
            })
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    }

    // CLS Observer using Layout Shift API
    if ('LayoutShift' in window) {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const clsEntry = entry as any
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0
          }
        })
        
        this.recordMetric({
          name: 'cumulative-layout-shift',
          value: clsValue,
          timestamp: Date.now(),
          category: 'render'
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    }
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Check against performance budget
    const budget = this.budgets[metric.name]
    if (budget && metric.value > budget) {
      this.reportBudgetViolation(metric, budget)
    }

    // Limit metrics array size
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }
  }

  mark(name: string, metadata?: Record<string, any>): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name)
    }
    
    this.recordMetric({
      name: `mark-${name}`,
      value: performance.now(),
      timestamp: Date.now(),
      category: 'custom',
      metadata
    })
  }

  measure(name: string, startMark: string, endMark?: string): number {
    let duration = 0
    
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name, 'measure')[0]
        duration = measure?.duration || 0
      } catch (error) {
        console.warn('Performance measure failed:', error)
      }
    }

    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      category: 'custom',
      metadata: { startMark, endMark }
    })

    return duration
  }

  measureComponent(componentName: string, renderFn: () => void): void {
    const startTime = performance.now()
    renderFn()
    const endTime = performance.now()
    
    this.recordMetric({
      name: 'component-render',
      value: endTime - startTime,
      timestamp: Date.now(),
      category: 'render',
      metadata: { component: componentName }
    })
  }

  measureAsync<T>(name: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    
    return asyncFn().then(
      (result) => {
        const endTime = performance.now()
        this.recordMetric({
          name,
          value: endTime - startTime,
          timestamp: Date.now(),
          category: 'custom',
          metadata: { success: true }
        })
        return result
      },
      (error) => {
        const endTime = performance.now()
        this.recordMetric({
          name,
          value: endTime - startTime,
          timestamp: Date.now(),
          category: 'custom',
          metadata: { success: false, error: error.message }
        })
        throw error
      }
    )
  }

  getMetrics(category?: string): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(metric => metric.category === category)
    }
    return [...this.metrics]
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name)
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  getPercentile(name: string, percentile: number): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    
    const sorted = metrics.map(m => m.value).sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  private reportBudgetViolation(metric: PerformanceMetric, budget: number): void {
    console.warn(`Performance budget violation: ${metric.name}`, {
      actual: metric.value,
      budget,
      violation: metric.value - budget,
      metadata: metric.metadata
    })

    // In production, you might want to send this to an analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_budget_violation', {
        metric_name: metric.name,
        actual_value: metric.value,
        budget_value: budget,
        violation_amount: metric.value - budget
      })
    }
  }

  generateReport(): {
    summary: Record<string, any>
    metrics: PerformanceMetric[]
    budgetViolations: Array<{ metric: string; actual: number; budget: number }>
  } {
    const budgetViolations: Array<{ metric: string; actual: number; budget: number }> = []
    const summary: Record<string, any> = {}

    // Calculate summary statistics
    const categories = ['render', 'interaction', 'network', 'memory', 'custom']
    categories.forEach(category => {
      const categoryMetrics = this.getMetrics(category)
      if (categoryMetrics.length > 0) {
        summary[category] = {
          count: categoryMetrics.length,
          average: categoryMetrics.reduce((acc, m) => acc + m.value, 0) / categoryMetrics.length,
          min: Math.min(...categoryMetrics.map(m => m.value)),
          max: Math.max(...categoryMetrics.map(m => m.value))
        }
      }
    })

    // Check budget violations
    Object.entries(this.budgets).forEach(([metricName, budget]) => {
      const average = this.getAverageMetric(metricName)
      if (average > budget) {
        budgetViolations.push({
          metric: metricName,
          actual: average,
          budget
        })
      }
    })

    return {
      summary,
      metrics: this.getMetrics(),
      budgetViolations
    }
  }

  exportMetrics(): string {
    const report = this.generateReport()
    return JSON.stringify(report, null, 2)
  }

  clearMetrics(): void {
    this.metrics = []
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.clearMetrics()
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return {
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureComponent: performanceMonitor.measureComponent.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor)
  }
}

// Utility functions for common performance measurements
export const performanceUtils = {
  measureRender: (componentName: string, renderFn: () => void) => {
    performanceMonitor.measureComponent(componentName, renderFn)
  },
  
  measureCSVProcessing: async (processingFn: () => Promise<any>) => {
    return performanceMonitor.measureAsync('csv-processing', processingFn)
  },
  
  measureAPICall: async (apiCall: () => Promise<any>) => {
    return performanceMonitor.measureAsync('api-request', apiCall)
  },
  
  measureUserInteraction: (interactionName: string, interactionFn: () => void) => {
    const startTime = performance.now()
    interactionFn()
    const endTime = performance.now()
    
    performanceMonitor.recordMetric({
      name: 'user-interaction',
      value: endTime - startTime,
      timestamp: Date.now(),
      category: 'interaction',
      metadata: { interaction: interactionName }
    })
  }
}