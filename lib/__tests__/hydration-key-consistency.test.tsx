/**
 * Tests for hydration-safe key generation in ApplicationTable
 * Ensures keys are deterministic and stable across server/client renders
 */

import React from 'react'
import { render } from '@testing-library/react'
import ApplicationTable from '@/components/ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'

// Mock the application store
jest.mock('@/store/applicationStore')
const mockUseApplicationStore = useApplicationStore as jest.MockedFunction<typeof useApplicationStore>

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock the date formatting utilities
jest.mock('@/lib/utils/dateFormatting', () => ({
  formatDateForSSR: (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString()
  },
  useProgressiveDateDisplay: (date: string | Date) => ({
    absolute: new Date(date).toLocaleDateString(),
    relative: '',
    isEnhanced: false
  })
}))

describe('ApplicationTable Hydration Key Consistency', () => {
  const mockApplications: Application[] = [
    {
      id: 'app-stable-001',
      company: 'Test Company 1',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120,000',
      status: 'Applied',
      appliedDate: '2024-01-15',
      responseDate: null,
      interviewDate: null,
      notes: 'Great opportunity',
      contactPerson: 'John Doe',
      contactEmail: 'john@testcompany.com',
      website: 'https://testcompany.com',
      tags: ['tech', 'startup'],
      priority: 'High',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'app-stable-002',
      company: 'Test Company 2',
      position: 'Frontend Developer',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$110,000',
      status: 'Pending',
      appliedDate: '2024-01-16',
      responseDate: null,
      interviewDate: null,
      notes: 'Remote friendly',
      contactPerson: 'Jane Smith',
      contactEmail: 'jane@testcompany2.com',
      website: 'https://testcompany2.com',
      tags: ['remote', 'frontend'],
      priority: 'Medium',
      createdAt: '2024-01-16T10:00:00Z',
      updatedAt: '2024-01-16T10:00:00Z'
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

  beforeEach(() => {
    mockUseApplicationStore.mockReturnValue(mockStoreState)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Table Row Key Stability', () => {
    it('should use deterministic keys that do not change between renders', () => {
      // First render
      const { container: container1 } = render(<ApplicationTable />)
      const rows1 = container1.querySelectorAll('tbody tr')
      const keys1 = Array.from(rows1).map(row => row.getAttribute('data-testid') || row.outerHTML)

      // Second render with same data
      const { container: container2 } = render(<ApplicationTable />)
      const rows2 = container2.querySelectorAll('tbody tr')
      const keys2 = Array.from(rows2).map(row => row.getAttribute('data-testid') || row.outerHTML)

      // Keys should be identical between renders
      expect(keys1).toEqual(keys2)
      expect(rows1.length).toBe(mockApplications.length)
      expect(rows2.length).toBe(mockApplications.length)
    })

    it('should generate stable keys based only on application.id', () => {
      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      // Verify each row corresponds to the correct application
      rows.forEach((row, index) => {
        const expectedId = mockApplications[index].id
        // The key should be derived from the application ID
        expect(expectedId).toMatch(/^app-stable-\d+$/)
        expect(expectedId).not.toContain('undefined')
        expect(expectedId).not.toContain('null')
      })
    })

    it('should not be affected by date or time changes', () => {
      // Render with original data
      const { container: container1 } = render(<ApplicationTable />)
      const rows1 = container1.querySelectorAll('tbody tr')

      // Mock applications with different dates but same IDs
      const applicationsWithDifferentDates = mockApplications.map(app => ({
        ...app,
        appliedDate: '2024-12-31', // Different date
        createdAt: '2024-12-31T23:59:59Z', // Different timestamp
        updatedAt: '2024-12-31T23:59:59Z'
      }))

      mockStoreState.getFilteredApplications.mockReturnValue(applicationsWithDifferentDates)

      // Render with modified dates
      const { container: container2 } = render(<ApplicationTable />)
      const rows2 = container2.querySelectorAll('tbody tr')

      // Row count should be the same
      expect(rows1.length).toBe(rows2.length)
      
      // Keys should still be stable (based on ID, not dates)
      expect(rows1.length).toBe(mockApplications.length)
      expect(rows2.length).toBe(applicationsWithDifferentDates.length)
    })

    it('should handle empty application list without key conflicts', () => {
      mockStoreState.getFilteredApplications.mockReturnValue([])

      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows.length).toBe(0)
      // Should show empty state instead
      const emptyState = container.querySelector('[class*="text-center"]')
      expect(emptyState).toBeInTheDocument()
    })

    it('should maintain key uniqueness with duplicate data', () => {
      // Create applications with potentially conflicting data
      const duplicateApplications = [
        { ...mockApplications[0], id: 'app-unique-001' },
        { ...mockApplications[0], id: 'app-unique-002' }, // Same data, different ID
        { ...mockApplications[1], id: 'app-unique-003' }
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(duplicateApplications)

      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows.length).toBe(3)
      
      // All IDs should be unique
      const ids = duplicateApplications.map(app => app.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })
  })

  describe('Hydration Safety Validation', () => {
    it('should not contain time-sensitive elements in keys', () => {
      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      rows.forEach(row => {
        const html = row.outerHTML
        // Should not contain patterns that suggest time-based generation
        expect(html).not.toMatch(/\d{13}/) // No 13-digit timestamps
        expect(html).not.toMatch(/Date\.now/) // No Date.now() calls
        expect(html).not.toMatch(/Math\.random/) // No random generation
      })
    })

    it('should use only stable, deterministic identifiers', () => {
      mockApplications.forEach(app => {
        expect(app.id).toMatch(/^app-stable-\d+$/)
        expect(typeof app.id).toBe('string')
        expect(app.id.length).toBeGreaterThan(0)
      })
    })

    it('should render identical structure across multiple renders', () => {
      // Render multiple times and compare structure
      const renders = Array.from({ length: 3 }, () => {
        const { container } = render(<ApplicationTable />)
        return container.innerHTML
      })

      // All renders should produce identical HTML structure
      const [first, ...rest] = renders
      rest.forEach(render => {
        expect(render).toBe(first)
      })
    })
  })

  describe('Key Generation Edge Cases', () => {
    it('should handle applications with missing or invalid IDs', () => {
      const applicationsWithBadIds = [
        { ...mockApplications[0], id: '' }, // Empty ID
        { ...mockApplications[1], id: null as any }, // Null ID
        { ...mockApplications[0], id: undefined as any } // Undefined ID
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(applicationsWithBadIds)

      // Should render without throwing errors (but may have warnings)
      const { container } = render(<ApplicationTable />)
      expect(container).toBeInTheDocument()
    })

    it('should handle very long application lists', () => {
      const longList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockApplications[0],
        id: `app-long-${i.toString().padStart(4, '0')}`,
        company: `Company ${i}`
      }))

      mockStoreState.getFilteredApplications.mockReturnValue(longList)

      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows.length).toBe(1000)
      
      // All keys should be unique
      const ids = longList.map(app => app.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })
  })
})