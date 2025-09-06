'use client'

import { useEffect, useState } from 'react'

/**
 * Hydration-safe date formatting utilities
 * These functions ensure consistent date display between server and client renders
 */

export interface DateDisplayConfig {
  showRelativeTime: boolean
  useStaticFormatting: boolean
  enableClientEnhancements: boolean
}

/**
 * Static date formatting that works identically on server and client
 * Uses UTC-based formatting to avoid timezone inconsistencies
 */
export function getStaticDateDisplay(date: Date | string) {
  // Handle null/undefined/empty values
  if (!date) {
    return {
      absolute: 'Invalid Date',
      relative: 'Click to see relative time',
      iso: '',
      timestamp: 0
    }
  }
  
  const d = new Date(date)
  
  // Handle invalid dates
  if (isNaN(d.getTime())) {
    return {
      absolute: 'Invalid Date',
      relative: 'Click to see relative time',
      iso: '',
      timestamp: 0
    }
  }
  
  // Use UTC methods to ensure consistency across server/client
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth()
  const day = d.getUTCDate()
  
  // Create a consistent date format that doesn't depend on locale
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  
  return {
    // Static format that's identical on server and client
    absolute: `${months[month]} ${day}, ${year}`,
    // Placeholder for SSR - will be enhanced on client
    relative: 'Click to see relative time',
    // ISO string for consistent sorting/comparison
    iso: d.toISOString(),
    // Timestamp for calculations
    timestamp: d.getTime()
  }
}

/**
 * Hook for progressive enhancement of date display
 * Adds relative time formatting after hydration
 */
export function useProgressiveDateDisplay(date: Date | string, config: Partial<DateDisplayConfig> = {}) {
  const [isClient, setIsClient] = useState(false)
  const [relativeTime, setRelativeTime] = useState<string>('')
  
  const defaultConfig: DateDisplayConfig = {
    showRelativeTime: true,
    useStaticFormatting: true,
    enableClientEnhancements: true,
    ...config
  }
  
  const staticDisplay = getStaticDateDisplay(date)
  
  useEffect(() => {
    setIsClient(true)
    
    if (defaultConfig.enableClientEnhancements && defaultConfig.showRelativeTime) {
      // Calculate relative time on client side only
      const now = new Date()
      const targetDate = new Date(date)
      const diffInMs = now.getTime() - targetDate.getTime()
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
      
      let relative = ''
      if (diffInDays === 0) {
        relative = 'Today'
      } else if (diffInDays === 1) {
        relative = 'Yesterday'
      } else if (diffInDays < 7) {
        relative = `${diffInDays} days ago`
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7)
        relative = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
      } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30)
        relative = months === 1 ? '1 month ago' : `${months} months ago`
      } else {
        const years = Math.floor(diffInDays / 365)
        relative = years === 1 ? '1 year ago' : `${years} years ago`
      }
      
      setRelativeTime(relative)
    }
  }, [date, defaultConfig.enableClientEnhancements, defaultConfig.showRelativeTime])
  
  return {
    // Always available static format
    absolute: staticDisplay.absolute,
    // Client-enhanced relative time
    relative: isClient && relativeTime ? relativeTime : staticDisplay.relative,
    // Whether client enhancements are loaded
    isEnhanced: isClient,
    // Raw data for custom formatting
    iso: staticDisplay.iso,
    timestamp: staticDisplay.timestamp
  }
}

/**
 * Simple static date formatter for SSR compatibility
 * Use this when you don't need progressive enhancement
 */
export function formatDateForSSR(date: Date | string): string {
  return getStaticDateDisplay(date).absolute
}

/**
 * Validation function to detect potential hydration issues in date formatting
 * Use in development to catch problematic patterns
 */
export function validateDateFormatting(date: Date | string): {
  isHydrationSafe: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  try {
    const d = new Date(date)
    
    if (isNaN(d.getTime())) {
      issues.push('Invalid date provided')
    }
    
    // Check if using locale-dependent methods that could cause hydration issues
    const staticDisplay = getStaticDateDisplay(date)
    const localeDisplay = d.toLocaleDateString()
    
    // This is just a warning - locale methods can still be used with proper hydration handling
    if (staticDisplay.absolute !== localeDisplay) {
      issues.push('Date formatting may differ between server and client due to locale differences')
    }
    
  } catch (error) {
    issues.push(`Date formatting error: ${error}`)
  }
  
  return {
    isHydrationSafe: issues.length === 0,
    issues
  }
}