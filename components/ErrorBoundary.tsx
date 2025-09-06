'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID(),
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Only access browser APIs on client side to prevent hydration issues
      if (typeof window === 'undefined') return

      // In a real app, you would send this to your error reporting service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      }

      // Store error locally for debugging (only on client)
      if (typeof localStorage !== 'undefined') {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
        errors.push(errorReport)
        // Keep only last 10 errors
        if (errors.length > 10) {
          errors.splice(0, errors.length - 10)
        }
        localStorage.setItem('app_errors', JSON.stringify(errors))
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private copyErrorDetails = () => {
    // Only execute on client side to prevent hydration issues
    if (typeof window === 'undefined') return

    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
        .then(() => {
          alert('Error details copied to clipboard')
        })
        .catch(() => {
          // Fallback for older browsers
          this.fallbackCopyToClipboard(JSON.stringify(errorDetails, null, 2))
        })
    } else {
      this.fallbackCopyToClipboard(JSON.stringify(errorDetails, null, 2))
    }
  }

  private fallbackCopyToClipboard = (text: string) => {
    if (typeof document === 'undefined') return

    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('Error details copied to clipboard')
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We're sorry, but something unexpected happened. Please try one of the options below.
                </p>
                
                {this.state.errorId && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-md">
                    <p className="text-xs text-gray-500">
                      Error ID: <code className="font-mono">{this.state.errorId}</code>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Try Again
                </button>

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
                  <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                  Go Home
                </button>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-4">
                <button
                  onClick={this.copyErrorDetails}
                  className="w-full flex justify-center items-center px-4 py-2 text-xs text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Copy error details for support"
                >
                  <Bug className="w-3 h-3 mr-1" aria-hidden="true" />
                  Copy Error Details
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

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error)
    
    // Report error (only on client side to prevent hydration issues)
    if (typeof window === 'undefined') return

    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      }

      if (typeof localStorage !== 'undefined') {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
        errors.push(errorReport)
        if (errors.length > 10) {
          errors.splice(0, errors.length - 10)
        }
        localStorage.setItem('app_errors', JSON.stringify(errors))
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  return { handleError }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}