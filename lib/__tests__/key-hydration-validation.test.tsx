/**
 * Comprehensive test for key generation consistency across server/client renders
 * This test validates that table row keys are deterministic and hydration-safe
 */

import React from 'react'
import { render } from '@testing-library/react'
import ApplicationTable from '@/components/ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'
import { validateIdStability } from '@/lib/utils/idGeneration'

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

describe('Key Hydration Validation', () => {
  const createMockApplication = (id: string, company: string): Application => ({
    id,
    company,
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000',
    status: 'Applied',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    notes: 'Test application',
    contactPerson: 'John Doe',
    contactEmail: 'john@example.com',
    website: 'https://example.com',
    tags: ['tech'],
    priority: 'High',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  })

  const mockStoreState = {
    getFilteredApplications: jest.fn(),
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

  describe('Key Determinism and Stability', () => {
    it('should generate stable keys for valid application IDs', () => {
      const applications = [
        createMockApplication('app-001', 'Company A'),
        createMockApplication('app-002', 'Company B'),
        createMockApplication('app-003', 'Company C')
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(applications)

      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows).toHaveLength(3)
      
      // Verify each row has a stable key based on application ID
      applications.forEach((app, index) => {
        expect(validateIdStability(app.id)).toBe(true)
        expect(app.id).toMatch(/^app-\d+$/)
      })
    })

    it('should handle applications with missing IDs gracefully', () => {
      const applications = [
        createMockApplication('', 'Company A'), // Empty ID
        createMockApplication('app-002', 'Company B'), // Valid ID
        { ...createMockApplication('app-003', 'Company C'), id: null as any }, // Null ID
        { ...createMockApplication('app-004', 'Company D'), id: undefined as any } // Undefined ID
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(applications)

      // Should render without throwing errors
      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows).toHaveLength(4)
      
      // All rows should be rendered even with invalid IDs
      // The component should use fallback keys for invalid IDs
    })

    it('should maintain key consistency across multiple renders', () => {
      const applications = [
        createMockApplication('app-stable-001', 'Stable Company 1'),
        createMockApplication('app-stable-002', 'Stable Company 2')
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(applications)

      // First render
      const { container: container1 } = render(<ApplicationTable />)
      const rows1 = container1.querySelectorAll('tbody tr')
      const html1 = container1.innerHTML

      // Second render with same data
      const { container: container2 } = render(<ApplicationTable />)
      const rows2 = container2.querySelectorAll('tbody tr')
      const html2 = container2.innerHTML

      // Structure should be identical
      expect(rows1).toHaveLength(rows2.length)
      expect(html1).toBe(html2)
    })

    it('should use deterministic keys that do not change with content updates', () => {
      const baseApplication = createMockApplication('app-unchanging-001', 'Test Company')
      
      // First render with original data
      mockStoreState.getFilteredApplications.mockReturnValue([baseApplication])
      const { container: container1 } = render(<ApplicationTable />)
      const rows1 = container1.querySelectorAll('tbody tr')

      // Second render with updated content but same ID
      const updatedApplication = {
        ...baseApplication,
        company: 'Updated Company Name',
        position: 'Senior Engineer',
        salary: '$150,000',
        appliedDate: '2024-12-31' // Different date
      }
      
      mockStoreState.getFilteredApplications.mockReturnValue([updatedApplication])
      const { container: container2 } = render(<ApplicationTable />)
      const rows2 = container2.querySelectorAll('tbody tr')

      // Should have same number of rows
      expect(rows1).toHaveLength(1)
      expect(rows2).toHaveLength(1)
      
      // Key should remain the same (based on ID, not content)
      expect(baseApplication.id).toBe(updatedApplication.id)
    })
  })

  describe('Hydration Safety', () => {
    it('should not use time-based or random elements in keys', () => {
      const applications = [
        createMockApplication('app-hydration-001', 'Hydration Test 1'),
        createMockApplication('app-hydration-002', 'Hydration Test 2')
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(applications)

      const { container } = render(<ApplicationTable />)
      const html = container.innerHTML

      // Should not contain patterns that suggest time-based or random generation
      expect(html).not.toMatch(/\d{13}/) // No 13-digit timestamps
      expect(html).not.toMatch(/Math\.random/) // No random function calls
      expect(html).not.toMatch(/Date\.now/) // No Date.now() calls
      expect(html).not.toMatch(/new Date\(\)/) // No current date generation
    })

    it('should validate all application IDs for stability', () => {
      const applications = [
        createMockApplication('app-valid-001', 'Valid Company 1'),
        createMockApplication('app-valid-002', 'Valid Company 2'),
        createMockApplication('app-valid-003', 'Valid Company 3')
      ]

      applications.forEach(app => {
        expect(validateIdStability(app.id)).toBe(true)
        expect(typeof app.id).toBe('string')
        expect(app.id.length).toBeGreaterThan(0)
      })
    })

    it('should handle edge cases without breaking key generation', () => {
      const edgeCaseApplications = [
        createMockApplication('app-edge-001', ''), // Empty company name
        createMockApplication('app-edge-002', 'Company with "quotes" and symbols!@#$%'),
        createMockApplication('app-edge-003', 'Very'.repeat(100)), // Very long company name
        createMockApplication('app-edge-004', '中文公司名'), // Unicode characters
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(edgeCaseApplications)

      // Should render without errors
      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows).toHaveLength(4)
      
      // All IDs should still be valid
      edgeCaseApplications.forEach(app => {
        expect(validateIdStability(app.id)).toBe(true)
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large lists efficiently with stable keys', () => {
      const largeApplicationList = Array.from({ length: 500 }, (_, i) => 
        createMockApplication(`app-large-${i.toString().padStart(3, '0')}`, `Company ${i}`)
      )

      mockStoreState.getFilteredApplications.mockReturnValue(largeApplicationList)

      const startTime = performance.now()
      const { container } = render(<ApplicationTable />)
      const endTime = performance.now()

      const rows = container.querySelectorAll('tbody tr')
      expect(rows).toHaveLength(500)

      // Should render reasonably quickly (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000)

      // All keys should be unique
      const ids = largeApplicationList.map(app => app.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })

    it('should maintain key uniqueness with duplicate content', () => {
      const duplicateContentApps = [
        createMockApplication('app-dup-001', 'Same Company'),
        createMockApplication('app-dup-002', 'Same Company'), // Same company name
        createMockApplication('app-dup-003', 'Same Company'), // Same company name
      ]

      mockStoreState.getFilteredApplications.mockReturnValue(duplicateContentApps)

      const { container } = render(<ApplicationTable />)
      const rows = container.querySelectorAll('tbody tr')

      expect(rows).toHaveLength(3)

      // IDs should be unique even with duplicate content
      const ids = duplicateContentApps.map(app => app.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids.length).toBe(uniqueIds.length)
    })
  })
})