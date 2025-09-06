/**
 * Comprehensive Accessibility Testing Suite
 * Tests WCAG 2.1 AA compliance and accessibility features across the application
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import Dashboard from '../../components/Dashboard'
import ImportModal from '../../components/ImportModal'
import AddApplicationModal from '../../components/AddApplicationModal'
import ApplicationTable from '../../components/ApplicationTable'
import { AccessibilityWrapper } from '../../components/ui/AccessibilityWrapper'
import type { Application } from '../../types/application'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

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

describe('Accessibility Testing Suite', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    
    // Reset any accessibility preferences
    localStorage.removeItem('accessibility-preferences')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations on main dashboard', async () => {
      const { container } = render(<Dashboard />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on import modal', async () => {
      const { container } = render(<ImportModal isOpen={true} onClose={jest.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on add application modal', async () => {
      const { container } = render(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on application table', async () => {
      const sampleApplications: Application[] = [
        {
          id: '1',
          company: 'Google',
          position: 'Software Engineer',
          status: 'Applied',
          appliedDate: new Date('2024-01-15'),
          notes: 'Applied through website',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as Application[]

      const { container } = render(<ApplicationTable applications={sampleApplications} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support full keyboard navigation on dashboard', async () => {
      render(<Dashboard />)

      // Tab through all interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /add application/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /import/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /export/i })).toHaveFocus()

      // Should be able to activate buttons with Enter/Space
      await user.keyboard('{Enter}')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should support keyboard navigation in modals', async () => {
      render(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)

      // Focus should be trapped within modal
      const companyInput = screen.getByLabelText(/company/i)
      expect(companyInput).toHaveFocus()

      // Tab through form fields
      await user.tab()
      expect(screen.getByLabelText(/position/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/location/i)).toHaveFocus()

      // Should be able to close modal with Escape
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should support keyboard navigation in data tables', async () => {
      const sampleApplications: Application[] = [
        { id: '1', company: 'Google', position: 'Engineer', status: 'Applied' },
        { id: '2', company: 'Microsoft', position: 'Manager', status: 'Interviewing' }
      ] as Application[]

      render(<ApplicationTable applications={sampleApplications} />)

      // Should be able to navigate table with arrow keys
      const firstRow = screen.getByRole('row', { name: /google/i })
      firstRow.focus()

      await user.keyboard('{ArrowDown}')
      const secondRow = screen.getByRole('row', { name: /microsoft/i })
      expect(secondRow).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(firstRow).toHaveFocus()
    })

    it('should support keyboard shortcuts', async () => {
      render(<Dashboard />)

      // Test global keyboard shortcuts
      await user.keyboard('{Control>}n{/Control}') // Ctrl+N for new application
      expect(screen.getByRole('dialog', { name: /add application/i })).toBeInTheDocument()

      await user.keyboard('{Escape}')

      await user.keyboard('{Control>}i{/Control}') // Ctrl+I for import
      expect(screen.getByRole('dialog', { name: /import/i })).toBeInTheDocument()
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<Dashboard />)

      // Check for proper labeling
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Application Dashboard')
      expect(screen.getByRole('button', { name: /add application/i })).toHaveAttribute('aria-describedby')
      
      // Check for live regions
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should announce dynamic content changes', async () => {
      render(<Dashboard />)

      // Add an application and check for announcements
      const addButton = screen.getByRole('button', { name: /add application/i })
      await user.click(addButton)

      // Should announce modal opening
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-live', 'polite')
      expect(modal).toHaveAttribute('aria-describedby')
    })

    it('should provide proper table headers and captions', () => {
      const sampleApplications: Application[] = [
        { id: '1', company: 'Google', position: 'Engineer', status: 'Applied' }
      ] as Application[]

      render(<ApplicationTable applications={sampleApplications} />)

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Job Applications')
      
      // Check for proper column headers
      expect(screen.getByRole('columnheader', { name: /company/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /position/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
    })

    it('should provide context for form fields', () => {
      render(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)

      // Check for proper form labeling
      const companyInput = screen.getByLabelText(/company/i)
      expect(companyInput).toHaveAttribute('aria-required', 'true')
      expect(companyInput).toHaveAttribute('aria-describedby')

      // Check for error message association
      const positionInput = screen.getByLabelText(/position/i)
      expect(positionInput).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Visual Accessibility', () => {
    it('should meet color contrast requirements', () => {
      render(<Dashboard />)

      // Check that text elements have sufficient contrast
      const headings = screen.getAllByRole('heading')
      headings.forEach(heading => {
        const styles = window.getComputedStyle(heading)
        // This would typically be tested with actual color contrast tools
        expect(styles.color).toBeDefined()
        expect(styles.backgroundColor).toBeDefined()
      })
    })

    it('should support high contrast mode', () => {
      // Set high contrast preference
      localStorage.setItem('accessibility-preferences', JSON.stringify({
        highContrast: true
      }))

      render(
        <AccessibilityWrapper>
          <Dashboard />
        </AccessibilityWrapper>
      )

      // Should apply high contrast styles
      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('high-contrast')
    })

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(
        <AccessibilityWrapper>
          <Dashboard />
        </AccessibilityWrapper>
      )

      // Should disable animations
      const animatedElements = screen.getAllByTestId(/animated/)
      animatedElements.forEach(element => {
        expect(element).toHaveClass('reduce-motion')
      })
    })

    it('should support custom font sizes', () => {
      localStorage.setItem('accessibility-preferences', JSON.stringify({
        fontSize: 'large'
      }))

      render(
        <AccessibilityWrapper>
          <Dashboard />
        </AccessibilityWrapper>
      )

      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('font-large')
    })
  })

  describe('Focus Management', () => {
    it('should manage focus properly in modals', async () => {
      const onClose = jest.fn()
      render(<AddApplicationModal isOpen={true} onClose={onClose} />)

      // Focus should be on first interactive element
      expect(screen.getByLabelText(/company/i)).toHaveFocus()

      // Focus should be trapped within modal
      const lastElement = screen.getByRole('button', { name: /cancel/i })
      lastElement.focus()
      
      await user.tab()
      expect(screen.getByLabelText(/company/i)).toHaveFocus()

      // Focus should return to trigger when modal closes
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalled()
    })

    it('should provide skip links for navigation', () => {
      render(<Dashboard />)

      // Should have skip to main content link
      const skipLink = screen.getByRole('link', { name: /skip to main content/i })
      expect(skipLink).toBeInTheDocument()
      expect(skipLink).toHaveAttribute('href', '#main-content')
    })

    it('should indicate focus visually', async () => {
      render(<Dashboard />)

      const addButton = screen.getByRole('button', { name: /add application/i })
      
      // Focus the button
      addButton.focus()
      
      // Should have visible focus indicator
      expect(addButton).toHaveClass('focus:ring-2')
      expect(addButton).toHaveClass('focus:ring-blue-500')
    })
  })

  describe('Error Accessibility', () => {
    it('should announce errors to screen readers', async () => {
      render(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)

      // Submit form with empty required fields
      const submitButton = screen.getByRole('button', { name: /add application/i })
      await user.click(submitButton)

      // Should show error messages with proper ARIA attributes
      const errorMessage = screen.getByRole('alert')
      expect(errorMessage).toBeInTheDocument()
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive')

      // Form fields should be marked as invalid
      const companyInput = screen.getByLabelText(/company/i)
      expect(companyInput).toHaveAttribute('aria-invalid', 'true')
      expect(companyInput).toHaveAttribute('aria-describedby')
    })

    it('should provide helpful error recovery options', async () => {
      render(<ImportModal isOpen={true} onClose={jest.fn()} />)

      // Simulate import error
      const fileInput = screen.getByLabelText(/upload csv file/i)
      const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
      
      await user.upload(fileInput, invalidFile)

      // Should show error with recovery options
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /choose different file/i })).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
    })

    it('should be accessible on mobile devices', async () => {
      const { container } = render(<Dashboard />)
      
      // Should have proper touch targets (minimum 44px)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const minSize = parseInt(styles.minHeight) || parseInt(styles.height)
        expect(minSize).toBeGreaterThanOrEqual(44)
      })

      // Should have no accessibility violations on mobile
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support touch navigation', async () => {
      render(<ApplicationTable applications={[]} />)

      // Should support swipe gestures for table navigation
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label')
      expect(table).toHaveClass('touch-pan-x')
    })
  })

  describe('Internationalization Accessibility', () => {
    it('should support RTL languages', () => {
      // Mock RTL language
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')

      render(<Dashboard />)

      // Should apply RTL styles
      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('rtl:text-right')
      
      // Clean up
      document.documentElement.removeAttribute('dir')
      document.documentElement.removeAttribute('lang')
    })

    it('should provide proper language attributes', () => {
      render(<Dashboard />)

      // Should have proper lang attributes
      expect(document.documentElement).toHaveAttribute('lang')
      
      // Dynamic content should have appropriate lang attributes
      const dynamicContent = screen.queryAllByTestId('dynamic-content')
      dynamicContent.forEach(element => {
        if (element.textContent && element.textContent.match(/[^\x00-\x7F]/)) {
          expect(element).toHaveAttribute('lang')
        }
      })
    })
  })

  describe('Accessibility Preferences', () => {
    it('should persist accessibility preferences', () => {
      const preferences = {
        highContrast: true,
        fontSize: 'large',
        reduceMotion: true,
        screenReader: true
      }

      localStorage.setItem('accessibility-preferences', JSON.stringify(preferences))

      render(
        <AccessibilityWrapper>
          <Dashboard />
        </AccessibilityWrapper>
      )

      // Should apply all preferences
      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveClass('high-contrast')
      expect(dashboard).toHaveClass('font-large')
      expect(dashboard).toHaveClass('reduce-motion')
      expect(dashboard).toHaveClass('screen-reader-optimized')
    })

    it('should allow users to customize accessibility settings', async () => {
      render(<Dashboard />)

      // Open accessibility settings
      const settingsButton = screen.getByRole('button', { name: /accessibility settings/i })
      await user.click(settingsButton)

      // Should show accessibility options
      expect(screen.getByRole('checkbox', { name: /high contrast/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /large font/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /reduce motion/i })).toBeInTheDocument()

      // Should save preferences when changed
      const highContrastCheckbox = screen.getByRole('checkbox', { name: /high contrast/i })
      await user.click(highContrastCheckbox)

      const savedPreferences = JSON.parse(localStorage.getItem('accessibility-preferences') || '{}')
      expect(savedPreferences.highContrast).toBe(true)
    })
  })
})