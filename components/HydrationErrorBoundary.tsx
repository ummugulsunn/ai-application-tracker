'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Zap, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onHydrationError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasHydrationError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
  isHydrationMismatch: boolean
}

/**
 * Specialized error boundary for catching and handling hydration-related errors
 * Provides specific fallback UI and logging for hydration mismatches
 */
export class HydrationErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasHydrationError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isHydrationMismatch: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isHydrationMismatch = HydrationErrorBoundary.isHydrationError(error)
    
    return {
      hasHydrationError: true,
      error,
      errorId: crypto.randomUUID(),
      isHydrationMismatch,
    }
  }

  /**
   * Detect if an error is related to hydration mismatches
   */
  public static isHydrationError(error: Error): boolean {
    const hydrationKeywords = [
      'hydration',
      'server-rendered html',
      'client-side rendering',
      'mismatch',
      'suppresshydrationwarning',
      'expected server html',
      'text content does not match',
      'prop `children` did not match',
      'warning: text content did not match',
      'warning: expected server html',
    ]

    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''

    return hydrationKeywords.some(keyword => 
      errorMessage.includes(keyword) || 
      errorStack.includes(keyword)
    )
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Enhanced logging for hydration errors
    this.logHydrationError(error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onHydrationError) {
      this.props.onHydrationError(error, errorInfo)
    }

    // Report to monitoring service
    this.reportHydrationError(error, errorInfo)
  }

  /**
   * Enhanced logging specifically for hydration errors
   */
  private logHydrationError = (error: Error, errorInfo: ErrorInfo) => {
    const isHydrationError = HydrationErrorBoundary.isHydrationError(error)
    
    console.group('🚨 Hydration Error Boundary')
    console.error('Error Type:', isHydrationError ? 'Hydration Mismatch' : 'General React Error')
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error ID:', this.state.errorId)
    console.error('Retry Count:', this.retryCount)
    
    if (isHydrationError) {
      console.warn('💡 Hydration Error Tips:')
      console.warn('- Check for differences between server and client rendering')
      console.warn('- Look for time-sensitive content (dates, timestamps)')
      console.warn('- Verify browser-only APIs are properly guarded')
      console.warn('- Ensure consistent data between server and client')
    }
    
    console.groupEnd()
  }

  /**
   * Report hydration errors to monitoring service with enhanced context
   */
  private reportHydrationError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const hydrationErrorReport = {
        type: 'hydration_error',
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        isHydrationMismatch: this.state.isHydrationMismatch,
        retryCount: this.retryCount,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        // Additional hydration-specific context
        hydrationContext: {
          hasLocalStorage: typeof localStorage !== 'undefined',
          hasSessionStorage: typeof sessionStorage !== 'undefined',
          cookiesEnabled: navigator.cookieEnabled,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
        },
      }

      // Store in localStorage for debugging
      const hydrationErrors = JSON.parse(localStorage.getItem('hydration_errors') || '[]')
      hydrationErrors.push(hydrationErrorReport)
      
      // Keep only last 5 hydration errors
      if (hydrationErrors.length > 5) {
        hydrationErrors.splice(0, hydrationErrors.length - 5)
      }
      
      localStorage.setItem('hydration_errors', JSON.stringify(hydrationErrors))

      // Also store in general error log
      const allErrors = JSON.parse(localStorage.getItem('app_errors') || '[]')
      allErrors.push(hydrationErrorReport)
      if (allErrors.length > 10) {
        allErrors.splice(0, allErrors.length - 10)
      }
      localStorage.setItem('app_errors', JSON.stringify(allErrors))

    } catch (reportingError) {
      console.error('Failed to report hydration error:', reportingError)
    }
  }

  /**
   * Retry with exponential backoff for hydration errors
   */
  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      
      // Add small delay to allow any pending operations to complete
      setTimeout(() => {
        this.setState({
          hasHydrationError: false,
          error: null,
          errorInfo: null,
          errorId: null,
          isHydrationMismatch: false,
        })
      }, 100 * this.retryCount) // Exponential backoff: 100ms, 200ms, 300ms
    } else {
      // Max retries reached, reload the page
      this.handleReload()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyHydrationDetails = () => {
    const hydrationDetails = {
      errorId: this.state.errorId,
      type: 'hydration_error',
      isHydrationMismatch: this.state.isHydrationMismatch,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    navigator.clipboard.writeText(JSON.stringify(hydrationDetails, null, 2))
      .then(() => {
        alert('Hydration error details copied to clipboard')
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = JSON.stringify(hydrationDetails, null, 2)
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Hydration error details copied to clipboard')
      })
  }

  override render() {
    if (this.state.hasHydrationError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Specialized hydration error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  {this.state.isHydrationMismatch ? (
                    <Zap className="h-6 w-6 text-red-600" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                  )}
                </div>
                
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  {this.state.isHydrationMismatch 
                    ? 'Hydration Error Detected' 
                    : 'Application Error'
                  }
                </h2>
                
                <p className="mt-2 text-sm text-gray-600">
                  {this.state.isHydrationMismatch
                    ? 'There was a mismatch between server and client rendering. This usually resolves automatically.'
                    : 'Something unexpected happened. Please try one of the options below.'
                  }
                </p>
                
                {this.state.errorId && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-xs text-gray-500">
                      Error ID: <code className="font-mono">{this.state.errorId}</code>
                    </p>
                    {this.retryCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Retry attempts: {this.retryCount}/{this.maxRetries}
                      </p>
                    )}
                  </div>
                )}

                {this.state.isHydrationMismatch && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      💡 This is likely a temporary issue that will resolve on retry.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {this.retryCount < this.maxRetries ? (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Try again"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-500 mb-3">
                    Maximum retry attempts reached
                  </div>
                )}

                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Reload page"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Go to homepage"
                >
                  <Zap className="w-4 h-4 mr-2" aria-hidden="true" />
                  Go Home
                </button>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  onClick={this.copyHydrationDetails}
                  className="w-full flex justify-center items-center px-4 py-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Copy hydration error details for support"
                >
                  <Bug className="w-3 h-3 mr-1" aria-hidden="true" />
                  Copy Hydration Error Details
                </button>
                <p className="mt-2 text-xs text-gray-400 text-center">
                  If the problem persists, please copy the error details and contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook for handling hydration errors in functional components
 */
export const useHydrationErrorHandler = () => {
  const handleHydrationError = (error: Error, context?: string) => {
    const isHydrationError = HydrationErrorBoundary.isHydrationError(error)
    
    console.error(`Hydration error in ${context || 'component'}:`, error)
    
    // Report hydration error with additional context
    try {
      const errorReport = {
        type: 'hydration_error_hook',
        message: error.message,
        stack: error.stack,
        context,
        isHydrationError,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }

      const errors = JSON.parse(localStorage.getItem('hydration_errors') || '[]')
      errors.push(errorReport)
      if (errors.length > 5) {
        errors.splice(0, errors.length - 5)
      }
      localStorage.setItem('hydration_errors', JSON.stringify(errors))
    } catch (reportingError) {
      console.error('Failed to report hydration error:', reportingError)
    }
  }

  return { handleHydrationError }
}

/**
 * Higher-order component for wrapping components with hydration error boundaries
 */
export const withHydrationErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onHydrationError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <HydrationErrorBoundary fallback={fallback} onHydrationError={onHydrationError}>
      <Component {...props} />
    </HydrationErrorBoundary>
  )

  WrappedComponent.displayName = `withHydrationErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

/**
 * Utility function to get hydration error reports for debugging
 */
export const getHydrationErrorReports = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('hydration_errors') || '[]')
  } catch {
    return []
  }
}

/**
 * Utility function to clear hydration error reports
 */
export const clearHydrationErrorReports = (): void => {
  try {
    localStorage.removeItem('hydration_errors')
  } catch (error) {
    console.error('Failed to clear hydration error reports:', error)
  }
}