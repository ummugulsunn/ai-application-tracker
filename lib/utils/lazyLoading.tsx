'use client'

import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react'
import { LoadingSpinner, Skeleton } from '@/components/ui/LoadingStates'

// Generic lazy loading wrapper with error boundary
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn)
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Specific lazy loading components for common UI patterns
export const LazyModalWrapper = ({ 
  children, 
  isLoading = false 
}: { 
  children: ReactNode
  isLoading?: boolean 
}) => (
  <Suspense fallback={
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  }>
    {children}
  </Suspense>
)

export const LazyDashboardSection = ({ 
  children, 
  title 
}: { 
  children: ReactNode
  title?: string 
}) => (
  <Suspense fallback={
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-4">
        {title && <Skeleton className="h-6 w-48" />}
        <Skeleton className="h-32 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  }>
    {children}
  </Suspense>
)

export const LazyTableSection = ({ 
  children 
}: { 
  children: ReactNode 
}) => (
  <Suspense fallback={
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  }>
    {children}
  </Suspense>
)

// Intersection Observer based lazy loading for components
export function useLazyLoad(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<Element | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(ref)
        }
      },
      { threshold }
    )

    observer.observe(ref)

    return () => {
      if (ref) observer.unobserve(ref)
    }
  }, [ref, threshold])

  return { isVisible, ref: setRef }
}

// Component that only renders when visible
export function LazyOnVisible({ 
  children, 
  fallback, 
  threshold = 0.1,
  className = ''
}: {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  className?: string
}) {
  const { isVisible, ref } = useLazyLoad(threshold)

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <Skeleton className="h-32 w-full" />)}
    </div>
  )
}

// Preload components for better UX
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  // Preload on hover or focus
  const preload = () => {
    importFn().catch(console.error)
  }

  return { preload }
}

// Hook for preloading on user interaction
export function usePreloadOnInteraction<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const { preload } = preloadComponent(importFn)

  const handleMouseEnter = () => preload()
  const handleFocus = () => preload()

  return {
    onMouseEnter: handleMouseEnter,
    onFocus: handleFocus
  }
}