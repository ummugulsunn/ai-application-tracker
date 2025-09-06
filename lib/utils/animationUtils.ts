/**
 * Hydration-safe animation utilities
 * Provides consistent animation behavior between server and client rendering
 */

import { useEffect, useState } from 'react'

/**
 * Hook to safely enable animations after hydration
 * Returns false during SSR and initial client render, true after hydration
 */
export function useHydrationSafeAnimations(): boolean {
  const [animationsEnabled, setAnimationsEnabled] = useState(false)
  
  useEffect(() => {
    // Enable animations only after hydration is complete
    setAnimationsEnabled(true)
  }, [])
  
  return animationsEnabled
}

/**
 * Get animation classes that are safe for SSR
 * Returns empty string during SSR, actual classes after hydration
 */
export function getAnimationClasses(
  animationsEnabled: boolean,
  classes: string
): string {
  return animationsEnabled ? classes : ''
}

/**
 * Get transition classes that are safe for SSR
 * Returns base classes during SSR, enhanced classes after hydration
 */
export function getTransitionClasses(
  animationsEnabled: boolean,
  baseClasses: string,
  enhancedClasses: string
): string {
  return animationsEnabled ? `${baseClasses} ${enhancedClasses}` : baseClasses
}

/**
 * CSS class names for hydration-safe animations
 * These classes should be applied conditionally after hydration
 */
export const ANIMATION_CLASSES = {
  // Hover effects that don't change DOM structure
  tableRowHover: 'hover:bg-gray-50',
  buttonHover: 'hover:shadow-lg hover:-translate-y-0.5',
  cardHover: 'hover:shadow-md',
  
  // Transition effects
  colorTransition: 'transition-colors duration-200',
  shadowTransition: 'transition-shadow duration-200',
  allTransition: 'transition-all duration-200',
  
  // Animation effects
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
} as const

/**
 * Get table row classes with hydration-safe animations
 */
export function getTableRowClasses(animationsEnabled: boolean): string {
  const baseClasses = 'border-b border-gray-200'
  const animationClasses = animationsEnabled 
    ? `${ANIMATION_CLASSES.tableRowHover} ${ANIMATION_CLASSES.colorTransition}`
    : ''
  
  return `${baseClasses} ${animationClasses}`.trim()
}

/**
 * Get button classes with hydration-safe animations
 */
export function getButtonClasses(
  animationsEnabled: boolean,
  variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary'
): string {
  const baseClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-lg',
    success: 'bg-success-600 hover:bg-success-700 text-white font-medium py-2 px-4 rounded-lg',
  }
  
  const animationClasses = animationsEnabled
    ? `${ANIMATION_CLASSES.allTransition} ${ANIMATION_CLASSES.buttonHover}`
    : ''
  
  return `${baseClasses[variant]} ${animationClasses}`.trim()
}

/**
 * Get card classes with hydration-safe animations
 */
export function getCardClasses(animationsEnabled: boolean): string {
  const baseClasses = 'bg-white rounded-xl shadow-sm border border-gray-200 p-6'
  const animationClasses = animationsEnabled
    ? `${ANIMATION_CLASSES.cardHover} ${ANIMATION_CLASSES.shadowTransition}`
    : ''
  
  return `${baseClasses} ${animationClasses}`.trim()
}

/**
 * Utility to conditionally apply animation classes
 * Prevents hydration mismatches by ensuring consistent class application
 */
export function conditionalAnimationClass(
  animationsEnabled: boolean,
  className: string
): string {
  return animationsEnabled ? className : ''
}