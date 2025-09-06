/**
 * Tests for hydration-safe animation utilities
 */

import { renderHook, act } from '@testing-library/react'
import {
  useHydrationSafeAnimations,
  getAnimationClasses,
  getTransitionClasses,
  getTableRowClasses,
  getButtonClasses,
  getCardClasses,
  conditionalAnimationClass,
  ANIMATION_CLASSES
} from '../utils/animationUtils'

describe('Animation Utils', () => {
  describe('useHydrationSafeAnimations', () => {
    it('should be a function that returns a boolean', () => {
      const { result } = renderHook(() => useHydrationSafeAnimations())
      expect(typeof result.current).toBe('boolean')
    })

    it('should handle state changes correctly', () => {
      const { result } = renderHook(() => useHydrationSafeAnimations())
      
      // The hook should return a boolean value
      expect(typeof result.current).toBe('boolean')
      
      // The implementation uses useEffect to set animations to true after mount
      // In test environment, this happens immediately, so we expect true
      expect(result.current).toBe(true)
    })
  })

  describe('getAnimationClasses', () => {
    it('should return empty string when animations disabled', () => {
      const result = getAnimationClasses(false, 'animate-fade-in')
      expect(result).toBe('')
    })

    it('should return classes when animations enabled', () => {
      const result = getAnimationClasses(true, 'animate-fade-in')
      expect(result).toBe('animate-fade-in')
    })
  })

  describe('getTransitionClasses', () => {
    it('should return only base classes when animations disabled', () => {
      const result = getTransitionClasses(false, 'base-class', 'transition-all')
      expect(result).toBe('base-class')
    })

    it('should return combined classes when animations enabled', () => {
      const result = getTransitionClasses(true, 'base-class', 'transition-all')
      expect(result).toBe('base-class transition-all')
    })
  })

  describe('getTableRowClasses', () => {
    it('should return base classes without animations when disabled', () => {
      const result = getTableRowClasses(false)
      expect(result).toBe('border-b border-gray-200')
    })

    it('should include hover and transition classes when enabled', () => {
      const result = getTableRowClasses(true)
      expect(result).toContain('border-b border-gray-200')
      expect(result).toContain('hover:bg-gray-50')
      expect(result).toContain('transition-colors')
    })
  })

  describe('getButtonClasses', () => {
    it('should return base button classes without animations when disabled', () => {
      const result = getButtonClasses(false, 'primary')
      expect(result).toContain('bg-primary-600')
      expect(result).toContain('hover:bg-primary-700')
      expect(result).not.toContain('transition-all')
    })

    it('should include animation classes when enabled', () => {
      const result = getButtonClasses(true, 'primary')
      expect(result).toContain('bg-primary-600')
      expect(result).toContain('hover:bg-primary-700')
      expect(result).toContain('transition-all')
      expect(result).toContain('hover:shadow-lg')
    })

    it('should handle different button variants', () => {
      const variants = ['primary', 'secondary', 'danger', 'success'] as const
      
      variants.forEach(variant => {
        const result = getButtonClasses(true, variant)
        expect(result).toContain('font-medium')
        expect(result).toContain('py-2')
        expect(result).toContain('px-4')
        expect(result).toContain('rounded-lg')
      })
    })
  })

  describe('getCardClasses', () => {
    it('should return base card classes without animations when disabled', () => {
      const result = getCardClasses(false)
      expect(result).toContain('bg-white')
      expect(result).toContain('rounded-xl')
      expect(result).not.toContain('hover:shadow-md')
      expect(result).not.toContain('transition-shadow')
    })

    it('should include hover and transition classes when enabled', () => {
      const result = getCardClasses(true)
      expect(result).toContain('bg-white')
      expect(result).toContain('rounded-xl')
      expect(result).toContain('hover:shadow-md')
      expect(result).toContain('transition-shadow')
    })
  })

  describe('conditionalAnimationClass', () => {
    it('should return empty string when animations disabled', () => {
      const result = conditionalAnimationClass(false, 'hover:bg-gray-100')
      expect(result).toBe('')
    })

    it('should return class when animations enabled', () => {
      const result = conditionalAnimationClass(true, 'hover:bg-gray-100')
      expect(result).toBe('hover:bg-gray-100')
    })
  })

  describe('ANIMATION_CLASSES constants', () => {
    it('should have all required animation class constants', () => {
      expect(ANIMATION_CLASSES.tableRowHover).toBe('hover:bg-gray-50')
      expect(ANIMATION_CLASSES.buttonHover).toBe('hover:shadow-lg hover:-translate-y-0.5')
      expect(ANIMATION_CLASSES.cardHover).toBe('hover:shadow-md')
      expect(ANIMATION_CLASSES.colorTransition).toBe('transition-colors duration-200')
      expect(ANIMATION_CLASSES.shadowTransition).toBe('transition-shadow duration-200')
      expect(ANIMATION_CLASSES.allTransition).toBe('transition-all duration-200')
      expect(ANIMATION_CLASSES.fadeIn).toBe('animate-fade-in')
      expect(ANIMATION_CLASSES.slideUp).toBe('animate-slide-up')
    })
  })

  describe('Hydration Safety', () => {
    it('should ensure consistent class output for SSR', () => {
      // Test that disabled animations always produce the same output
      const tableClasses1 = getTableRowClasses(false)
      const tableClasses2 = getTableRowClasses(false)
      expect(tableClasses1).toBe(tableClasses2)

      const buttonClasses1 = getButtonClasses(false, 'primary')
      const buttonClasses2 = getButtonClasses(false, 'primary')
      expect(buttonClasses1).toBe(buttonClasses2)

      const cardClasses1 = getCardClasses(false)
      const cardClasses2 = getCardClasses(false)
      expect(cardClasses1).toBe(cardClasses2)
    })

    it('should not include animation-specific classes during SSR', () => {
      const ssrClasses = [
        getTableRowClasses(false),
        getButtonClasses(false, 'primary'),
        getCardClasses(false),
        conditionalAnimationClass(false, 'animate-fade-in')
      ]

      ssrClasses.forEach(classString => {
        expect(classString).not.toContain('transition')
        expect(classString).not.toContain('animate-')
        expect(classString).not.toContain('duration-')
      })
    })
  })
})