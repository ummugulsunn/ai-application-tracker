'use client'

import { useEffect, useState } from 'react'
import { useScrollPerformance } from '@/lib/hooks/useVirtualScrolling'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  connectionType: string
  isLowEndDevice: boolean
}

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const { metrics: scrollMetrics } = useScrollPerformance()

  useEffect(() => {
    // Measure initial load performance
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.fetchStart
      const renderTime = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart

      // Detect device capabilities
      const isLowEndDevice = detectLowEndDevice()
      const connectionType = getConnectionType()

      // Memory usage (if available)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize

      setMetrics({
        loadTime,
        renderTime,
        memoryUsage,
        connectionType,
        isLowEndDevice
      })
    }

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePerformance()
      return
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [])

  return { metrics, scrollMetrics }
}

function detectLowEndDevice(): boolean {
  // Check various indicators of device performance
  const checks = [
    // Memory check
    (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4,
    
    // CPU cores check
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2,
    
    // Connection check
    (navigator as any).connection && 
    ['slow-2g', '2g', '3g'].includes((navigator as any).connection.effectiveType),
    
    // User agent check for older devices
    /Android [1-6]/.test(navigator.userAgent),
    /iPhone OS [1-9]_/.test(navigator.userAgent)
  ]

  return checks.some(check => check)
}

function getConnectionType(): string {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    return connection.effectiveType || 'unknown'
  }
  return 'unknown'
}

// Performance optimization hook
export function usePerformanceOptimization() {
  const { metrics } = usePerformanceMonitoring()
  const [optimizations, setOptimizations] = useState({
    reduceAnimations: false,
    enableVirtualScrolling: false,
    reducedImageQuality: false,
    simplifiedUI: false
  })

  useEffect(() => {
    if (!metrics) return

    const newOptimizations = {
      reduceAnimations: metrics.isLowEndDevice || metrics.connectionType === 'slow-2g',
      enableVirtualScrolling: metrics.isLowEndDevice,
      reducedImageQuality: ['slow-2g', '2g'].includes(metrics.connectionType),
      simplifiedUI: metrics.isLowEndDevice && metrics.memoryUsage ? metrics.memoryUsage > 50000000 : false
    }

    setOptimizations(newOptimizations)

    // Apply CSS classes for performance optimizations
    const root = document.documentElement
    if (newOptimizations.reduceAnimations) {
      root.classList.add('reduce-motion')
    }
    if (newOptimizations.simplifiedUI) {
      root.classList.add('simplified-ui')
    }
  }, [metrics])

  return optimizations
}

// Performance monitoring component for development
export function PerformanceMonitor({ enabled = false }: { enabled?: boolean }) {
  const { metrics, scrollMetrics } = usePerformanceMonitoring()
  const optimizations = usePerformanceOptimization()

  if (!enabled || process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg font-mono z-50 max-w-xs">
      <div className="space-y-1">
        <div className="font-bold text-green-400">Performance Metrics</div>
        
        {metrics && (
          <>
            <div>Load: {Math.round(metrics.loadTime)}ms</div>
            <div>Render: {Math.round(metrics.renderTime)}ms</div>
            <div>Connection: {metrics.connectionType}</div>
            {metrics.memoryUsage && (
              <div>Memory: {Math.round(metrics.memoryUsage / 1024 / 1024)}MB</div>
            )}
            <div>Low-end: {metrics.isLowEndDevice ? 'Yes' : 'No'}</div>
          </>
        )}
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="font-bold text-blue-400">Scroll Performance</div>
          <div>FPS: {scrollMetrics.fps}</div>
          <div>Frame: {scrollMetrics.averageFrameTime}ms</div>
          <div>Events: {scrollMetrics.scrollEvents}</div>
        </div>
        
        <div className="border-t border-gray-600 pt-1 mt-2">
          <div className="font-bold text-yellow-400">Optimizations</div>
          <div>Animations: {optimizations.reduceAnimations ? 'Reduced' : 'Normal'}</div>
          <div>Scrolling: {optimizations.enableVirtualScrolling ? 'Virtual' : 'Normal'}</div>
          <div>Images: {optimizations.reducedImageQuality ? 'Reduced' : 'Normal'}</div>
          <div>UI: {optimizations.simplifiedUI ? 'Simplified' : 'Normal'}</div>
        </div>
      </div>
    </div>
  )
}

// Web Vitals monitoring
export function useWebVitals() {
  const [vitals, setVitals] = useState<Record<string, number>>({})

  useEffect(() => {
    // Use basic performance metrics instead of web-vitals for now
    const measureBasicVitals = () => {
      // Basic performance timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const lcp = navigation.loadEventEnd - navigation.fetchStart
        const fcp = navigation.domContentLoadedEventEnd - navigation.fetchStart
        const ttfb = navigation.responseStart - navigation.requestStart
        
        setVitals({
          CLS: 0, // Would need layout shift observer
          FID: 0, // Would need first input delay observer
          FCP: fcp,
          LCP: lcp,
          TTFB: ttfb
        })
      }
    }

    if (document.readyState === 'complete') {
      measureBasicVitals()
      return
    } else {
      window.addEventListener('load', measureBasicVitals)
      return () => window.removeEventListener('load', measureBasicVitals)
    }
  }, [])

  return vitals
}

// Resource loading optimization
export function preloadCriticalResources() {
  useEffect(() => {
    // Preload critical fonts
    const fontLink = document.createElement('link')
    fontLink.rel = 'preload'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
    fontLink.as = 'style'
    document.head.appendChild(fontLink)

    // Preload critical images
    const criticalImages = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ]

    criticalImages.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = src
      link.as = 'image'
      document.head.appendChild(link)
    })
  }, [])
}