'use client'

import { useMemo, useState, useCallback } from 'react'
import { useVirtualScrolling, usePagination, useInfiniteScroll } from '@/lib/hooks/useVirtualScrolling'
import { LoadingSpinner, Skeleton } from './LoadingStates'
import { Button } from './Button'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Column<T> {
  key: keyof T | string
  header: string
  width?: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
}

interface VirtualTableProps<T> {
  data: T[]
  columns: Column<T>[]
  itemHeight?: number
  containerHeight?: number
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T, index: number) => void
  className?: string
  enableVirtualization?: boolean
  enablePagination?: boolean
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  itemHeight = 60,
  containerHeight = 400,
  pageSize = 50,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  enableVirtualization = true,
  enablePagination = false
}: VirtualTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  // Pagination
  const pagination = usePagination(sortedData, { pageSize })
  const displayData = enablePagination ? pagination.paginatedItems : sortedData

  // Virtual scrolling
  const virtualScroll = useVirtualScrolling(displayData, {
    itemHeight,
    containerHeight,
    overscan: 5
  })

  const handleSort = useCallback((key: keyof T | string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: 'asc' }
    })
  }, [])

  const renderCell = useCallback((column: Column<T>, item: T, index: number) => {
    if (column.render) {
      return column.render(item, index)
    }
    return item[column.key as keyof T]
  }, [])

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}>
                {columns.map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
        <div className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data</h3>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div 
          className="grid gap-4 p-4 font-medium text-gray-700"
          style={{ gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ') }}
        >
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={`flex items-center ${column.sortable ? 'cursor-pointer hover:text-gray-900' : ''}`}
              onClick={column.sortable ? () => handleSort(column.key) : undefined}
            >
              <span>{column.header}</span>
              {column.sortable && sortConfig?.key === column.key && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      {enableVirtualization ? (
        <div
          ref={virtualScroll.scrollElementRef}
          style={{ height: containerHeight, overflow: 'auto' }}
          className="relative"
        >
          <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
            {virtualScroll.virtualItems.map(({ index, start, item }) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  top: start,
                  left: 0,
                  right: 0,
                  height: itemHeight,
                  gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ')
                }}
                className={`grid gap-4 p-4 border-b border-gray-100 items-center hover:bg-gray-50 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
              >
                {columns.map((column) => (
                  <div key={String(column.key)} className="truncate">
                    {renderCell(column, item, index)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {displayData.map((item, index) => (
            <div
              key={index}
              className={`grid gap-4 p-4 items-center hover:bg-gray-50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              style={{
                gridTemplateColumns: columns.map(col => col.width || '1fr').join(' ')
              }}
              onClick={onRowClick ? () => onRowClick(item, index) : undefined}
            >
              {columns.map((column) => (
                <div key={String(column.key)} className="truncate">
                  {renderCell(column, item, index)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {pagination.startIndex + 1} to {pagination.endIndex} of {data.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.previousPage}
                disabled={!pagination.canGoPrevious}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={pagination.currentPage === page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => pagination.goToPage(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={pagination.nextPage}
                disabled={!pagination.canGoNext}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Infinite scroll table variant
interface InfiniteTableProps<T> extends Omit<VirtualTableProps<T>, 'enablePagination'> {
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export function InfiniteTable<T extends Record<string, any>>({
  hasMore,
  isLoadingMore,
  onLoadMore,
  ...props
}: InfiniteTableProps<T>) {
  const { scrollElementRef } = useInfiniteScroll(onLoadMore, {
    hasMore,
    isLoading: isLoadingMore,
    threshold: 100
  })

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${props.className || ''}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div 
          className="grid gap-4 p-4 font-medium text-gray-700"
          style={{ gridTemplateColumns: props.columns.map(col => col.width || '1fr').join(' ') }}
        >
          {props.columns.map((column) => (
            <div key={String(column.key)}>
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollElementRef}
        style={{ height: props.containerHeight || 400, overflow: 'auto' }}
        className="divide-y divide-gray-100"
      >
        {props.data.map((item, index) => (
          <div
            key={index}
            className={`grid gap-4 p-4 items-center hover:bg-gray-50 ${
              props.onRowClick ? 'cursor-pointer' : ''
            }`}
            style={{
              gridTemplateColumns: props.columns.map(col => col.width || '1fr').join(' ')
            }}
            onClick={props.onRowClick ? () => props.onRowClick!(item, index) : undefined}
          >
            {props.columns.map((column) => (
              <div key={String(column.key)} className="truncate">
                {column.render ? column.render(item, index) : item[column.key as keyof T]}
              </div>
            ))}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="p-4 text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-600">Loading more...</p>
          </div>
        )}
        
        {/* End message */}
        {!hasMore && props.data.length > 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No more items to load
          </div>
        )}
      </div>
    </div>
  )
}