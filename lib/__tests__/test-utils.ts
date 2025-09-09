/**
 * Testing Utilities and Helpers
 * Common utilities for testing across the application
 */

import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactElement, ReactNode } from 'react'
import { ApplicationStore } from '../../store/applicationStore'
import { OnboardingStore } from '../../store/onboardingStore'
import { PreferencesStore } from '../../store/preferencesStore'
import type { Application } from '../../types/application'

// Mock implementations
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
}

export const mockSearchParams = new URLSearchParams()

// Test data generators
export const generateMockApplication = (overrides: Partial<Application> = {}): Application => ({
  id: `app-${Math.random().toString(36).substr(2, 9)}`,
  company: 'Test Company',
  position: 'Test Position',
  status: 'Applied',
  appliedDate: new Date('2024-01-15'),
  notes: 'Test notes',
  location: 'Test Location',
  jobType: 'Full-time',
  salaryRange: '$80,000 - $120,000',
  priority: 'Medium',
  jobUrl: 'https://example.com/job',
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const generateMockApplications = (count: number): Application[] => {
  return Array.from({ length: count }, (_, i) => 
    generateMockApplication({
      id: `app-${i}`,
      company: `Company ${i}`,
      position: `Position ${i}`,
      appliedDate: new Date(`2024-01-${(i % 28) + 1}`)
    })
  )
}

// CSV test data
export const generateCSVData = (applications: Partial<Application>[]): string => {
  const headers = 'Company,Position,Status,Applied Date,Location,Notes'
  const rows = applications.map(app => 
    `"${app.company || ''}","${app.position || ''}","${app.status || ''}","${app.appliedDate?.toISOString().split('T')[0] || ''}","${app.location || ''}","${app.notes || ''}"`
  )
  return [headers, ...rows].join('\n')
}

// Store utilities
export const resetAllStores = () => {
  ApplicationStore.getState().clearApplications()
  OnboardingStore.getState().resetOnboarding()
  PreferencesStore.getState().resetPreferences()
}

export const populateApplicationStore = (applications: Application[]) => {
  applications.forEach(app => ApplicationStore.getState().addApplication(app))
}

// Render utilities
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

const AllTheProviders = ({ 
  children, 
  queryClient = createTestQueryClient() 
}: { 
  children: ReactNode
  queryClient?: QueryClient 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Performance testing utilities
export class PerformanceTestHelper {
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

  expectPerformance(name: string, threshold: number): void {
    const measure = this.measures.get(name)
    if (measure === undefined) {
      throw new Error(`Measure "${name}" not found`)
    }
    expect(measure).toBeLessThan(threshold)
  }

  clear(): void {
    this.marks.clear()
    this.measures.clear()
  }
}

// Accessibility testing utilities
export const setupAccessibilityTest = () => {
  // Mock accessibility preferences
  const mockPreferences = {
    highContrast: false,
    fontSize: 'medium',
    reduceMotion: false,
    screenReader: false
  }

  localStorage.setItem('accessibility-preferences', JSON.stringify(mockPreferences))

  return {
    setHighContrast: (enabled: boolean) => {
      mockPreferences.highContrast = enabled
      localStorage.setItem('accessibility-preferences', JSON.stringify(mockPreferences))
    },
    setFontSize: (size: 'small' | 'medium' | 'large') => {
      mockPreferences.fontSize = size
      localStorage.setItem('accessibility-preferences', JSON.stringify(mockPreferences))
    },
    setReduceMotion: (enabled: boolean) => {
      mockPreferences.reduceMotion = enabled
      localStorage.setItem('accessibility-preferences', JSON.stringify(mockPreferences))
    }
  }
}

// File testing utilities
export const createMockFile = (
  content: string, 
  filename: string, 
  type: string = 'text/csv'
): File => {
  return new File([content], filename, { type })
}

export const createMockFileList = (files: File[]): FileList => {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (let i = 0; i < files.length; i++) {
        yield files[i]
      }
    }
  }
  
  // Add files as indexed properties
  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, {
      value: file,
      enumerable: true
    })
  })
  
  return fileList as FileList
}

// API mocking utilities
export const mockFetch = (response: unknown, delay: number = 0) => {
  global.fetch = jest.fn().mockImplementation(() =>
    new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response)),
          blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
          status: 200,
          statusText: 'OK'
        })
      }, delay)
    })
  )
}

export const mockFetchError = (error: string, status: number = 500) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error }),
      status,
      statusText: error
    })
  )
}

// Async testing utilities
export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

export const waitForTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Local storage utilities
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get store() {
      return { ...store }
    }
  }
}

// Error boundary testing
export const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinPerformanceBudget(threshold: number): R
      toHaveAccessibleName(): R
      toBeKeyboardAccessible(): R
    }
  }
}

// Performance matcher
expect.extend({
  toBeWithinPerformanceBudget(received: number, threshold: number) {
    const pass = received < threshold
    return {
      message: () =>
        `expected ${received}ms to be ${pass ? 'not ' : ''}within performance budget of ${threshold}ms`,
      pass,
    }
  },
  
  toHaveAccessibleName(received: HTMLElement) {
    const accessibleName = received.getAttribute('aria-label') || 
                          received.getAttribute('aria-labelledby') ||
                          received.textContent
    const pass = !!accessibleName
    return {
      message: () =>
        `expected element to ${pass ? 'not ' : ''}have an accessible name`,
      pass,
    }
  },
  
  toBeKeyboardAccessible(received: HTMLElement) {
    const tabIndex = received.getAttribute('tabindex')
    const role = received.getAttribute('role')
    const isInteractive = ['button', 'link', 'input', 'select', 'textarea'].includes(received.tagName.toLowerCase()) ||
                         ['button', 'link', 'textbox', 'combobox'].includes(role || '')
    
    const pass = isInteractive && (tabIndex === null || parseInt(tabIndex) >= 0)
    return {
      message: () =>
        `expected element to ${pass ? 'not ' : ''}be keyboard accessible`,
      pass,
    }
  }
})

export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'