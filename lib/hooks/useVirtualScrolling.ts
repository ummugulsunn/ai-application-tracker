'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  scrollingDelay?: number
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number
    start: number
    end: number
    item: T
  }>
  totalHeight: number
  scrollElementRef: React.RefObject<HTMLDivElement>
  scrollToIndex: (index: number) => void
  isScrolling: boolean
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150
  } = options

  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>()

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount, items.length - 1)

    // Add overscan
    const startWithOverscan = Math.max(0, start - overscan)
    const endWithOverscan = Math.min(items.length - 1, end + overscan)

    const visible = []
    for (let i = startWithOverscan; i <= endWithOverscan; i++) {
      const item = items[i]
      if (item !== undefined) {
        visible.push({
          index: i,
          start: i * itemHeight,
          end: (i + 1) * itemHeight,
          item
        })
      }
    }

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      visibleItems: visible
    }
  }, [scrollTop, itemHeight, containerHeight, items, overscan])

  // Handle scroll events
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
    setIsScrolling(true)

    // Clear existing timeout
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current)
    }

    // Set scrolling to false after delay
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, scrollingDelay)
  }, [scrollingDelay])

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight
      scrollElementRef.current.scrollTop = scrollTop
    }
  }, [itemHeight])

  // Set up scroll listener
  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current)
      }
    }
  }, [handleScroll])

  const totalHeight = items.length * itemHeight

  return {
    virtualItems: visibleItems,
    totalHeight,
    scrollElementRef,
    scrollToIndex,
    isScrolling
  }
}

// Hook for pagination with virtual scrolling
interface PaginationOptions {
  pageSize: number
  initialPage?: number
}

interface PaginationResult<T> {
  currentPage: number
  totalPages: number
  paginatedItems: T[]
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
  startIndex: number
  endIndex: number
}

export function usePagination<T>(
  items: T[],
  options: PaginationOptions
): PaginationResult<T> {
  const { pageSize, initialPage = 1 } = options
  const [currentPage, setCurrentPage] = useState(initialPage)

  const totalPages = Math.ceil(items.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, items.length)
  const paginatedItems = items.slice(startIndex, endIndex)

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1

  // Reset to first page when items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex
  }
}

// Combined hook for virtual scrolling with pagination
export function useVirtualPagination<T>(
  items: T[],
  virtualOptions: VirtualScrollOptions,
  paginationOptions: PaginationOptions
) {
  const pagination = usePagination(items, paginationOptions)
  const virtualScroll = useVirtualScrolling(pagination.paginatedItems, virtualOptions)

  return {
    ...pagination,
    ...virtualScroll,
    // Override virtualItems to include global indices
    virtualItems: virtualScroll.virtualItems.map(item => ({
      ...item,
      globalIndex: pagination.startIndex + item.index,
      item: item.item
    }))
  }
}

// Hook for infinite scrolling
interface InfiniteScrollOptions {
  threshold?: number
  hasMore: boolean
  isLoading: boolean
}

export function useInfiniteScroll(
  loadMore: () => void,
  options: InfiniteScrollOptions
) {
  const { threshold = 100, hasMore, isLoading } = options
  const [isFetching, setIsFetching] = useState(false)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    const element = scrollElementRef.current
    if (!element || isLoading || isFetching || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = element
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight

    if (distanceFromBottom < threshold) {
      setIsFetching(true)
      loadMore()
    }
  }, [loadMore, threshold, hasMore, isLoading, isFetching])

  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (!isLoading) {
      setIsFetching(false)
    }
  }, [isLoading])

  return { scrollElementRef, isFetching }
}

// Performance monitoring hook
export function useScrollPerformance() {
  const [metrics, setMetrics] = useState({
    fps: 0,
    scrollEvents: 0,
    averageFrameTime: 0
  })

  const frameTimesRef = useRef<number[]>([])
  const scrollCountRef = useRef(0)
  const lastFrameTimeRef = useRef(performance.now())

  const measureFrame = useCallback(() => {
    const now = performance.now()
    const frameTime = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    frameTimesRef.current.push(frameTime)
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift()
    }

    const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
    const fps = Math.round(1000 / averageFrameTime)

    setMetrics({
      fps,
      scrollEvents: scrollCountRef.current,
      averageFrameTime: Math.round(averageFrameTime * 100) / 100
    })

    requestAnimationFrame(measureFrame)
  }, [])

  const trackScroll = useCallback(() => {
    scrollCountRef.current++
  }, [])

  useEffect(() => {
    requestAnimationFrame(measureFrame)
  }, [measureFrame])

  return { metrics, trackScroll }
}