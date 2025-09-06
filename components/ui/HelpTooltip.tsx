'use client'

import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { Tooltip } from './Tooltip'
import { cn } from '@/lib/utils'

export interface HelpTooltipProps {
  content: string | React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconClassName?: string
  size?: 'sm' | 'md' | 'lg'
}

export function HelpTooltip({
  content,
  placement = 'top',
  className,
  iconClassName,
  size = 'sm'
}: HelpTooltipProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <Tooltip content={content} placement={placement} className={className}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-colors duration-200',
          className
        )}
        aria-label="Help information"
      >
        <QuestionMarkCircleIcon 
          className={cn(sizeClasses[size], iconClassName)} 
          aria-hidden="true"
        />
      </button>
    </Tooltip>
  )
}