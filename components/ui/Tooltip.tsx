'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  disabled?: boolean
  maxWidth?: string
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 500,
  className,
  disabled = false,
  maxWidth = 'max-w-xs'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const showTooltip = () => {
    if (disabled) return
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const scrollX = window.pageXOffset
        const scrollY = window.pageYOffset
        
        let x = 0
        let y = 0
        
        switch (placement) {
          case 'top':
            x = rect.left + scrollX + rect.width / 2
            y = rect.top + scrollY - 8
            break
          case 'bottom':
            x = rect.left + scrollX + rect.width / 2
            y = rect.bottom + scrollY + 8
            break
          case 'left':
            x = rect.left + scrollX - 8
            y = rect.top + scrollY + rect.height / 2
            break
          case 'right':
            x = rect.right + scrollX + 8
            y = rect.top + scrollY + rect.height / 2
            break
        }
        
        setPosition({ x, y })
        setIsVisible(true)
      }
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getTransformOrigin = () => {
    switch (placement) {
      case 'top':
        return 'bottom center'
      case 'bottom':
        return 'top center'
      case 'left':
        return 'right center'
      case 'right':
        return 'left center'
      default:
        return 'bottom center'
    }
  }

  const getTranslateClasses = () => {
    switch (placement) {
      case 'top':
        return '-translate-x-1/2 -translate-y-full'
      case 'bottom':
        return '-translate-x-1/2'
      case 'left':
        return '-translate-x-full -translate-y-1/2'
      case 'right':
        return '-translate-y-1/2'
      default:
        return '-translate-x-1/2 -translate-y-full'
    }
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      {typeof window !== 'undefined' && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none',
                maxWidth,
                getTranslateClasses(),
                className
              )}
              style={{
                left: position.x,
                top: position.y,
                transformOrigin: getTransformOrigin()
              }}
            >
              {content}
              
              {/* Arrow */}
              <div
                className={cn(
                  'absolute w-2 h-2 bg-gray-900 transform rotate-45',
                  placement === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
                  placement === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
                  placement === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2',
                  placement === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2'
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}