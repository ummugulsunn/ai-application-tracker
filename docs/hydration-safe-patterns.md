# Hydration-Safe Patterns Guide

This guide explains how to use the hydration-safe utilities to prevent hydration mismatches in your React components.

## Overview

Hydration errors occur when the server-rendered HTML doesn't match what React expects on the client side. This can happen due to:

- Different date/time formatting between server and client
- Conditional rendering based on client-only state
- Using browser APIs during server-side rendering
- Dynamic content that changes between renders

## Available Utilities

### Progressive Enhancement Hooks

#### `useProgressiveEnhancement()`

Safely enables client-only features after hydration is complete.

```tsx
import { useProgressiveEnhancement } from '@/lib/utils/hydrationUtils'

function MyComponent() {
  const { isClient, isHydrated, enableFeature } = useProgressiveEnhancement()
  
  return (
    <div>
      <p>Always rendered content</p>
      {isHydrated && <p>Client-enhanced content</p>}
    </div>
  )
}
```

#### `useBrowserAPI()`

Safely access browser APIs after hydration.

```tsx
import { useBrowserAPI } from '@/lib/utils/hydrationUtils'

function MyComponent() {
  const { isBrowser, window, localStorage } = useBrowserAPI()
  
  useEffect(() => {
    if (isBrowser && localStorage) {
      // Safe to use localStorage here
      const saved = localStorage.getItem('key')
    }
  }, [isBrowser, localStorage])
  
  return <div>Content</div>
}
```

#### `useHydrationSafeAnimation()`

Enable animations only after hydration to prevent DOM structure mismatches.

```tsx
import { useHydrationSafeAnimation } from '@/lib/utils/hydrationUtils'

function AnimatedComponent() {
  const { isAnimationEnabled } = useHydrationSafeAnimation()
  
  return (
    <div className={isAnimationEnabled ? 'animated' : ''}>
      Content with optional animations
    </div>
  )
}
```

### Date Formatting Utilities

#### `formatDateForSSR()`

Static date formatting that works identically on server and client.

```tsx
import { formatDateForSSR } from '@/lib/utils/hydrationUtils'

function DateDisplay({ date }: { date: string }) {
  return <time>{formatDateForSSR(date)}</time>
}
```

#### `useProgressiveDateDisplay()`

Progressive enhancement for date display with relative time.

```tsx
import { useProgressiveDateDisplay } from '@/lib/utils/hydrationUtils'

function EnhancedDateDisplay({ date }: { date: string }) {
  const { absolute, relative, isEnhanced } = useProgressiveDateDisplay(date)
  
  return (
    <div>
      <time>{absolute}</time>
      {isEnhanced && <span className="text-gray-500">({relative})</span>}
    </div>
  )
}
```

### Component Utilities

#### `ClientOnly`

Wrapper for client-only content with fallback.

```tsx
import { ClientOnly } from '@/lib/utils/hydrationUtils'

function MyComponent() {
  return (
    <div>
      <p>Server and client content</p>
      <ClientOnly fallback={<div>Loading...</div>}>
        <InteractiveWidget />
      </ClientOnly>
    </div>
  )
}
```

#### `createStableKey()`

Generate consistent React keys for list items.

```tsx
import { createStableKey } from '@/lib/utils/hydrationUtils'

function ItemList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <li key={createStableKey('item', item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  )
}
```

### Validation Utilities

#### `validateHydrationSafety()`

Check props for potential hydration issues.

```tsx
import { validateHydrationSafety } from '@/lib/utils/hydrationUtils'

function MyComponent(props: MyProps) {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateHydrationSafety(props)
    if (!validation.isHydrationSafe) {
      console.warn('Hydration issues:', validation.issues)
    }
  }
  
  return <div>Content</div>
}
```

#### `validateListKeys()`

Validate that list items have stable keys.

```tsx
import { validateListKeys } from '@/lib/utils/hydrationUtils'

function ItemList({ items }: { items: Item[] }) {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateListKeys(items)
    if (!validation.isValid) {
      console.warn('Key issues:', validation.issues)
    }
  }
  
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  )
}
```

#### `useHydrationMismatchDetector()`

Debug hydration mismatches during development.

```tsx
import { useHydrationMismatchDetector } from '@/lib/utils/hydrationUtils'

function MyComponent({ data }: { data: any }) {
  useHydrationMismatchDetector('MyComponent', { 
    dataLength: data.length,
    timestamp: Date.now() // This would cause a mismatch!
  })
  
  return <div>Content</div>
}
```

### Utility Functions

#### `safeGet()`

Safely access nested object properties.

