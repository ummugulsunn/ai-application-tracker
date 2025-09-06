/**
 * Hydration-safe utility functions
 * These utilities ensure consistent rendering between server and client
 * and provide progressive enhancement capabilities
 */

import { useEffect, useState } from 'react'

// Re-export date utilities for convenience
export { 
  getStaticDateDisplay, 
  useProgressiveDateDisplay, 
  formatDateForSSR, 
  validateDateFormatting,
  type DateDisplayConfig 
} from './dateFormatting'

/**
 * Progressive enhancement hook for client-only features
 * Ensures features are only enabled after hydration is complete
 */
export function useProgressiveEnhancement() {
  const [isClient, setIsClient] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Use a small delay to ensure hydration is complete
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  return {
    isClient,
    isHydrated,
    // Helper to conditionally enable features
    enableFeature: (feature: () => void) => {
      if (isHydrated) {
        feature()
      }
    }
  }
}

/**
 * Hook for safely accessing browser APIs after hydration
 * Prevents SSR errors when using window, document, etc.
 */
export function useBrowserAPI() {
  const [isBrowser, setIsBrowser] = useState(false)

  useEffect(() => {
    setIsBrowser(true)
  }, [])

  return {
    isBrowser,
    window: isBrowser ? window : undefined,
    document: isBrowser ? document : undefined,
    localStorage: isBrowser ? localStorage : undefined,
    sessionStorage: isBrowser ? sessionStorage : undefined
  }
}

/**
 * Creates a stable, deterministic key for React elements
 * Ensures keys are consistent between server and client renders
 */
export function createStableKey(
  prefix: string, 
  identifier: string | number, 
  suffix?: string
): string {
  const parts = [prefix, String(identifier)]
  if (suffix) {
    parts.push(suffix)
  }
  return parts.join('-')
}

/**
 * Validates that a component's props are hydration-safe
 * Checks for common patterns that cause hydration mismatches
 */
export function validateHydrationSafety(props: Record<string, any>): {
  isHydrationSafe: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Handle null/undefined props
  if (!props || typeof props !== 'object') {
    return {
      isHydrationSafe: true,
      issues: []
    }
  }

  // Check for Date objects that might render differently
  Object.entries(props).forEach(([key, value]) => {
    if (value instanceof Date) {
      issues.push(`Prop '${key}' contains a Date object. Use static date formatting for SSR compatibility.`)
    }
    
    // Check for functions that might not be serializable
    if (typeof value === 'function') {
      issues.push(`Prop '${key}' contains a function. Ensure it's not used in rendering logic that affects HTML structure.`)
    }
    
    // Check for browser-specific objects
    if (typeof window !== 'undefined' && value === window) {
      issues.push(`Prop '${key}' references window object. This will cause hydration mismatches.`)
    }
    
    if (typeof document !== 'undefined' && value === document) {
      issues.push(`Prop '${key}' references document object. This will cause hydration mismatches.`)
    }
  })

  return {
    isHydrationSafe: issues.length === 0,
    issues
  }
}

/**
 * Wrapper for conditionally rendering client-only content
 * Prevents hydration mismatches by not rendering on server
 */
export function ClientOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook for managing animations that should only run after hydration
 * Prevents animation-related hydration mismatches
 */
export function useHydrationSafeAnimation(initialState = false) {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(initialState)
  const { isHydrated } = useProgressiveEnhancement()

  useEffect(() => {
    if (!isHydrated) return

    // Enable animations after hydration with a small delay
    const timer = setTimeout(() => {
      setIsAnimationEnabled(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [isHydrated])

  return {
    isAnimationEnabled,
    enableAnimations: () => setIsAnimationEnabled(true),
    disableAnimations: () => setIsAnimationEnabled(false)
  }
}

/**
 * Utility to safely access nested object properties
 * Prevents errors when server and client data might differ
 */
export function safeGet<T>(
  obj: any, 
  path: string, 
  defaultValue: T
): T {
  try {
    const keys = path.split('.')
    let result = obj
    
    for (const key of keys) {
      if (result == null) {
        return defaultValue
      }
      result = result[key]
    }
    
    return result !== undefined ? result : defaultValue
  } catch {
    return defaultValue
  }
}

/**
 * Creates a hydration-safe ID generator
 * Ensures IDs are consistent between server and client
 */
export function createHydrationSafeId(prefix = 'id'): string {
  // Use a deterministic approach for SSR compatibility
  // In a real app, you might want to use a more sophisticated approach
  // like a counter or UUID that's synchronized between server and client
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validates that an array of items has stable keys for rendering
 * Helps prevent hydration issues with dynamic lists
 */
export function validateListKeys<T extends { id?: string | number }>(
  items: T[],
  keyExtractor?: (item: T, index: number) => string | number
): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const keys = new Set<string | number>()

  items.forEach((item, index) => {
    const key = keyExtractor ? keyExtractor(item, index) : item.id ?? index
    
    if (keys.has(key)) {
      issues.push(`Duplicate key found: ${key}`)
    }
    
    if (key === index && items.length > 1) {
      issues.push(`Using array index as key can cause hydration issues if list order changes`)
    }
    
    keys.add(key)
  })

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Development-only function to log hydration mismatches
 * Helps debug hydration issues during development
 */
export function logHydrationMismatch(
  componentName: string, 
  serverValue: any, 
  clientValue: any
) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `Hydration mismatch detected in ${componentName}:`,
      '\nServer value:', serverValue,
      '\nClient value:', clientValue
    )
  }
}

/**
 * Hook to detect and report hydration mismatches
 * Useful for debugging hydration issues
 */
export function useHydrationMismatchDetector(
  componentName: string,
  values: Record<string, any>
) {
  const [serverValues] = useState(values)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    
    if (process.env.NODE_ENV === 'development') {
      Object.entries(values).forEach(([key, clientValue]) => {
        const serverValue = serverValues[key]
        if (JSON.stringify(serverValue) !== JSON.stringify(clientValue)) {
          logHydrationMismatch(
            `${componentName}.${key}`,
            serverValue,
            clientValue
          )
        }
      })
    }
  }, [componentName, values, serverValues])

  return { hasMounted }
}