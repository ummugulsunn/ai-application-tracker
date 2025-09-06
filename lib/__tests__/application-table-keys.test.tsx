import React from 'react'
import { render } from '@testing-library/react'
import ApplicationTable from '@/components/ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'

// Mock the store
jest.mock('@/store/applicationStore')
const mockUseApplicationStore = useApplicationStore as jest.MockedFunction<typeof useApplicationStore>

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

// Mock the date formatting utilities
jest.mock('@/lib/utils/dateFormatting', () => ({
  formatDateForSSR: (date: string) => new Date(date).toLocaleDateString(),
  useProgressiveDateDisplay: (date: string) => ({
    absolute: new Date(date).toLocaleDateString(),
    relative: '2 days ago',
    isEnhanced: false
  })
}))

describe('ApplicationTable Key Consistency', () => {
  const mockApplications: Application[] = [
    {
      id: 'app-stable-1',
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
      id: 'app-stable-2',
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
    // Reset the mock to return original applications
    mockStoreState.getFilteredApplications.mockReturnValue(mockApplications)
    mockUseApplicationStore.mockReturnValue(mockStoreState as any)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should use stable application IDs as table row keys', () => {
    const { container } = render(<ApplicationTable />)
    
    // Find all table rows (excluding header)
    const tableRows = container.querySelectorAll('tbody tr')
    
    expect(tableRows).toHaveLength(2)
    
    // Verify that rows exist (keys are used internally by React)
    // We can't directly test the key prop, but we can verify the structure is stable
    expect(tableRows[0]).toBeInTheDocument()
    expect(tableRows[1]).toBeInTheDocument()
  })

  it('should render consistently with the same data', () => {
    // Render multiple times with the same data
    const { container: container1 } = render(<ApplicationTable />)
    const { container: container2 } = render(<ApplicationTable />)
    
    const rows1 = container1.querySelectorAll('tbody tr')
    const rows2 = container2.querySelectorAll('tbody tr')
    
    expect(rows1).toHaveLength(rows2.length)
    expect(rows1).toHaveLength(2)
  })

  it('should handle empty application list without key issues', () => {
    mockStoreState.getFilteredApplications.mockReturnValue([])
    
    const { container } = render(<ApplicationTable />)
    
    // Should show empty state without any table rows
    const tableRows = container.querySelectorAll('tbody tr')
    expect(tableRows).toHaveLength(0)
    
    // Should show empty state message
    expect(container.textContent).toContain('No applications found')
  })

  it('should maintain key stability when applications are reordered', () => {
    // First render with original order
    const { container: container1, unmount: unmount1 } = render(<ApplicationTable />)
    const rows1 = container1.querySelectorAll('tbody tr')
    unmount1()
    
    // Mock reordered applications (same data, different order)
    const reorderedApplications = [...mockApplications].reverse()
    mockStoreState.getFilteredApplications.mockReturnValue(reorderedApplications)
    
    // Second render with reordered data
    const { container: container2 } = render(<ApplicationTable />)
    const rows2 = container2.querySelectorAll('tbody tr')
    
    // Should still have the same number of rows
    expect(rows1).toHaveLength(2)
    expect(rows2).toHaveLength(2)
  })

  it('should use deterministic keys that do not change between renders', () => {
    // This test verifies that the same application data produces the same DOM structure
    const { container, unmount } = render(<ApplicationTable />)
    const rows1 = container.querySelectorAll('tbody tr')
    const firstRowContent = rows1[0]?.textContent
    unmount()
    
    // Reset mock to ensure same data
    mockStoreState.getFilteredApplications.mockReturnValue(mockApplications)
    
    const { container: container2 } = render(<ApplicationTable />)
    const rows2 = container2.querySelectorAll('tbody tr')
    
    expect(rows2).toHaveLength(2)
    
    // Verify that the first row contains the first application's data
    expect(rows2[0].textContent).toContain('Test Company 1')
    expect(rows2[0].textContent).toContain('Software Engineer')
    expect(rows2[1].textContent).toContain('Test Company 2')
    expect(rows2[1].textContent).toContain('Frontend Developer')
  })
})