```tsx
import { safeGet } from '@/lib/utils/hydrationUtils'

function UserProfile({ user }: { user: any }) {
  const name = safeGet(user, 'profile.name', 'Unknown')
  const email = safeGet(user, 'contact.email', 'No email')
  
  return (
    <div>
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  )
}
```

## Best Practices

### ✅ DO

1. **Use static formatting for SSR**
   ```tsx
   // Good: Static date formatting
   <time>{formatDateForSSR(date)}</time>
   ```

2. **Wrap client-only features**
   ```tsx
   // Good: Client-only wrapper
   <ClientOnly>
     <InteractiveChart />
   </ClientOnly>
   ```

3. **Use stable keys for lists**
   ```tsx
   // Good: Stable keys
   {items.map(item => (
     <div key={createStableKey('item', item.id)}>
       {item.name}
     </div>
   ))}
   ```

4. **Progressive enhancement**
   ```tsx
   // Good: Progressive enhancement
   const { isHydrated } = useProgressiveEnhancement()
   return (
     <div>
       <BasicContent />
       {isHydrated && <EnhancedFeatures />}
     </div>
   )
   ```

### ❌ DON'T

1. **Don't use time-sensitive formatting in SSR**
   ```tsx
   // Bad: Different results on server vs client
   <time>{new Date().toLocaleString()}</time>
   ```

2. **Don't conditionally render different structures**
   ```tsx
   // Bad: Different DOM structures
   {isClient ? (
     <div className="enhanced">Content</div>
   ) : (
     <span>Content</span>
   )}
   ```

3. **Don't use array indices as keys for dynamic lists**
   ```tsx
   // Bad: Unstable keys
   {items.map((item, index) => (
     <div key={index}>{item.name}</div>
   ))}
   ```

4. **Don't access browser APIs during render**
   ```tsx
   // Bad: Will cause SSR errors
   const userAgent = navigator.userAgent
   ```

## Common Patterns

### Date Display with Progressive Enhancement

```tsx
function DateDisplay({ date }: { date: string }) {
  const { absolute, relative, isEnhanced } = useProgressiveDateDisplay(date, {
    showRelativeTime: true,
    enableClientEnhancements: true
  })
  
  return (
    <div>
      <time dateTime={date}>{absolute}</time>
      {isEnhanced && (
        <span className="text-sm text-gray-500 ml-2">
          ({relative})
        </span>
      )}
    </div>
  )
}
```

### Animated List with Stable Keys

```tsx
function AnimatedList({ items }: { items: Item[] }) {
  const { isAnimationEnabled } = useHydrationSafeAnimation()
  
  return (
    <ul className={isAnimationEnabled ? 'animated-list' : 'static-list'}>
      {items.map(item => (
        <li 
          key={createStableKey('item', item.id)}
          className="list-item"
        >
          {item.name}
        </li>
      ))}
    </ul>
  )
}
```

### Client-Enhanced Component

```tsx
function EnhancedComponent({ data }: { data: any[] }) {
  const { isHydrated } = useProgressiveEnhancement()
  const { isBrowser, localStorage } = useBrowserAPI()
  
  // Safe to use browser APIs
  const savedPreferences = isBrowser && localStorage 
    ? JSON.parse(localStorage.getItem('preferences') || '{}')
    : {}
  
  return (
    <div>
      {/* Always rendered content */}
      <BasicDataView data={data} />
      
      {/* Client-enhanced features */}
      {isHydrated && (
        <ClientOnly>
          <InteractiveFeatures 
            data={data} 
            preferences={savedPreferences}
          />
        </ClientOnly>
      )}
    </div>
  )
}
```

## Testing Hydration Safety

Use the validation utilities in development to catch potential issues:

```tsx
function MyComponent(props: MyProps) {
  // Development-only validation
  if (process.env.NODE_ENV === 'development') {
    const validation = validateHydrationSafety(props)
    if (!validation.isHydrationSafe) {
      console.warn('Hydration safety issues in MyComponent:', validation.issues)
    }
  }
  
  // Use hydration mismatch detector
  useHydrationMismatchDetector('MyComponent', {
    propsCount: Object.keys(props).length,
    // Don't include time-sensitive values here!
  })
  
  return <div>Content</div>
}
```

## Migration Guide

If you have existing components with hydration issues:

1. **Identify the problem**: Use browser dev tools to see hydration warnings
2. **Wrap client-only code**: Use `ClientOnly` or `useProgressiveEnhancement`
3. **Fix date formatting**: Replace locale-dependent formatting with static alternatives
4. **Stabilize keys**: Ensure list keys are consistent between renders
5. **Test thoroughly**: Use the validation utilities to catch remaining issues

By following these patterns, you can eliminate hydration errors and create a smooth, consistent user experience across server and client rendering.