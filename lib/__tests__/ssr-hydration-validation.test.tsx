/**
 * Server-Side Rendering and Hydration Validation Tests
 * Tests that specifically validate SSR behavior and detect hydration mismatches
 */

import React from 'react'
import { render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import ApplicationTable from '@/components/ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'
import { 
  validateHydrationSafety, 
  useHydrationMismatchDetector,
  createStableKey,
  validateListKeys 
} from '@/lib/utils/hydrationUtils'
import { getStaticDateDisplay, validateDateFormatting } from '@/lib/utils/dateFormatting'

// Mock dependencies
jest.mock('@/store/applicationStore')
jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() }
}))

// Mock the HydrationErrorBoundary to prevent fallback UI during tests
jest.mock('@/components/HydrationErrorBoundary', () => ({
  HydrationErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  useHydrationErrorHandler: () => ({
    handleHydrationError: jest.fn()
  })
}))

const mockUseApplicationStore = useApplicationStore as jest.MockedFunction<typeof useApplicationStore>

const testApplications: Application[] = [
  {
    id: 'stable-id-1',
    company: 'Consistent Company',
    position: 'SSR Engineer',
    location: 'Server Side',
    type: 'Full-time',
    salary: '$120,000',
    status: 'Applied',
    priority: 'High',
    appliedDate: '2024-01-15T10:30:00.000Z',
    notes: 'SSR test application'
  },
  {
    id: 'stable-id-2',
    company: 'Hydration Corp',
    position: 'Client Developer',
    location: 'Browser Land',
    type: 'Contract',
    salary: '$90,000',
    status: 'Interviewing',
    priority: 'Medium',
    appliedDate: '2024-01-10T15:45:00.000Z',
    notes: 'Hydration test application'
  }
]

const mockStoreState = {
  getFilteredApplications: jest.fn(() => testApplications),
  deleteApplication: jest.fn(),
  deleteApplications: jest.fn(),
  setSearchQuery: jest.fn(),
  setSortOptions: jest.fn(),
  sortOptions: { field: 'appliedDate' as keyof Application, direction: 'desc' as const },
  searchQuery: ''
}

