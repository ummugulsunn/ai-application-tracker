# Hydration Error Boundary

## Overview

The `HydrationErrorBoundary` component is a specialized React error boundary designed to catch and handle hydration-related errors in Next.js applications. It provides enhanced error detection, logging, and recovery options specifically for hydration mismatches.

## Features

- **Hydration Error Detection**: Automatically detects hydration-related errors vs general React errors
- **Enhanced Logging**: Provides detailed logging with hydration-specific context and debugging tips
- **Retry Mechanism**: Implements exponential backoff retry functionality with attempt limits
- **Fallback UI**: Shows user-friendly error messages with recovery options
- **Error Reporting**: Stores error reports in localStorage for debugging
- **Progressive Enhancement**: Graceful degradation when hydration fails

## Usage

### Basic Usage

```tsx
import { HydrationErrorBoundary } from '@/components/HydrationErrorBoundary'

function MyApp() {
  return (
    <HydrationErrorBoundary>
      <MyComponent />
    </HydrationErrorBoundary>
  )
}
```

### With Custom Fallback

```tsx
import { HydrationErrorBoundary } from '@/components/HydrationErrorBoundary'

function CustomFallback() {
  return <div>Something went wrong. Please refresh the page.</div>
}

function MyApp() {
  return (
    <HydrationErrorBoundary fallback={<CustomFallback />}>
      <MyComponent />
    </HydrationErrorBoundary>
  )
}
```

### With Error Handler

```tsx
import { HydrationErrorBoundary } from '@/components/HydrationErrorBoundary'

function MyApp() {
  const handleHydrationError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Custom hydration error handler:', error)
    // Send to monitoring service
  }

  return (
    <HydrationErrorBoundary onHydrationError={handleHydrationError}>
      <MyComponent />
    </HydrationErrorBoundary>
  )
}
```

### Using the Hook

```tsx
import { useHydrationErrorHandler } from '@/components/HydrationErrorBoundary'

function MyComponent() {
  const { handleHydrationError } = useHydrationErrorHandler()

  const handleSomeOperation = () => {
    try {
      // Some operation that might cause hydration issues
      performOperation()
    } catch (error) {
      handleHydrationError(error as Error, 'MyComponent.handleSomeOperation')
    }
  }

  return <button onClick={handleSomeOperation}>Do Something</button>
}
```

### Higher-Order Component

```tsx
import { withHydrationErrorBoundary } from '@/components/HydrationErrorBoundary'

const MyComponent = () => <div>My Component</div>

export default withHydrationErrorBoundary(MyComponent)
```

## Error Detection

The error boundary automatically detects hydration-related errors by looking for specific keywords in error messages:

- `hydration`
- `server-rendered html`
- `text content does not match`
- `expected server html`
- And more...

When a hydration error is detected, it shows specialized UI with:
- Hydration-specific error message
- Tips for resolving hydration issues
- Retry functionality with exponential backoff
- Enhanced logging with debugging context

## Recovery Options

The error boundary provides several recovery options:

1. **Retry**: Attempts to recover from the error with exponential backoff (up to 3 attempts)
2. **Reload Page**: Refreshes the entire page
3. **Go Home**: Navigates to the home page
4. **Copy Error Details**: Copies error information to clipboard for debugging

## Error Reporting

Errors are automatically stored in localStorage for debugging:

```tsx
import { getHydrationErrorReports, clearHydrationErrorReports } from '@/components/HydrationErrorBoundary'

// Get error reports
const reports = getHydrationErrorReports()

// Clear error reports
clearHydrationErrorReports()
```

## Integration with ApplicationTable

The `ApplicationTable` component is wrapped with `HydrationErrorBoundary` to handle potential hydration issues:

```tsx
// ApplicationTable is automatically wrapped
import ApplicationTable from '@/components/ApplicationTable'

function Dashboard() {
  return <ApplicationTable />
}
```

## Best Practices

1. **Wrap High-Level Components**: Place error boundaries at strategic points in your component tree
2. **Provide Custom Fallbacks**: Create meaningful fallback UI for your specific use cases
3. **Monitor Error Reports**: Regularly check stored error reports to identify patterns
4. **Handle Errors Gracefully**: Use the hook to handle errors in specific operations
5. **Test Error Scenarios**: Write tests to ensure error boundaries work correctly

## Common Hydration Issues

The error boundary helps with these common hydration problems:

- **Date/Time Formatting**: Different server/client timezone handling
- **Conditional Rendering**: Different content between server and client
- **Browser APIs**: Using browser-only APIs during SSR
- **Dynamic Content**: Content that changes between renders
- **Animation States**: Different animation states on server vs client

## Debugging

When hydration errors occur, check:

1. **Console Logs**: Enhanced logging provides debugging tips
2. **Error Reports**: Check localStorage for detailed error information
3. **Component Stack**: Review the component stack trace
4. **Hydration Context**: Look at the additional context provided

## Testing

The error boundary includes comprehensive tests covering:

- Error detection and classification
- Retry functionality
- Fallback UI rendering
- Error reporting and storage
- Recovery actions
- Hook functionality

Run tests with:
```bash
npm test -- --testPathPatterns="HydrationErrorBoundary"
```