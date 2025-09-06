'use client'

import { ErrorBoundary } from './ErrorBoundary'
import { errorBoundaryHandler } from '@/lib/errorHandling'

interface ClientErrorBoundaryProps {
  children: React.ReactNode
}

export function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return (
    <ErrorBoundary onError={errorBoundaryHandler}>
      {children}
    </ErrorBoundary>
  )
}