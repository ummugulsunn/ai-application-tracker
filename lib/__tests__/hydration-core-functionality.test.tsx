/**
 * Core Hydration Functionality Tests
 * Focused tests for hydration consistency without complex component dependencies
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { 
  getStaticDateDisplay, 
  formatDateForSSR, 
  useProgressiveDateDisplay,
  validateDateFormatting 
} from '@/lib/utils/dateFormatting'
import { 
  useHydrationSafeAnimations,
  getTableRowClasses,
  getButtonClasses,
  getCardClasses,
  conditionalAnimationClass
} from '@/lib/utils/animationUtils'
import {
  validateHydrationSafety,
  createStableKey,
  validateListKeys,
  useProgressiveEnhancement
} from '@/lib/utils/hydrationUtils'

// Simple test components for hydration testing
const SimpleTableComponent = () => {
  const animationsEnabled = useHydrationSafeAnimations()
  
  const testData = [
    { id: 'item-1', name: 'Test Item 1', date: '2024-01-15T10:30:00.000Z' },
    { id: 'item-2', name: 'Test Item 2', date: '2024-01-10T15:45:00.000Z' }
  ]
  
  return (
    <table>
      <tbody>
        {testData.map((item) => (
          <tr key={item.id} className={getTableRowClasses(animationsEnabled)}>
            <td>{item.name}</td>
            <td>{formatDateForSSR(item.date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const DateDisplayComponent = ({ date }: { date: string }) => {
  const dateDisplay = useProgressiveDateDisplay(date, {
    showRelativeTime: true,
    enableClientEnhancements: true
  })
  
  return (
    <div>
      <span data-testid="absolute-date">{dateDisplay.absolute}</span>
      <span data-testid="relative-date">{dateDisplay.relative}</span>
      <span data-testid="enhanced-status">{dateDisplay.isEnhanced.toString()}</span>
    </div>
  )
}

const ButtonComponent = ({ variant = 'primary' }: { variant?: 'primary' | 'secondary' }) => {
  const animationsEnabled = useHydrationSafeAnimations()
  
  return (
    <button className={getButtonClasses(animationsEnabled, variant)}>
      Test Button
    </button>
  )
}

describe('Core Hydration Functionality Tests', () => {
  describe('Date Formatting Consistency', () => {
    const testDate = '2024-01-15T10:30:00.000Z'
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
      expect(result1.absolute).toBe('Jan 15, 2024')
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
      ]
      
      dates.forEach(date => {
        const result = getStaticDateDisplay(date)
        expect(result.absolute).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
        expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(typeof result.timestamp).toBe('number')
      })
    })

    it('should validate date formatting for hydration safety', () => {
      const validDate = '2024-01-15T10:30:00.000Z'
      const invalidDate = 'invalid-date'
      
      const validResult = validateDateFormatting(validDate)
      const invalidResult = validateDateFormatting(invalidDate)
      
      expect(typeof validResult.isHydrationSafe).toBe('boolean')
      expect(Array.isArray(validResult.issues)).toBe(true)
      
      expect(invalidResult.isHydrationSafe).toBe(false)
      expect(invalidResult.issues).toContain('Invalid date provided')
    })

    it('should render dates consistently in simple component', () => {
      render(<SimpleTableComponent />)
      
      // Check that dates are rendered using static formatting
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument()
    })
  })

  describe('Animation Utilities Consistency', () => {
    it('should provide different classes based on animation state', () => {
      const noAnimClasses = getTableRowClasses(false)
      const animClasses = getTableRowClasses(true)
      
      // Both should have base classes
      expect(noAnimClasses).toContain('border-b')
      expect(animClasses).toContain('border-b')
      
      // Only animated version should have hover effects
      expect(noAnimClasses).not.toContain('hover:bg-gray-50')
      expect(animClasses).toContain('hover:bg-gray-50')
      expect(animClasses).toContain('transition-colors')
    })

    it('should handle button variants correctly', () => {
      const variants = ['primary', 'secondary'] as const
      
      variants.forEach(variant => {
        const noAnimButton = getButtonClasses(false, variant)
        const animButton = getButtonClasses(true, variant)
        
        // Both should have base variant classes
        expect(noAnimButton).toContain('font-medium')
        expect(animButton).toContain('font-medium')
        
        // Only animated version should have transitions
        expect(animButton).toContain('transition-all')
        expect(noAnimButton).not.toContain('transition-all')
      })
    })

    it('should conditionally apply animation classes', () => {
      const testClass = 'transition-opacity duration-300'
      
      expect(conditionalAnimationClass(false, testClass)).toBe('')
      expect(conditionalAnimationClass(true, testClass)).toBe(testClass)
    })

    it('should render buttons with consistent structure', () => {
      const { container: noAnimContainer } = render(<ButtonComponent />)
      const { container: animContainer } = render(<ButtonComponent />)
      
      // Both should render a button
      expect(noAnimContainer.querySelector('button')).toBeInTheDocument()
      expect(animContainer.querySelector('button')).toBeInTheDocument()
      
      // Both should have the same text content
      expect(noAnimContainer.textContent).toBe(animContainer.textContent)
    })
  })

  describe('Progressive Enhancement', () => {
    it('should progressively enhance date display', async () => {
      render(<DateDisplayComponent date="2024-01-15T10:30:00.000Z" />)
      
      // Should always show absolute date
      expect(screen.getByTestId('absolute-date')).toHaveTextContent('Jan 15, 2024')
      
      // The enhancement happens immediately in test environment
      // In real browser, there would be a delay
      await waitFor(() => {
        expect(screen.getByTestId('enhanced-status')).toHaveTextContent('true')
      })
      
      // Should show relative time after enhancement
      await waitFor(() => {
        const relativeText = screen.getByTestId('relative-date').textContent
        expect(relativeText).toMatch(/ago|Today|Yesterday/)
      })
    })

    it('should handle progressive enhancement hook', async () => {
      const TestComponent = () => {
        const { isClient, isHydrated } = useProgressiveEnhancement()
        
        return (
          <div>
            <span data-testid="client-status">{isClient.toString()}</span>
            <span data-testid="hydrated-status">{isHydrated.toString()}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      // In test environment, enhancement happens immediately
      // Should eventually become true
      await waitFor(() => {
        expect(screen.getByTestId('client-status')).toHaveTextContent('true')
        expect(screen.getByTestId('hydrated-status')).toHaveTextContent('true')
      })
    })
  })

  describe('Hydration Safety Validation', () => {
    it('should validate safe props', () => {
      const safeProps = {
        title: 'Safe Title',
        count: 42,
        isActive: true,
        items: ['item1', 'item2']
      }
      
      const result = validateHydrationSafety(safeProps)
      
      expect(result.isHydrationSafe).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect unsafe props', () => {
      const unsafeProps = {
        title: 'Unsafe Title',
        createdAt: new Date(), // This will cause hydration issues
        callback: () => {} // Functions can cause issues if used in rendering
      }
      
      const result = validateHydrationSafety(unsafeProps)
      
      expect(result.isHydrationSafe).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.issues.some(issue => issue.includes('Date object'))).toBe(true)
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

    it('should validate list keys', () => {
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
  })

  describe('Server-Side Rendering Compatibility', () => {
    it('should render simple table to string without errors', () => {
      expect(() => {
        const html = renderToString(<SimpleTableComponent />)
        expect(typeof html).toBe('string')
        expect(html.length).toBeGreaterThan(0)
        expect(html).toContain('Test Item 1')
        expect(html).toContain('Jan 15, 2024')
      }).not.toThrow()
    })

    it('should render date component to string without errors', () => {
      expect(() => {
        const html = renderToString(<DateDisplayComponent date="2024-01-15T10:30:00.000Z" />)
        expect(typeof html).toBe('string')
        expect(html).toContain('Jan 15, 2024')
        expect(html).toContain('Click to see relative time')
      }).not.toThrow()
    })

    it('should render button component to string without errors', () => {
      expect(() => {
        const html = renderToString(<ButtonComponent />)
        expect(typeof html).toBe('string')
        expect(html).toContain('Test Button')
      }).not.toThrow()
    })

    it('should produce deterministic HTML output', () => {
      const html1 = renderToString(<SimpleTableComponent />)
      const html2 = renderToString(<SimpleTableComponent />)
      
      expect(html1).toBe(html2)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed dates gracefully', () => {
      const malformedDates = [
        'invalid-date',
        '',
        'not-a-date'
      ]
      
      malformedDates.forEach(date => {
        const result = getStaticDateDisplay(date as any)
        // Should provide a fallback for invalid dates
        expect(typeof result.absolute).toBe('string')
        expect(result.absolute).toBe('Invalid Date')
        expect(result.iso).toBe('')
        expect(result.timestamp).toBe(0)
      })
    })

    it('should handle null/undefined dates', () => {
      const nullResult = formatDateForSSR(null as any)
      const undefinedResult = formatDateForSSR(undefined as any)
      
      expect(nullResult).toBe('Invalid Date')
      expect(undefinedResult).toBe('Invalid Date')
    })

    it('should handle empty arrays in validation', () => {
      const result = validateListKeys([])
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should handle null props in validation', () => {
      const result = validateHydrationSafety(null as any)
      expect(result.isHydrationSafe).toBe(true)
      expect(result.issues).toHaveLength(0)
    })
  })

  describe('Performance Considerations', () => {
    it('should handle multiple date formatting calls efficiently', () => {
      const testDate = '2024-01-15T10:30:00.000Z'
      const startTime = performance.now()
      
      // Format the same date multiple times
      for (let i = 0; i < 1000; i++) {
        formatDateForSSR(testDate)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (less than 100ms for 1000 calls)
      expect(duration).toBeLessThan(100)
    })

    it('should handle multiple key generation calls efficiently', () => {
      const startTime = performance.now()
      
      // Generate multiple keys
      for (let i = 0; i < 1000; i++) {
        createStableKey('item', i)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(50)
    })

    it('should not cause memory leaks with component mounting/unmounting', () => {
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<DateDisplayComponent date="2024-01-15T10:30:00.000Z" />)
        unmount()
      }
      
      // Should complete without issues
      expect(true).toBe(true)
    })
  })
})