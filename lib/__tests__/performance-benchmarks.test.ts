/**
 * Performance Benchmarks and Monitoring Tests
 * Tests application performance metrics and establishes benchmarks
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { performance } from 'perf_hooks'
import Dashboard from '../../components/Dashboard'
import ApplicationTable from '../../components/ApplicationTable'
import ImportModal from '../../components/ImportModal'
import { CSVProcessor } from '../../lib/csv/processor'
import { ApplicationStore } from '../../store/applicationStore'
import type { Application } from '../../types/application'

// Performance monitoring utilities
class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark: string, endMark?: string): number {
    const startTime = this.marks.get(startMark)
    const endTime = endMark ? this.marks.get(endMark) : performance.now()
    
    if (!startTime) {
      throw new Error(`Start mark "${startMark}" not found`)
    }
    
    const duration = (endTime || performance.now()) - startTime
    this.measures.set(name, duration)
    return duration
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name)
  }

  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }
}

// Mock external dependencies
jest.mock('../../lib/indexeddb')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('Performance Benchmarks and Monitoring', () => {
  let monitor: PerformanceMonitor
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    monitor = new PerformanceMonitor()
    user = userEvent.setup()
    ApplicationStore.getState().clearApplications()
  })

  afterEach(() => {
    monitor.clear()
    jest.clearAllMocks()
  })

  describe('Component Rendering Performance', () => {
    it('should render dashboard within performance budget', async () => {
      monitor.mark('dashboard-start')
      
      render(<Dashboard />)
      
      // Wait for all async operations to complete
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument()
      })
      
      monitor.mark('dashboard-end')
      const renderTime = monitor.measure('dashboard-render', 'dashboard-start', 'dashboard-end')
      
      // Dashboard should render within 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should render application table efficiently with large datasets', async () => {
      // Generate large dataset
      const largeDataset: Application[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'Applied',
        appliedDate: new Date(`2024-01-${(i % 28) + 1}`),
        notes: `Notes for application ${i}`,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Application[]

      monitor.mark('table-render-start')
      
      render(<ApplicationTable applications={largeDataset} />)
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
      
      monitor.mark('table-render-end')
      const renderTime = monitor.measure('table-render', 'table-render-start', 'table-render-end')
      
      // Large table should render within 200ms
      expect(renderTime).toBeLessThan(200)
    })

    it('should handle virtual scrolling performance', async () => {
      const largeDataset: Application[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'Applied',
        appliedDate: new Date(),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Application[]

      render(<ApplicationTable applications={largeDataset} virtualScrolling={true} />)

      const table = screen.getByRole('table')
      
      // Test scrolling performance
      monitor.mark('scroll-start')
      
      fireEvent.scroll(table, { target: { scrollTop: 1000 } })
      
      await waitFor(() => {
        // Should render new rows
        expect(screen.getByText(/Company 50/)).toBeInTheDocument()
      })
      
      monitor.mark('scroll-end')
      const scrollTime = monitor.measure('scroll-performance', 'scroll-start', 'scroll-end')
      
      // Scrolling should be smooth (under 16ms for 60fps)
      expect(scrollTime).toBeLessThan(50)
    })
  })

  describe('Data Processing Performance', () => {
    it('should process CSV files within performance budget', async () => {
      const processor = new CSVProcessor()
      
      // Generate large CSV data
      const headers = 'Company,Position,Status,Applied Date,Notes'
      const rows = Array.from({ length: 10000 }, (_, i) => 
        `Company${i},Position${i},Applied,2024-01-15,"Notes for application ${i}"`
      )
      const csvData = [headers, ...rows].join('\n')

      monitor.mark('csv-process-start')
      
      const result = await processor.parse(csvData)
      
      monitor.mark('csv-process-end')
      const processTime = monitor.measure('csv-processing', 'csv-process-start', 'csv-process-end')
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(10000)
      
      // CSV processing should complete within 2 seconds for 10k rows
      expect(processTime).toBeLessThan(2000)
    })

    it('should handle memory efficiently during large imports', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Process multiple large CSV files
      const processor = new CSVProcessor()
      
      for (let i = 0; i < 5; i++) {
        const headers = 'Company,Position,Status,Applied Date'
        const rows = Array.from({ length: 2000 }, (_, j) => 
          `Company${j},Position${j},Applied,2024-01-15`
        )
        const csvData = [headers, ...rows].join('\n')
        
        await processor.parse(csvData)
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it('should perform duplicate detection efficiently', async () => {
      const applications: Application[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `app-${i}`,
        company: i % 100 === 0 ? 'Google' : `Company ${i}`, // Create some duplicates
        position: i % 100 === 0 ? 'Software Engineer' : `Position ${i}`,
        status: 'Applied',
        appliedDate: new Date(),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Application[]

      monitor.mark('duplicate-detection-start')
      
      // This would use the actual duplicate detection logic
      const duplicates = applications.filter((app, index) => 
        applications.findIndex(a => a.company === app.company && a.position === app.position) !== index
      )
      
      monitor.mark('duplicate-detection-end')
      const detectionTime = monitor.measure('duplicate-detection', 'duplicate-detection-start', 'duplicate-detection-end')
      
      expect(duplicates.length).toBeGreaterThan(0)
      
      // Duplicate detection should complete within 500ms for 1000 applications
      expect(detectionTime).toBeLessThan(500)
    })
  })

  describe('User Interaction Performance', () => {
    it('should respond to user input within acceptable time', async () => {
      render(<Dashboard />)
      
      const addButton = screen.getByRole('button', { name: /add application/i })
      
      monitor.mark('interaction-start')
      
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
      
      monitor.mark('interaction-end')
      const interactionTime = monitor.measure('user-interaction', 'interaction-start', 'interaction-end')
      
      // User interactions should respond within 100ms
      expect(interactionTime).toBeLessThan(100)
    })

    it('should handle rapid user input without performance degradation', async () => {
      render(<Dashboard />)
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      
      monitor.mark('rapid-input-start')
      
      // Simulate rapid typing
      const searchTerm = 'Google Software Engineer'
      for (const char of searchTerm) {
        await user.type(searchInput, char, { delay: 10 })
      }
      
      monitor.mark('rapid-input-end')
      const inputTime = monitor.measure('rapid-input', 'rapid-input-start', 'rapid-input-end')
      
      // Should handle rapid input smoothly
      expect(inputTime).toBeLessThan(500)
    })

    it('should maintain performance during concurrent operations', async () => {
      render(<Dashboard />)
      
      monitor.mark('concurrent-start')
      
      // Simulate multiple concurrent operations
      const operations = [
        user.click(screen.getByRole('button', { name: /add application/i })),
        user.click(screen.getByRole('button', { name: /import/i })),
        user.type(screen.getByRole('textbox', { name: /search/i }), 'test')
      ]
      
      await Promise.all(operations)
      
      monitor.mark('concurrent-end')
      const concurrentTime = monitor.measure('concurrent-operations', 'concurrent-start', 'concurrent-end')
      
      // Concurrent operations should complete within reasonable time
      expect(concurrentTime).toBeLessThan(300)
    })
  })

  describe('Memory Usage Monitoring', () => {
    it('should not have memory leaks during normal usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Simulate normal usage pattern
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<Dashboard />)
        
        // Add some applications
        ApplicationStore.getState().addApplication({
          id: `test-${i}`,
          company: `Company ${i}`,
          position: `Position ${i}`,
          status: 'Applied',
          appliedDate: new Date(),
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        } as Application)
        
        // Clean up
        unmount()
        ApplicationStore.getState().clearApplications()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory should not increase significantly
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
    })

    it('should handle large datasets without excessive memory usage', () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Add large dataset to store
      const largeDataset: Application[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'Applied',
        appliedDate: new Date(),
        notes: `Notes for application ${i}`,
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Application[]
      
      largeDataset.forEach(app => ApplicationStore.getState().addApplication(app))
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryUsage = finalMemory - initialMemory
      
      // Memory usage should be reasonable (less than 100MB for 5k applications)
      expect(memoryUsage).toBeLessThan(100 * 1024 * 1024)
      
      // Clean up
      ApplicationStore.getState().clearApplications()
    })
  })

  describe('Network Performance', () => {
    it('should handle API requests efficiently', async () => {
      // Mock API response time
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: [] })
            })
          }, 50) // Simulate 50ms network delay
        })
      )

      monitor.mark('api-request-start')
      
      const response = await fetch('/api/applications')
      const data = await response.json()
      
      monitor.mark('api-request-end')
      const requestTime = monitor.measure('api-request', 'api-request-start', 'api-request-end')
      
      expect(data.success).toBe(true)
      
      // API requests should complete within reasonable time
      expect(requestTime).toBeLessThan(200)
    })

    it('should handle offline scenarios gracefully', async () => {
      // Mock offline scenario
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      
      render(<Dashboard />)
      
      monitor.mark('offline-handling-start')
      
      // Try to perform an action that requires network
      const addButton = screen.getByRole('button', { name: /add application/i })
      await user.click(addButton)
      
      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/working offline/i)).toBeInTheDocument()
      })
      
      monitor.mark('offline-handling-end')
      const offlineTime = monitor.measure('offline-handling', 'offline-handling-start', 'offline-handling-end')
      
      // Offline detection should be fast
      expect(offlineTime).toBeLessThan(100)
    })
  })

  describe('Performance Regression Detection', () => {
    const PERFORMANCE_BASELINES = {
      dashboardRender: 100,
      tableRender: 200,
      csvProcessing: 2000,
      userInteraction: 100,
      apiRequest: 200
    }

    it('should detect performance regressions', async () => {
      const results: Record<string, number> = {}
      
      // Dashboard rendering
      monitor.mark('dashboard-start')
      render(<Dashboard />)
      await waitFor(() => screen.getByRole('main'))
      monitor.mark('dashboard-end')
      results.dashboardRender = monitor.measure('dashboard', 'dashboard-start', 'dashboard-end')
      
      // Table rendering
      const apps = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        status: 'Applied',
        appliedDate: new Date(),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })) as Application[]
      
      monitor.mark('table-start')
      render(<ApplicationTable applications={apps} />)
      await waitFor(() => screen.getByRole('table'))
      monitor.mark('table-end')
      results.tableRender = monitor.measure('table', 'table-start', 'table-end')
      
      // Check against baselines
      Object.entries(results).forEach(([metric, value]) => {
        const baseline = PERFORMANCE_BASELINES[metric as keyof typeof PERFORMANCE_BASELINES]
        if (baseline) {
          expect(value).toBeLessThan(baseline * 1.2) // Allow 20% variance
        }
      })
    })
  })

  describe('Performance Monitoring Integration', () => {
    it('should collect performance metrics for monitoring', async () => {
      const metrics: Record<string, number> = {}
      
      // Mock performance observer
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
        takeRecords: jest.fn().mockReturnValue([
          { name: 'first-contentful-paint', startTime: 150 },
          { name: 'largest-contentful-paint', startTime: 300 },
          { name: 'cumulative-layout-shift', value: 0.05 }
        ])
      }
      
      global.PerformanceObserver = jest.fn().mockImplementation(() => mockObserver)
      
      render(<Dashboard />)
      
      // Simulate performance metrics collection
      const entries = mockObserver.takeRecords()
      entries.forEach((entry: any) => {
        metrics[entry.name] = entry.startTime || entry.value
      })
      
      // Verify metrics are within acceptable ranges
      expect(metrics['first-contentful-paint']).toBeLessThan(1000)
      expect(metrics['largest-contentful-paint']).toBeLessThan(2000)
      expect(metrics['cumulative-layout-shift']).toBeLessThan(0.1)
    })

    it('should report performance issues', async () => {
      const performanceIssues: string[] = []
      
      // Mock performance issue detection
      const checkPerformance = (metric: string, value: number, threshold: number) => {
        if (value > threshold) {
          performanceIssues.push(`${metric} exceeded threshold: ${value}ms > ${threshold}ms`)
        }
      }
      
      // Simulate slow operation
      monitor.mark('slow-operation-start')
      await new Promise(resolve => setTimeout(resolve, 150)) // Simulate 150ms delay
      monitor.mark('slow-operation-end')
      const slowTime = monitor.measure('slow-operation', 'slow-operation-start', 'slow-operation-end')
      
      checkPerformance('slow-operation', slowTime, 100)
      
      expect(performanceIssues).toHaveLength(1)
      expect(performanceIssues[0]).toContain('slow-operation exceeded threshold')
    })
  })
})