/**
 * Tests for ApplicationTable hydration safety
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import ApplicationTable from '../ApplicationTable'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'

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

// Mock the animation hook to simulate SSR and hydrated states
jest.mock('@/lib/utils/animationUtils', () => ({
  ...jest.requireActual('@/lib/utils/animationUtils'),
  useHydrationSafeAnimations: jest.fn(),
}))

const mockApplications: Application[] = [
  {
    id: '1',
    company: 'Test Company',
    position: 'Software Engineer',
    location: 'Remote',
    type: 'Full-time',
    salary: '$100,000',
    status: 'Applied',
    priority: 'High',
    appliedDate: '2024-01-15',
    notes: 'Test notes'
  },
  {
    id: '2',
    company: 'Another Company',
    position: 'Frontend Developer',
    location: 'New York',
    type: 'Contract',
    salary: '$80,000',
    status: 'Interviewing',
    priority: 'Medium',
    appliedDate: '2024-01-10',
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

describe('ApplicationTable Hydration Safety', () => {
  beforeEach(() => {
    mockUseApplicationStore.mockReturnValue(mockStoreState)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Server-Side Rendering (SSR)', () => {
    beforeEach(() => {
      // Mock animations as disabled (SSR state)
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      useHydrationSafeAnimations.mockReturnValue(false)
    })

    it('should render table structure without animation classes during SSR', () => {
      const { container } = render(<ApplicationTable />)
      
      // Check that basic structure is present
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('Another Company')).toBeInTheDocument()
      
      // Check that animation classes are not present during SSR
      const tableRows = container.querySelectorAll('tbody tr')
      tableRows.forEach(row => {
        expect(row.className).not.toContain('transition-colors')
        expect(row.className).not.toContain('duration-200')
      })
    })

    it('should render buttons without animation classes during SSR', () => {
      const { container } = render(<ApplicationTable />)
      
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        // Should have base styles but not animation classes
        expect(button.className).not.toContain('transition-all')
        expect(button.className).not.toContain('hover:shadow-lg')
        expect(button.className).not.toContain('hover:-translate-y-0.5')
      })
    })

    it('should render cards without animation classes during SSR', () => {
      const { container } = render(<ApplicationTable />)
      
      const cards = container.querySelectorAll('[class*="bg-white"][class*="rounded-xl"]')
      cards.forEach(card => {
        expect(card.className).not.toContain('transition-shadow')
        expect(card.className).not.toContain('hover:shadow-md')
      })
    })
  })

  describe('Client-Side Hydration', () => {
    beforeEach(() => {
      // Mock animations as enabled (hydrated state)
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      useHydrationSafeAnimations.mockReturnValue(true)
    })

    it('should add animation classes after hydration', () => {
      const { container } = render(<ApplicationTable />)
      
      // Check that animation classes are present after hydration
      const tableRows = container.querySelectorAll('tbody tr')
      tableRows.forEach(row => {
        expect(row.className).toContain('hover:bg-gray-50')
        expect(row.className).toContain('transition-colors')
      })
    })

    it('should add button animation classes after hydration', () => {
      const { container } = render(<ApplicationTable />)
      
      // Find primary buttons (should have enhanced animations)
      const primaryButtons = container.querySelectorAll('button[class*="bg-primary-600"]')
      primaryButtons.forEach(button => {
        expect(button.className).toContain('transition-all')
        expect(button.className).toContain('hover:shadow-lg')
      })
    })

    it('should add card animation classes after hydration', () => {
      const { container } = render(<ApplicationTable />)
      
      const cards = container.querySelectorAll('[class*="bg-white"][class*="rounded-xl"]')
      cards.forEach(card => {
        expect(card.className).toContain('transition-shadow')
        expect(card.className).toContain('hover:shadow-md')
      })
    })
  })

  describe('Consistent Rendering', () => {
    it('should render identical DOM structure regardless of animation state', () => {
      // Render with animations disabled (SSR)
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      useHydrationSafeAnimations.mockReturnValue(false)
      
      const { container: ssrContainer } = render(<ApplicationTable />)
      const ssrHTML = ssrContainer.innerHTML
      
      // Re-render with animations enabled (hydrated)
      useHydrationSafeAnimations.mockReturnValue(true)
      const { container: hydratedContainer } = render(<ApplicationTable />)
      const hydratedHTML = hydratedContainer.innerHTML
      
      // The DOM structure should be identical, only class names should differ
      const ssrStructure = ssrHTML.replace(/class="[^"]*"/g, 'class=""')
      const hydratedStructure = hydratedHTML.replace(/class="[^"]*"/g, 'class=""')
      
      expect(ssrStructure).toBe(hydratedStructure)
    })

    it('should maintain consistent table row keys', () => {
      const { container } = render(<ApplicationTable />)
      
      const tableRows = container.querySelectorAll('tbody tr')
      expect(tableRows).toHaveLength(2)
      
      // Check that rows are rendered consistently
      expect(tableRows[0]).toBeInTheDocument()
      expect(tableRows[1]).toBeInTheDocument()
      
      // Verify content is consistent (which indicates stable keys)
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('Another Company')).toBeInTheDocument()
    })

    it('should handle empty state consistently', () => {
      // Mock empty applications
      mockStoreState.getFilteredApplications.mockReturnValue([])
      
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      
      // Test SSR state
      useHydrationSafeAnimations.mockReturnValue(false)
      const { container: ssrContainer } = render(<ApplicationTable />)
      
      // Test hydrated state
      useHydrationSafeAnimations.mockReturnValue(true)
      const { container: hydratedContainer } = render(<ApplicationTable />)
      
      // Both should show empty state
      expect(ssrContainer.textContent).toContain('No applications found')
      expect(hydratedContainer.textContent).toContain('No applications found')
    })
  })

  describe('Progressive Enhancement', () => {
    it('should work without animations (graceful degradation)', () => {
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      useHydrationSafeAnimations.mockReturnValue(false)
      
      // Ensure the store returns applications
      mockStoreState.getFilteredApplications.mockReturnValue(mockApplications)
      
      const { container } = render(<ApplicationTable />)
      
      // All functionality should work without animations
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search applications...')).toBeInTheDocument()
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // Check if table structure exists
      const tableBody = container.querySelector('tbody')
      expect(tableBody).toBeInTheDocument()
      
      // Verify the store is being called
      expect(mockStoreState.getFilteredApplications).toHaveBeenCalled()
    })

    it('should enhance with animations when available', () => {
      const { useHydrationSafeAnimations } = require('@/lib/utils/animationUtils')
      useHydrationSafeAnimations.mockReturnValue(true)
      
      const { container } = render(<ApplicationTable />)
      
      // Should have all base functionality plus animations
      expect(screen.getByRole('table')).toBeInTheDocument()
      
      // Should have animation classes
      const animatedElements = container.querySelectorAll('[class*="transition"]')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })
})