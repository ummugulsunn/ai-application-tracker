'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Skip to main content link
export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

// Screen reader only text
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

// Focus trap for modals and dialogs
export function FocusTrap({ 
  children, 
  active = true 
}: { 
  children: React.ReactNode
  active?: boolean 
}) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || typeof document === 'undefined') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [active])

  return <>{children}</>
}

// Accessible motion wrapper that respects user preferences
export function AccessibleMotion({
  children,
  className,
  ...motionProps
}: {
  children: React.ReactNode
  className?: string
} & React.ComponentProps<typeof motion.div>) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  )
}

// Live region for dynamic content announcements
export function LiveRegion({ 
  children, 
  politeness = 'polite',
  className 
}: { 
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  className?: string 
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// High contrast mode detector and wrapper
export function HighContrastWrapper({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    // Only access window on client side to prevent hydration issues
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className={cn(isHighContrast && 'high-contrast')}>
      {children}
    </div>
  )
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: HTMLElement[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
  } = {}
) {
  const { loop = true, orientation = 'vertical' } = options
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleKeyDown = (e: KeyboardEvent) => {
    const isVertical = orientation === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    switch (e.key) {
      case nextKey:
        e.preventDefault()
        setCurrentIndex(prev => {
          const next = prev + 1
          if (next >= items.length) {
            return loop ? 0 : prev
          }
          return next
        })
        break
      case prevKey:
        e.preventDefault()
        setCurrentIndex(prev => {
          const next = prev - 1
          if (next < 0) {
            return loop ? items.length - 1 : prev
          }
          return next
        })
        break
      case 'Home':
        e.preventDefault()
        setCurrentIndex(0)
        break
      case 'End':
        e.preventDefault()
        setCurrentIndex(items.length - 1)
        break
    }
  }

  useEffect(() => {
    items[currentIndex]?.focus()
  }, [currentIndex, items])

  return { currentIndex, handleKeyDown }
}

// Accessible form field wrapper
export function FormField({
  children,
  label,
  error,
  helperText,
  required = false,
  className
}: {
  children: React.ReactNode
  label: string
  error?: string
  helperText?: string
  required?: boolean
  className?: string
}) {
  const fieldId = `field-${Math.random().toString(36).substring(2, 11)}`
  const errorId = error ? `${fieldId}-error` : undefined
  const helperId = helperText ? `${fieldId}-helper` : undefined

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-danger-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      <div
        id={fieldId}
        aria-describedby={cn(errorId, helperId).trim() || undefined}
        aria-invalid={error ? 'true' : 'false'}
      >
        {children}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-danger-600" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}

// Accessible button with loading state
export function AccessibleButton({
  children,
  loading = false,
  loadingText = 'Loading...',
  className,
  ...props
}: {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
      disabled={loading || props.disabled}
      aria-busy={loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      {...props}
    >
      {loading ? (
        <>
          <span aria-hidden="true">{loadingText}</span>
          <ScreenReaderOnly>
            <span id="loading-description">Please wait, {loadingText.toLowerCase()}</span>
          </ScreenReaderOnly>
        </>
      ) : (
        children
      )}
    </button>
  )
}