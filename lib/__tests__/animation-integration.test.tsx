/**
 * Integration test for hydration-safe animation system
 */

import React from 'react'
import { render } from '@testing-library/react'
import { 
  useHydrationSafeAnimations,
  getTableRowClasses,
  getButtonClasses,
  getCardClasses,
  conditionalAnimationClass
} from '../utils/animationUtils'

// Test component that uses the animation utilities
function TestComponent() {
  const animationsEnabled = useHydrationSafeAnimations()
  
  return (
    <div>
      <div 
        data-testid="table-row" 
        className={getTableRowClasses(animationsEnabled)}
      >
        Table Row
      </div>
      
      <button 
        data-testid="primary-button"
        className={getButtonClasses(animationsEnabled, 'primary')}
      >
        Primary Button
      </button>
      
      <button 
        data-testid="secondary-button"
        className={getButtonClasses(animationsEnabled, 'secondary')}
      >
        Secondary Button
      </button>
      
      <div 
        data-testid="card"
        className={getCardClasses(animationsEnabled)}
      >
        Card Content
      </div>
      
      <div 
        data-testid="conditional-animation"
        className={`base-class ${conditionalAnimationClass(animationsEnabled, 'hover:bg-gray-100 transition-colors')}`}
      >
        Conditional Animation
      </div>
    </div>
  )
}

describe('Animation Integration', () => {
  it('should render components with proper animation classes', () => {
    const { container } = render(<TestComponent />)
    
    // Check that all elements are rendered
    const tableRow = container.querySelector('[data-testid="table-row"]')
    const primaryButton = container.querySelector('[data-testid="primary-button"]')
    const secondaryButton = container.querySelector('[data-testid="secondary-button"]')
    const card = container.querySelector('[data-testid="card"]')
    const conditionalElement = container.querySelector('[data-testid="conditional-animation"]')
    
    expect(tableRow).toBeTruthy()
    expect(primaryButton).toBeTruthy()
    expect(secondaryButton).toBeTruthy()
    expect(card).toBeTruthy()
    expect(conditionalElement).toBeTruthy()
  })

  it('should apply consistent base classes regardless of animation state', () => {
    const { container } = render(<TestComponent />)
    
    // Check base classes are always present
    const primaryButton = container.querySelector('[data-testid="primary-button"]')
    const secondaryButton = container.querySelector('[data-testid="secondary-button"]')
    const card = container.querySelector('[data-testid="card"]')
    
    // Base button classes should always be present
    expect(primaryButton?.className).toContain('bg-primary-600')
    expect(primaryButton?.className).toContain('text-white')
    expect(primaryButton?.className).toContain('font-medium')
    expect(primaryButton?.className).toContain('py-2')
    expect(primaryButton?.className).toContain('px-4')
    expect(primaryButton?.className).toContain('rounded-lg')
    
    expect(secondaryButton?.className).toContain('bg-gray-200')
    expect(secondaryButton?.className).toContain('text-gray-800')
    
    // Base card classes should always be present
    expect(card?.className).toContain('bg-white')
    expect(card?.className).toContain('rounded-xl')
    expect(card?.className).toContain('shadow-sm')
    expect(card?.className).toContain('border')
    expect(card?.className).toContain('p-6')
  })

  it('should include animation classes when animations are enabled', () => {
    const { container } = render(<TestComponent />)
    
    // In test environment, animations should be enabled after mount
    const tableRow = container.querySelector('[data-testid="table-row"]')
    const primaryButton = container.querySelector('[data-testid="primary-button"]')
    const card = container.querySelector('[data-testid="card"]')
    const conditionalElement = container.querySelector('[data-testid="conditional-animation"]')
    
    // Should have animation classes
    expect(tableRow?.className).toContain('hover:bg-gray-50')
    expect(tableRow?.className).toContain('transition-colors')
    
    expect(primaryButton?.className).toContain('transition-all')
    expect(primaryButton?.className).toContain('hover:shadow-lg')
    
    expect(card?.className).toContain('hover:shadow-md')
    expect(card?.className).toContain('transition-shadow')
    
    expect(conditionalElement?.className).toContain('hover:bg-gray-100')
    expect(conditionalElement?.className).toContain('transition-colors')
  })

  it('should maintain consistent DOM structure', () => {
    // Render multiple times to ensure consistency
    const { container: container1 } = render(<TestComponent />)
    const { container: container2 } = render(<TestComponent />)
    
    // Get the structure without class attributes
    const structure1 = container1.innerHTML.replace(/class="[^"]*"/g, 'class=""')
    const structure2 = container2.innerHTML.replace(/class="[^"]*"/g, 'class=""')
    
    // DOM structure should be identical
    expect(structure1).toBe(structure2)
  })

  it('should handle all button variants correctly', () => {
    const variants = ['primary', 'secondary', 'danger', 'success'] as const
    
    variants.forEach(variant => {
      function VariantTestComponent() {
        const animationsEnabled = useHydrationSafeAnimations()
        return (
          <button className={getButtonClasses(animationsEnabled, variant)}>
            {variant} Button
          </button>
        )
      }
      
      const { container } = render(<VariantTestComponent />)
      const button = container.querySelector('button')
      
      // Should have base button classes
      expect(button?.className).toContain('font-medium')
      expect(button?.className).toContain('py-2')
      expect(button?.className).toContain('px-4')
      expect(button?.className).toContain('rounded-lg')
      
      // Should have variant-specific classes
      if (variant === 'primary') {
        expect(button?.className).toContain('bg-primary-600')
        expect(button?.className).toContain('text-white')
      } else if (variant === 'secondary') {
        expect(button?.className).toContain('bg-gray-200')
        expect(button?.className).toContain('text-gray-800')
      } else if (variant === 'danger') {
        expect(button?.className).toContain('bg-danger-600')
        expect(button?.className).toContain('text-white')
      } else if (variant === 'success') {
        expect(button?.className).toContain('bg-success-600')
        expect(button?.className).toContain('text-white')
      }
    })
  })
})