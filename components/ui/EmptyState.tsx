'use client'

import { motion } from 'framer-motion'
import { Button } from './Button'
import { Card } from './Card'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
  illustration?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
  illustration
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-6',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
      spacing: 'space-y-3'
    },
    md: {
      container: 'py-12 px-8',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
      spacing: 'space-y-4'
    },
    lg: {
      container: 'py-16 px-12',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg',
      spacing: 'space-y-6'
    }
  }

  const classes = sizeClasses[size]

  return (
    <Card className={cn('text-center', classes.container, className)} hover={false}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={classes.spacing}
      >
        {/* Illustration or Icon */}
        {illustration ? (
          <div className="flex justify-center">
            {illustration}
          </div>
        ) : icon ? (
          <div className="flex justify-center">
            <div className={cn(
              'flex items-center justify-center rounded-full bg-gray-100 text-gray-400',
              classes.icon
            )}>
              {icon}
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className={classes.spacing}>
          <h3 className={cn('font-semibold text-gray-900', classes.title)}>
            {title}
          </h3>
          <p className={cn('text-gray-600 max-w-md mx-auto', classes.description)}>
            {description}
          </p>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <Button
                onClick={action.onClick}
                variant={action.variant || 'primary'}
                size={size}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                onClick={secondaryAction.onClick}
                variant={secondaryAction.variant || 'outline'}
                size={size}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </Card>
  )
}

// Predefined empty states for common scenarios
export function NoApplicationsEmptyState({ onAddNew, onImport }: { 
  onAddNew: () => void
  onImport: () => void 
}) {
  return (
    <EmptyState
      illustration={
        <div className="w-32 h-32 mx-auto mb-4">
          <svg viewBox="0 0 200 200" className="w-full h-full text-gray-300">
            <defs>
              <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect x="40" y="60" width="120" height="80" rx="8" fill="url(#emptyGradient)" />
            <rect x="50" y="70" width="100" height="4" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="50" y="80" width="80" height="4" rx="2" fill="currentColor" opacity="0.2" />
            <rect x="50" y="90" width="60" height="4" rx="2" fill="currentColor" opacity="0.2" />
            <circle cx="100" cy="40" r="15" fill="currentColor" opacity="0.2" />
            <path d="M90 35 L95 40 L110 25" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" />
          </svg>
        </div>
      }
      title="No applications yet"
      description="Start tracking your job applications to get insights and stay organized. Add your first application or import from a CSV file."
      action={{
        label: 'Add First Application',
        onClick: onAddNew
      }}
      secondaryAction={{
        label: 'Import from CSV',
        onClick: onImport,
        variant: 'outline'
      }}
      size="lg"
    />
  )
}

export function NoSearchResultsEmptyState({ 
  searchTerm, 
  onClearSearch 
}: { 
  searchTerm: string
  onClearSearch: () => void 
}) {
  return (
    <EmptyState
      illustration={
        <div className="w-24 h-24 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
            <circle cx="40" cy="40" r="25" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
            <path d="M60 60 L75 75" stroke="currentColor" strokeWidth="3" opacity="0.3" />
            <text x="50" y="45" textAnchor="middle" className="text-xs fill-current opacity-50">?</text>
          </svg>
        </div>
      }
      title="No results found"
      description={`No applications match "${searchTerm}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline'
      }}
      size="md"
    />
  )
}

export function ErrorEmptyState({ 
  title = "Something went wrong",
  description = "We encountered an error while loading your data. Please try again.",
  onRetry 
}: { 
  title?: string
  description?: string
  onRetry: () => void 
}) {
  return (
    <EmptyState
      illustration={
        <div className="w-24 h-24 mx-auto mb-4">
          <svg viewBox="0 0 100 100" className="w-full h-full text-danger-300">
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M35 35 L65 65 M65 35 L35 65" stroke="currentColor" strokeWidth="3" />
          </svg>
        </div>
      }
      title={title}
      description={description}
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary'
      }}
      size="md"
    />
  )
}