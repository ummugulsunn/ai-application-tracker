'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { SkipToMain, HighContrastWrapper } from './AccessibilityWrapper'
import { cn } from '@/lib/utils'

export interface LayoutProps {
  children: ReactNode
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
  className?: string
  containerClassName?: string
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
}

export function Layout({
  children,
  header,
  sidebar,
  footer,
  className,
  containerClassName,
  sidebarOpen = false,
  onSidebarToggle
}: LayoutProps) {
  return (
    <HighContrastWrapper>
      <div className={cn('min-h-screen bg-gray-50', className)}>
        <SkipToMain />
        
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-40 bg-white shadow-sm">
            {header}
          </header>
        )}

        <div className="flex">
          {/* Sidebar */}
          {sidebar && (
            <>
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div
                  className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                  onClick={onSidebarToggle}
                  aria-hidden="true"
                />
              )}
              
              {/* Sidebar */}
              <motion.aside
                initial={false}
                animate={{
                  x: sidebarOpen ? 0 : '-100%'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={cn(
                  'fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform lg:translate-x-0 lg:static lg:inset-0',
                  'lg:block'
                )}
              >
                {sidebar}
              </motion.aside>
            </>
          )}

          {/* Main content */}
          <main
            id="main-content"
            className={cn(
              'flex-1 min-w-0',
              sidebar && 'lg:ml-0',
              containerClassName
            )}
          >
            <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        {footer && (
          <footer className="bg-white border-t border-gray-200">
            {footer}
          </footer>
        )}
      </div>
    </HighContrastWrapper>
  )
}

// Container component for consistent spacing
export function Container({
  children,
  size = 'default',
  className
}: {
  children: ReactNode
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'
  className?: string
}) {
  const sizeClasses = {
    sm: 'max-w-2xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-xl',
    xl: 'max-w-screen-2xl',
    full: 'max-w-none'
  }

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  )
}

// Section component with proper spacing
export function Section({
  children,
  className,
  ...props
}: {
  children: ReactNode
  className?: string
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-8 lg:py-12', className)} {...props}>
      {children}
    </section>
  )
}

// Grid component for responsive layouts
export function Grid({
  children,
  cols = 1,
  gap = 6,
  className
}: {
  children: ReactNode
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 2 | 4 | 6 | 8
  className?: string
}) {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  }

  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  }

  return (
    <div className={cn('grid', colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// Stack component for vertical layouts
export function Stack({
  children,
  spacing = 4,
  className
}: {
  children: ReactNode
  spacing?: 2 | 3 | 4 | 6 | 8
  className?: string
}) {
  const spacingClasses = {
    2: 'space-y-2',
    3: 'space-y-3',
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8'
  }

  return (
    <div className={cn('flex flex-col', spacingClasses[spacing], className)}>
      {children}
    </div>
  )
}