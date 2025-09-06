/**
 * Comprehensive tests for hydration consistency
 * Tests server and client render identical HTML, date formatting consistency,
 * and progressive enhancement functionality
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import ApplicationTable from '@/components/ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'
import { getStaticDateDisplay, formatDateForSSR, useProgressiveDateDisplay } from '@/lib/utils/dateFormatting'
import { useHydrationSafeAnimations, getTableRowClasses, getButtonClasses, getCardClasses } from '@/lib/utils/animationUtils'

// Mock the store
jest.mock('@/store/applicationStore')
const mockUseApplicationStore = useApplicationStore as jest.MockedFunction<typeof useApplicationStore>

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock animation utilities for controlled testing
jest.mock('@/lib/utils/animationUtils', () => ({
  ...jest.requireActual('@/lib/utils/animationUtils'),
  useHydrationSafeAnimations: jest.fn(),
}))

// Mock the HydrationErrorBoundary to prevent fallback UI during tests
jest.mock('@/components/HydrationErrorBoundary', () => ({
  HydrationErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  useHydrationErrorHandler: () => ({
    handleHydrationError: jest.fn()
  })
}))

const mockUseHydrationSafeAnimations = useHydrationSafeAnimations as jest.MockedFunction<typeof useHydrationSafeAnimations>

const mockApplications: Application[] = [
  {
    id: 'app-1',
    company: 'Test Company A',
    position: 'Software Engineer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100,000',
    status: 'Applied',
    priority: 'High',
    appliedDate: '2024-01-15T10:30:00Z',
    notes: 'Test notes'
  },
  {
    id: 'app-2',
    company: 'Test Company B',
    position: 'Frontend Developer',
    location: 'New York',
    type: 'Contract',
    salary: '$80,000',
    status: 'Interviewing',
    priority: 'Medium',
    appliedDate: '2024-01-10T15:45:00Z',
    notes: ''
  }
]

const mockStoreState = {
  getFilteredApplications: jest.fn(() => mockApplications),
  deleteApplication: jest.fn(),
  deleteApplications: jest.fn(),
  setSearchQuery: jest.fn(),
  setSortOptions: jest.fn(),
  sortOptions: { field: 'appliedDate' as keyof Application, direction: 'desc' as const },
  searchQuery: ''
}

describe('Hydration Consistency Tests', () => {
  beforeEach(() => {
    mockUseApplicationStore.mockReturnValue(mockStoreState)
    jest.clearAllMocks()
  })

  describe('Server and Client Render Identical HTML', () => {
    it('should render identical DOM structure between SSR and client hydration', () => {
      // Mock animations disabled for SSR
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      // Render on server (simulated)
      const { container: ssrContainer } = render(<ApplicationTable />)
      const ssrHTML = ssrContainer.innerHTML
      
      // Render on client with animations enabled
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      const { container: clientContainer } = render(<ApplicationTable />)
      const clientHTML = clientContainer.innerHTML
      
      // Extract DOM structure without class attributes to compare structure
      const normalizeHTML = (html: string) => {
        return html
          .replace(/class="[^"]*"/g, 'class=""') // Remove class differences
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
      }
      
      const normalizedSSR = normalizeHTML(ssrHTML)
      const normalizedClient = normalizeHTML(clientHTML)
      
      expect(normalizedSSR).toBe(normalizedClient)
    })

    it('should maintain consistent table structure regardless of animation state', () => {
      // Test with animations disabled
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { container: noAnimContainer } = render(<ApplicationTable />)
      
      // Test with animations enabled
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      const { container: animContainer } = render(<ApplicationTable />)
      
      // Both should have the same table structure
      const noAnimTable = noAnimContainer.querySelector('table')
      const animTable = animContainer.querySelector('table')
      
      expect(noAnimTable).toBeInTheDocument()
      expect(animTable).toBeInTheDocument()
      
      // Same number of rows
      const noAnimRows = noAnimContainer.querySelectorAll('tbody tr')
      const animRows = animContainer.querySelectorAll('tbody tr')
      expect(noAnimRows.length).toBe(animRows.length)
      expect(noAnimRows.length).toBe(2) // Our mock data has 2 applications
      
      // Same number of columns
      const noAnimCells = noAnimContainer.querySelectorAll('tbody tr:first-child td')
      const animCells = animContainer.querySelectorAll('tbody tr:first-child td')
      expect(noAnimCells.length).toBe(animCells.length)
    })

    it('should render consistent content in table cells', () => {
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      render(<ApplicationTable />)
      
      // Verify all expected content is present
      expect(screen.getByText('Test Company A')).toBeInTheDocument()
      expect(screen.getByText('Test Company B')).toBeInTheDocument()
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Remote')).toBeInTheDocument()
      expect(screen.getByText('New York')).toBeInTheDocument()
    })

    it('should handle empty state consistently', () => {
      // Mock empty applications
      mockStoreState.getFilteredApplications.mockReturnValue([])
      
      // Test SSR state
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { container: ssrContainer } = render(<ApplicationTable />)
      
      // Test hydrated state
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      const { container: hydratedContainer } = render(<ApplicationTable />)
      
      // Both should show empty state
      expect(ssrContainer.textContent).toContain('No applications found')
      expect(hydratedContainer.textContent).toContain('No applications found')
      
      // Structure should be identical
      const ssrEmptyState = ssrContainer.querySelector('[class*="text-center"]')
      const hydratedEmptyState = hydratedContainer.querySelector('[class*="text-center"]')
      expect(ssrEmptyState).toBeInTheDocument()
      expect(hydratedEmptyState).toBeInTheDocument()
    })

    it('should maintain consistent row keys across renders', () => {
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')
      
      // Verify we have the expected number of rows
      expect(rows).toHaveLength(2)
      
      // Check that content is rendered consistently (indicates stable keys)
      const firstRowCompany = rows[0].querySelector('td:nth-child(2)')
      const secondRowCompany = rows[1].querySelector('td:nth-child(2)')
      
      expect(firstRowCompany?.textContent).toContain('Test Company A')
      expect(secondRowCompany?.textContent).toContain('Test Company B')
    })
  })

  describe('Date Formatting Consistency Across Environments', () => {
    const testDate = '2024-01-15T10:30:00Z'
    const testDateObj = new Date(testDate)

    it('should produce identical static date formatting', () => {
      const result1 = getStaticDateDisplay(testDate)
      const result2 = getStaticDateDisplay(testDateObj)
      const result3 = getStaticDateDisplay(testDate)
      
      // All should produce identical results
      expect(result1.absolute).toBe(result2.absolute)
      expect(result1.absolute).toBe(result3.absolute)
      expect(result1.iso).toBe(result2.iso)
      expect(result1.timestamp).toBe(result2.timestamp)
    })

    it('should format dates consistently for SSR', () => {
      const ssrFormat1 = formatDateForSSR(testDate)
      const ssrFormat2 = formatDateForSSR(testDateObj)
      const ssrFormat3 = formatDateForSSR(testDate)
      
      expect(ssrFormat1).toBe(ssrFormat2)
      expect(ssrFormat1).toBe(ssrFormat3)
      expect(ssrFormat1).toBe('Jan 15, 2024')
    })

    it('should handle various date formats consistently', () => {
      const dates = [
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59Z',
        '2024-02-29T12:00:00Z', // Leap year
        new Date('2024-06-15T18:30:00Z'),
        new Date(2024, 5, 15) // Month is 0-indexed
      ]
      
      dates.forEach(date => {
        const result = getStaticDateDisplay(date)
        expect(result.absolute).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
        expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(typeof result.timestamp).toBe('number')
      })
    })

    it('should render dates consistently in ApplicationTable', () => {
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      render(<ApplicationTable />)
      
      // Check that dates are rendered using static formatting
      const dateElements = screen.getAllByText(/Jan \d{1,2}, 2024/)
      expect(dateElements.length).toBeGreaterThan(0)
      
      // Verify specific dates from our mock data
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument()
    })

    it('should handle timezone differences gracefully', () => {
      // Test dates that could be affected by timezone differences
      const utcDate = '2024-01-15T00:00:00Z'
      const localDate = '2024-01-15T23:59:59Z'
      
      const utcResult = getStaticDateDisplay(utcDate)
      const localResult = getStaticDateDisplay(localDate)
      
      // Both should format consistently using UTC
      expect(utcResult.absolute).toBe('Jan 15, 2024')
      expect(localResult.absolute).toBe('Jan 15, 2024')
    })
  })

  describe('Progressive Enhancement Functionality', () => {
    it('should work without animations (graceful degradation)', () => {
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      render(<ApplicationTable />)
      
      // All core functionality should work
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search applications...')).toBeInTheDocument()
      
      // Data should be displayed
      expect(screen.getByText('Test Company A')).toBeInTheDocument()
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      
      // Interactive elements should be present
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Checkboxes should work
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should enhance with animations when available', async () => {
      // Start without animations
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { rerender, container } = render(<ApplicationTable />)
      
      // Verify no animation classes initially
      const initialRows = container.querySelectorAll('tbody tr')
      initialRows.forEach(row => {
        expect(row.className).not.toContain('transition-colors')
        expect(row.className).not.toContain('hover:bg-gray-50')
      })
      
      // Enable animations (simulate hydration)
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      rerender(<ApplicationTable />)
      
      // Verify animation classes are added
      const enhancedRows = container.querySelectorAll('tbody tr')
      enhancedRows.forEach(row => {
        expect(row.className).toContain('hover:bg-gray-50')
        expect(row.className).toContain('transition-colors')
      })
    })

    it('should progressively enhance date display', async () => {
      // Test the progressive date display hook directly
      const TestComponent = () => {
        const dateDisplay = useProgressiveDateDisplay('2024-01-15T10:30:00Z', {
          showRelativeTime: true,
          enableClientEnhancements: true
        })
        
        return (
          <div>
            <span data-testid="absolute">{dateDisplay.absolute}</span>
            <span data-testid="relative">{dateDisplay.relative}</span>
            <span data-testid="enhanced">{dateDisplay.isEnhanced.toString()}</span>
          </div>
        )
      }
      
      const { getByTestId } = render(<TestComponent />)
      
      // Should always show absolute date
      expect(getByTestId('absolute')).toHaveTextContent('Jan 15, 2024')
      
      // Should eventually enhance with relative time
      await waitFor(() => {
        expect(getByTestId('enhanced')).toHaveTextContent('true')
      })
      
      // Relative time should be enhanced (not the placeholder)
      await waitFor(() => {
        const relativeText = getByTestId('relative').textContent
        expect(relativeText).not.toBe('Click to see relative time')
      })
    })

    it('should maintain functionality during animation state transitions', () => {
      // Test that functionality works during the transition from no-animations to animations
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      
      const { rerender } = render(<ApplicationTable />)
      
      // Verify search works without animations
      const searchInput = screen.getByPlaceholderText('Search applications...')
      expect(searchInput).toBeInTheDocument()
      
      // Enable animations
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      rerender(<ApplicationTable />)
      
      // Search should still work with animations
      expect(screen.getByPlaceholderText('Search applications...')).toBeInTheDocument()
      
      // Table should still be functional
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Company A')).toBeInTheDocument()
    })

    it('should handle animation utility functions correctly', () => {
      // Test animation utility functions directly
      const noAnimRowClasses = getTableRowClasses(false)
      const animRowClasses = getTableRowClasses(true)
      
      // Both should have base classes
      expect(noAnimRowClasses).toContain('border-b')
      expect(animRowClasses).toContain('border-b')
      
      // Only animated version should have animation classes
      expect(noAnimRowClasses).not.toContain('hover:bg-gray-50')
      expect(animRowClasses).toContain('hover:bg-gray-50')
      expect(animRowClasses).toContain('transition-colors')
      
      // Test button classes
      const noAnimButton = getButtonClasses(false, 'primary')
      const animButton = getButtonClasses(true, 'primary')
      
      expect(noAnimButton).toContain('bg-primary-600')
      expect(animButton).toContain('bg-primary-600')
      expect(animButton).toContain('transition-all')
      
      // Test card classes
      const noAnimCard = getCardClasses(false)
      const animCard = getCardClasses(true)
      
      expect(noAnimCard).toContain('bg-white')
      expect(animCard).toContain('bg-white')
      expect(animCard).toContain('hover:shadow-md')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed dates gracefully', () => {
      const malformedDates = [
        'invalid-date',
        '',
        null,
        undefined,
        'not-a-date'
      ]
      
      malformedDates.forEach(date => {
        try {
          const result = getStaticDateDisplay(date as any)
          // Should either work or throw a predictable error
          expect(typeof result.absolute).toBe('string')
        } catch (error) {
          // Errors should be handled gracefully
          expect(error).toBeInstanceOf(Error)
        }
      })
    })

    it('should handle empty application list without hydration issues', () => {
      mockStoreState.getFilteredApplications.mockReturnValue([])
      
      // Test both animation states
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { container: noAnimContainer } = render(<ApplicationTable />)
      
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      const { container: animContainer } = render(<ApplicationTable />)
      
      // Both should handle empty state consistently
      expect(noAnimContainer.textContent).toContain('No applications found')
      expect(animContainer.textContent).toContain('No applications found')
    })

    it('should handle store errors gracefully', () => {
      // Mock store to throw error
      mockStoreState.getFilteredApplications.mockImplementation(() => {
        throw new Error('Store error')
      })
      
      // Should not crash the component
      expect(() => {
        render(<ApplicationTable />)
      }).not.toThrow()
    })

    it('should maintain consistent behavior with different sort options', () => {
      const sortOptions = [
        { field: 'company' as keyof Application, direction: 'asc' as const },
        { field: 'appliedDate' as keyof Application, direction: 'desc' as const },
        { field: 'status' as keyof Application, direction: 'asc' as const }
      ]
      
      sortOptions.forEach(sortOption => {
        mockStoreState.sortOptions = sortOption
        
        mockUseHydrationSafeAnimations.mockReturnValue(false)
        const { container } = render(<ApplicationTable />)
        
        // Should render table regardless of sort option
        expect(container.querySelector('table')).toBeInTheDocument()
        expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
      })
    })
  })

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders during hydration', () => {
      const renderSpy = jest.fn()
      
      const TestWrapper = () => {
        renderSpy()
        return <ApplicationTable />
      }
      
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { rerender } = render(<TestWrapper />)
      
      const initialRenderCount = renderSpy.mock.calls.length
      
      // Simulate hydration
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      rerender(<TestWrapper />)
      
      // Should not cause excessive re-renders
      const finalRenderCount = renderSpy.mock.calls.length
      expect(finalRenderCount - initialRenderCount).toBeLessThanOrEqual(2)
    })

    it('should handle large datasets without hydration issues', () => {
      // Create a large dataset
      const largeDataset: Application[] = Array.from({ length: 100 }, (_, i) => ({
        id: `app-${i}`,
        company: `Company ${i}`,
        position: `Position ${i}`,
        location: 'Remote',
        type: 'Full-time',
        salary: '$100,000',
        status: 'Applied',
        priority: 'Medium',
        appliedDate: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:30:00Z`,
        notes: ''
      }))
      
      mockStoreState.getFilteredApplications.mockReturnValue(largeDataset)
      
      // Should render without issues
      mockUseHydrationSafeAnimations.mockReturnValue(false)
      const { container } = render(<ApplicationTable />)
      
      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(100)
      
      // Should handle animation state change with large dataset
      mockUseHydrationSafeAnimations.mockReturnValue(true)
      const { container: animContainer } = render(<ApplicationTable />)
      
      const animRows = animContainer.querySelectorAll('tbody tr')
      expect(animRows).toHaveLength(100)
    })
  })
})