/**
 * Example component demonstrating hydration-safe patterns
 * This serves as a reference for implementing hydration-safe components
 */

import React from 'react'
import {
  useProgressiveEnhancement,
  useBrowserAPI,
  createStableKey,
  validateHydrationSafety,
  ClientOnly,
  useHydrationSafeAnimation,
  safeGet,
  validateListKeys,
  useHydrationMismatchDetector
} from '../utils/hydrationUtils'
import { useProgressiveDateDisplay, formatDateForSSR } from '../utils/dateFormatting'

interface ExampleItem {
  id: string
  name: string
  createdAt: string
  metadata?: {
    category?: string
    priority?: number
  }
}

interface HydrationSafeExampleProps {
  items: ExampleItem[]
  currentDate: string
  userPreferences?: {
    showAnimations: boolean
    showRelativeDates: boolean
  }
}

export function HydrationSafeExample({ 
  items, 
  currentDate, 
  userPreferences = { showAnimations: true, showRelativeDates: true }
}: HydrationSafeExampleProps) {
  // Validate props for hydration safety
  const validation = validateHydrationSafety({ items, currentDate, userPreferences })
  
  // Detect hydration mismatches in development
  useHydrationMismatchDetector('HydrationSafeExample', { 
    itemCount: items.length,
    currentDate 
  })

  // Progressive enhancement for client-only features
  const { isHydrated } = useProgressiveEnhancement()
  
  // Safe browser API access
  const { isBrowser, localStorage } = useBrowserAPI()
  
  // Hydration-safe animations
  const { isAnimationEnabled } = useHydrationSafeAnimation()
  
  // Progressive date display
  const dateDisplay = useProgressiveDateDisplay(currentDate, {
    showRelativeTime: userPreferences.showRelativeDates,
    enableClientEnhancements: isHydrated
  })

  // Validate list keys
  const keyValidation = validateListKeys(items)
  
  // Log validation issues in development
  if (process.env.NODE_ENV === 'development') {
    if (!validation.isHydrationSafe) {
      console.warn('Hydration safety issues:', validation.issues)
    }
    if (!keyValidation.isValid) {
      console.warn('List key issues:', keyValidation.issues)
    }
  }

  return (
    <div className="hydration-safe-example">
      {/* Static content that renders identically on server and client */}
      <header>
        <h1>Hydration-Safe Example</h1>
        <p>Current date: {dateDisplay.absolute}</p>
        
        {/* Client-enhanced relative time */}
        {dateDisplay.isEnhanced && (
          <p className="text-sm text-gray-600">
            ({dateDisplay.relative})
          </p>
        )}
      </header>

      {/* List with stable keys */}
      <ul className={`item-list ${isAnimationEnabled ? 'animated' : ''}`}>
        {items.map((item) => (
          <li 
            key={createStableKey('item', item.id)}
            className="item"
          >
            <div className="item-content">
              <h3>{item.name}</h3>
              
              {/* Safe nested property access */}
              <p>Category: {safeGet(item, 'metadata.category', 'Uncategorized')}</p>
              <p>Priority: {safeGet(item, 'metadata.priority', 0)}</p>
              
              {/* Static date formatting for SSR */}
              <time dateTime={item.createdAt}>
                {formatDateForSSR(item.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {/* Client-only features wrapped safely */}
      <ClientOnly fallback={<div>Loading enhanced features...</div>}>
        <div className="client-only-features">
          <h2>Client-Only Features</h2>
          
          {/* Browser API usage */}
          {isBrowser && localStorage && (
            <p>Local storage is available</p>
          )}
          
          {/* Progressive enhancement indicator */}
          <p>
            Enhancement status: {isHydrated ? 'Enhanced' : 'Basic'}
          </p>
          
          {/* Animation status */}
          <p>
            Animations: {isAnimationEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </ClientOnly>

      {/* Development-only validation info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="validation-info">
          <summary>Validation Info (Development Only)</summary>
          <div>
            <h4>Hydration Safety</h4>
            <p>Status: {validation.isHydrationSafe ? '✅ Safe' : '❌ Issues found'}</p>
            {validation.issues.length > 0 && (
              <ul>
                {validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
            
            <h4>List Keys</h4>
            <p>Status: {keyValidation.isValid ? '✅ Valid' : '❌ Issues found'}</p>
            {keyValidation.issues.length > 0 && (
              <ul>
                {keyValidation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

/**
 * Example of a problematic component that would cause hydration issues
 * DO NOT use these patterns in your components
 */
export function ProblematicExample({ items }: { items: ExampleItem[] }) {
  // ❌ BAD: Using Date.now() causes different values on server vs client
  const timestamp = Date.now()
  
  // ❌ BAD: Conditional rendering based on client-only state
  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => setIsClient(true), [])
  
  // ❌ BAD: Using browser APIs without guards
  const userAgent = navigator.userAgent
  
  return (
    <div>
      {/* ❌ BAD: Different content on server vs client */}
      {isClient ? (
        <p>Client timestamp: {timestamp}</p>
      ) : (
        <p>Server rendering...</p>
      )}
      
      {/* ❌ BAD: Browser-specific content */}
      <p>User agent: {userAgent}</p>
      
      {/* ❌ BAD: Using array index as keys */}
      {items.map((item, index) => (
        <div key={index}>
          {/* ❌ BAD: Time-sensitive formatting */}
          <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}

export default HydrationSafeExample