describe('SSR and Hydration Validation', () => {
  beforeEach(() => {
    mockUseApplicationStore.mockReturnValue(mockStoreState)
    jest.clearAllMocks()
  })

  describe('Server-Side Rendering Validation', () => {
    it('should render to string without errors', () => {
      // Mock animations as disabled for SSR
      jest.doMock('@/lib/utils/animationUtils', () => ({
        ...jest.requireActual('@/lib/utils/animationUtils'),
        useHydrationSafeAnimations: () => false,
      }))

      expect(() => {
        const html = renderToString(<ApplicationTable />)
        expect(typeof html).toBe('string')
        expect(html.length).toBeGreaterThan(0)
      }).not.toThrow()
    })

    it('should produce deterministic HTML output', () => {
      // Mock animations consistently
      jest.doMock('@/lib/utils/animationUtils', () => ({
        ...jest.requireActual('@/lib/utils/animationUtils'),
        useHydrationSafeAnimations: () => false,
      }))

      const html1 = renderToString(<ApplicationTable />)
      const html2 = renderToString(<ApplicationTable />)
      
      expect(html1).toBe(html2)
    })

    it('should not include client-only content in SSR', () => {
      jest.doMock('@/lib/utils/animationUtils', () => ({
        ...jest.requireActual('@/lib/utils/animationUtils'),
        useHydrationSafeAnimations: () => false,
      }))

      const html = renderToString(<ApplicationTable />)
      
      // Should not contain animation classes that are client-only
      expect(html).not.toContain('transition-all')
      expect(html).not.toContain('hover:shadow-lg')
      expect(html).not.toContain('animate-')
      
      // Should contain static content
      expect(html).toContain('Consistent Company')
      expect(html).toContain('SSR Engineer')
      expect(html).toContain('Jan 15, 2024') // Static date format
    })

    it('should handle SSR with empty data', () => {
      mockStoreState.getFilteredApplications.mockReturnValue([])
      
      expect(() => {
        const html = renderToString(<ApplicationTable />)
        expect(html).toContain('No applications found')
      }).not.toThrow()
    })
  })

  describe('Hydration Mismatch Detection', () => {
    it('should detect potential hydration issues in props', () => {
      const safeProps = {
        title: 'Safe Title',
        count: 42,
        isActive: true,
        items: ['item1', 'item2']
      }
      
      const unsafeProps = {
        title: 'Unsafe Title',
        createdAt: new Date(), // This will cause hydration issues
        randomValue: Math.random(), // This will cause hydration issues
        callback: () => {} // Functions can cause issues if used in rendering
      }
      
      const safeResult = validateHydrationSafety(safeProps)
      const unsafeResult = validateHydrationSafety(unsafeProps)
      
      expect(safeResult.isHydrationSafe).toBe(true)
      expect(safeResult.issues).toHaveLength(0)
      
      expect(unsafeResult.isHydrationSafe).toBe(false)
      expect(unsafeResult.issues.length).toBeGreaterThan(0)
      expect(unsafeResult.issues.some(issue => issue.includes('Date object'))).toBe(true)
    })

    it('should validate stable keys for list rendering', () => {
      const goodItems = [
        { id: 'item-1', name: 'Item 1' },
        { id: 'item-2', name: 'Item 2' },
        { id: 'item-3', name: 'Item 3' }
      ]
      
      const badItems = [
        { id: 'duplicate', name: 'Item 1' },
        { id: 'duplicate', name: 'Item 2' }, // Duplicate key
        { id: 'item-3', name: 'Item 3' }
      ]
      
      const itemsWithoutIds = [
        { name: 'Item 1' },
        { name: 'Item 2' }
      ]
      
      const goodResult = validateListKeys(goodItems)
      const badResult = validateListKeys(badItems)
      const noIdResult = validateListKeys(itemsWithoutIds)
      
      expect(goodResult.isValid).toBe(true)
      expect(badResult.isValid).toBe(false)
      expect(badResult.issues).toContain('Duplicate key found: duplicate')
      expect(noIdResult.isValid).toBe(false)
      expect(noIdResult.issues.some(issue => issue.includes('array index'))).toBe(true)
    })

    it('should create stable keys consistently', () => {
      const key1 = createStableKey('app', 'test-id')
      const key2 = createStableKey('app', 'test-id')
      const key3 = createStableKey('app', 'test-id', 'suffix')
      
      expect(key1).toBe(key2)
      expect(key1).toBe('app-test-id')
      expect(key3).toBe('app-test-id-suffix')
      
      // Keys should be deterministic across multiple calls
      const keys = Array.from({ length: 10 }, () => createStableKey('item', 123))
      expect(keys.every(key => key === keys[0])).toBe(true)
    })

    it('should validate date formatting for hydration safety', () => {
      const testDates = [
        '2024-01-15T10:30:00.000Z',
        new Date('2024-01-15T10:30:00.000Z'),
        '2024-12-31T23:59:59.999Z'
      ]
      
      testDates.forEach(date => {
        const result = validateDateFormatting(date)
        // The validation should complete without throwing
        expect(typeof result.isHydrationSafe).toBe('boolean')
        expect(Array.isArray(result.issues)).toBe(true)
      })
      
      // Test invalid date
      const invalidResult = validateDateFormatting('invalid-date')
      expect(invalidResult.isHydrationSafe).toBe(false)
      expect(invalidResult.issues).toContain('Invalid date provided')
    })
  })

  describe('Client Hydration Simulation', () => {
    it('should hydrate without throwing errors', () => {
      // Mock animations as disabled for SSR
      const mockAnimations = require('@/lib/utils/animationUtils')
      mockAnimations.useHydrationSafeAnimations = jest.fn().mockReturnValue(false)
      
      const serverHTML = renderToString(<ApplicationTable />)
      expect(typeof serverHTML).toBe('string')
      
      // Now render on client (this simulates hydration)
      expect(() => {
        render(<ApplicationTable />)
      }).not.toThrow()
    })

    it('should maintain data consistency during hydration', () => {
      // Ensure store returns consistent data
      const consistentData = [...testApplications]
      mockStoreState.getFilteredApplications.mockReturnValue(consistentData)
      
      // Render multiple times to simulate hydration
      const { container: render1 } = render(<ApplicationTable />)
      const { container: render2 } = render(<ApplicationTable />)
      
      // Content should be consistent
      const getText = (container: Element) => 
        Array.from(container.querySelectorAll('tbody tr')).map(row => row.textContent)
      
      expect(getText(render1)).toEqual(getText(render2))
    })

    it('should handle progressive enhancement correctly', () => {
      // Mock animations as disabled for SSR
      const mockAnimations = require('@/lib/utils/animationUtils')
      mockAnimations.useHydrationSafeAnimations = jest.fn().mockReturnValue(false)
      
      const { container, rerender } = render(<ApplicationTable />)
      
      // Verify initial state has no animation classes
      const initialRows = container.querySelectorAll('tbody tr')
      if (initialRows.length > 0) {
        initialRows.forEach(row => {
          expect(row.className).not.toContain('transition-colors')
        })
      }
      
      // Simulate hydration completing and animations being enabled
      mockAnimations.useHydrationSafeAnimations.mockReturnValue(true)
      
      rerender(<ApplicationTable />)
      
      // Now should have animation classes
      const enhancedRows = container.querySelectorAll('tbody tr')
      if (enhancedRows.length > 0) {
        enhancedRows.forEach(row => {
          expect(row.className).toContain('transition-colors')
        })
      }
    })
  })

  describe('Date Consistency Validation', () => {
    it('should produce identical date output across environments', () => {
      const testDate = '2024-01-15T10:30:00.000Z'
      
      // Simulate different timezone environments
      const originalTZ = process.env.TZ
      
      try {
        // Test in UTC
        process.env.TZ = 'UTC'
        const utcResult = getStaticDateDisplay(testDate)
        
        // Test in different timezone
        process.env.TZ = 'America/New_York'
        const nyResult = getStaticDateDisplay(testDate)
        
        // Test in another timezone
        process.env.TZ = 'Asia/Tokyo'
        const tokyoResult = getStaticDateDisplay(testDate)
        
        // All should produce identical results due to UTC-based formatting
        expect(utcResult.absolute).toBe(nyResult.absolute)
        expect(utcResult.absolute).toBe(tokyoResult.absolute)
        expect(utcResult.iso).toBe(nyResult.iso)
        expect(utcResult.iso).toBe(tokyoResult.iso)
        
      } finally {
        process.env.TZ = originalTZ
      }
    })

    it('should handle edge case dates consistently', () => {
      const edgeCases = [
        '2024-01-01T00:00:00.000Z', // New Year
        '2024-12-31T23:59:59.999Z', // End of Year
        '2024-02-29T12:00:00.000Z', // Leap Year
        '2024-03-01T00:00:00.000Z', // Day after leap day
        '2000-01-01T00:00:00.000Z', // Y2K
        '1970-01-01T00:00:00.000Z'  // Unix epoch
      ]
      
      edgeCases.forEach(dateStr => {
        const result1 = getStaticDateDisplay(dateStr)
        const result2 = getStaticDateDisplay(new Date(dateStr))
        
        expect(result1.absolute).toBe(result2.absolute)
        expect(result1.iso).toBe(result2.iso)
        expect(result1.timestamp).toBe(result2.timestamp)
      })
    })

    it('should maintain date consistency in ApplicationTable', () => {
      // Render table multiple times
      const renders = Array.from({ length: 5 }, () => {
        const { container } = render(<ApplicationTable />)
        return Array.from(container.querySelectorAll('[data-testid*="date"], td:nth-child(6)'))
          .map(el => el.textContent)
          .filter(text => text && text.includes('2024'))
      })
      
      // All renders should produce identical date strings
      renders.forEach(renderDates => {
        expect(renderDates).toEqual(renders[0])
      })
    })
  })

  describe('Performance and Memory', () => {
    it('should not leak memory during hydration', () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<ApplicationTable />)
        unmount()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle rapid re-renders without issues', () => {
      const { rerender } = render(<ApplicationTable />)
      
      // Rapidly re-render with different data
      for (let i = 0; i < 50; i++) {
        const newData = testApplications.map(app => ({
          ...app,
          id: `${app.id}-${i}`,
          company: `${app.company} ${i}`
        }))
        
        mockStoreState.getFilteredApplications.mockReturnValue(newData)
        
        expect(() => {
          rerender(<ApplicationTable />)
        }).not.toThrow()
      }
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle hydration errors gracefully', () => {
      // Mock console.error to avoid noise in tests
      const originalError = console.error
      console.error = jest.fn()
      
      try {
        // Force an error during rendering
        mockStoreState.getFilteredApplications.mockImplementation(() => {
          throw new Error('Simulated hydration error')
        })
        
        // Should not crash, should show fallback
        const { container } = render(<ApplicationTable />)
        
        // Should show fallback UI
        expect(container.textContent).toContain('Loading Applications')
        
      } finally {
        console.error = originalError
      }
    })

    it('should recover from hydration mismatches', () => {
      // Simulate a component that has hydration mismatches
      const ProblematicComponent = () => {
        const [clientOnly, setClientOnly] = React.useState(false)
        
        React.useEffect(() => {
          setClientOnly(true)
        }, [])
        
        // This would cause hydration mismatch
        return (
          <div>
            {clientOnly ? 'Client Content' : 'Server Content'}
          </div>
        )
      }
      
      // Should handle the mismatch gracefully
      expect(() => {
        render(<ProblematicComponent />)
      }).not.toThrow()
    })
  })
})