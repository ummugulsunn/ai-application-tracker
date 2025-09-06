'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  offset?: { x: number; y: number }
  showSkip?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export interface GuidedTourProps {
  steps: TourStep[]
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  className?: string
}

export function GuidedTour({
  steps,
  isOpen,
  onClose,
  onComplete,
  className
}: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  useEffect(() => {
    if (!isOpen || !currentStepData) return

    const updatePositions = () => {
      try {
        const targetElement = document.querySelector(currentStepData.target) as HTMLElement
        if (!targetElement) {
          console.warn(`Tour target not found: ${currentStepData.target}`)
          return
        }

        const rect = targetElement.getBoundingClientRect()
        const scrollX = window.pageXOffset || 0
        const scrollY = window.pageYOffset || 0

        // Ensure we have valid dimensions
        if (rect.width === 0 && rect.height === 0) {
          console.warn(`Tour target has no dimensions: ${currentStepData.target}`)
          return
        }

        setTargetPosition({
          x: rect.left + scrollX,
          y: rect.top + scrollY,
          width: rect.width || 0,
          height: rect.height || 0
        })

        // Calculate tooltip position
        const placement = currentStepData?.placement || 'bottom'
        const offset = currentStepData?.offset || { x: 0, y: 0 }
        let tooltipX = 0
        let tooltipY = 0

        switch (placement) {
          case 'top':
            tooltipX = rect.left + scrollX + rect.width / 2 + offset.x
            tooltipY = rect.top + scrollY - 16 + offset.y
            break
          case 'bottom':
            tooltipX = rect.left + scrollX + rect.width / 2 + offset.x
            tooltipY = rect.bottom + scrollY + 16 + offset.y
            break
          case 'left':
            tooltipX = rect.left + scrollX - 16 + offset.x
            tooltipY = rect.top + scrollY + rect.height / 2 + offset.y
            break
          case 'right':
            tooltipX = rect.right + scrollX + 16 + offset.x
            tooltipY = rect.top + scrollY + rect.height / 2 + offset.y
            break
        }

        setTooltipPosition({ x: tooltipX, y: tooltipY })

        // Scroll element into view with error handling
        try {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          })
        } catch (scrollError) {
          console.warn('Error scrolling to target:', scrollError)
        }
      } catch (error) {
        console.error('Error updating tour positions:', error)
      }
    }

    // Add multiple attempts with increasing delays
    const timeoutIds: NodeJS.Timeout[] = []
    
    // Try immediately
    timeoutIds.push(setTimeout(updatePositions, 0))
    // Try after 100ms
    timeoutIds.push(setTimeout(updatePositions, 100))
    // Try after 500ms as fallback
    timeoutIds.push(setTimeout(updatePositions, 500))
    
    window.addEventListener('resize', updatePositions)
    window.addEventListener('scroll', updatePositions)

    return () => {
      timeoutIds.forEach(clearTimeout)
      window.removeEventListener('resize', updatePositions)
      window.removeEventListener('scroll', updatePositions)
    }
  }, [currentStep, currentStepData, isOpen])

  const nextStep = () => {
    if (isLastStep) {
      onComplete?.()
      onClose()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const skipTour = () => {
    onClose()
  }

  const getTooltipTransform = () => {
    const placement = currentStepData?.placement || 'bottom'
    switch (placement) {
      case 'top':
        return 'translate(-50%, -100%)'
      case 'bottom':
        return 'translate(-50%, 0%)'
      case 'left':
        return 'translate(-100%, -50%)'
      case 'right':
        return 'translate(0%, -50%)'
      default:
        return 'translate(-50%, 0%)'
    }
  }

  const getArrowClasses = () => {
    const placement = currentStepData?.placement || 'bottom'
    const baseClasses = 'absolute w-3 h-3 bg-white transform rotate-45 border'
    
    switch (placement) {
      case 'top':
        return `${baseClasses} bottom-[-6px] left-1/2 -translate-x-1/2 border-t-0 border-l-0`
      case 'bottom':
        return `${baseClasses} top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0`
      case 'left':
        return `${baseClasses} right-[-6px] top-1/2 -translate-y-1/2 border-l-0 border-b-0`
      case 'right':
        return `${baseClasses} left-[-6px] top-1/2 -translate-y-1/2 border-r-0 border-t-0`
      default:
        return `${baseClasses} top-[-6px] left-1/2 -translate-x-1/2 border-b-0 border-r-0`
    }
  }

  if (!isOpen || !currentStepData) return null

  // Check if target element exists before rendering
  if (typeof window === 'undefined') return null
  
  const targetElement = document.querySelector(currentStepData.target)
  if (!targetElement) {
    console.warn(`Tour target not found: ${currentStepData.target}`)
    // Show error message instead of auto-advancing
    return (
      <>
        {typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tour Step Not Available
              </h3>
              <p className="text-gray-600 mb-4">
                The element for this tour step is not currently visible. This might happen if the page hasn't fully loaded yet.
              </p>
              <div className="flex space-x-3">
                <Button onClick={nextStep} size="sm">
                  {isLastStep ? 'Finish Tour' : 'Skip This Step'}
                </Button>
                <Button onClick={onClose} variant="outline" size="sm">
                  Exit Tour
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  return (
    <>
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ pointerEvents: 'none' }}
          >
            {/* Overlay with spotlight effect */}
            <div className="absolute inset-0 bg-black bg-opacity-50">
              <div
                className="absolute bg-transparent border-4 border-primary-500 rounded-lg shadow-lg"
                style={{
                  left: targetPosition.x - 8,
                  top: targetPosition.y - 8,
                  width: targetPosition.width + 16,
                  height: targetPosition.height + 16,
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`
                }}
              />
            </div>

            {/* Tooltip */}
            <div
              className="absolute max-w-sm"
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                transform: getTooltipTransform(),
                pointerEvents: 'auto'
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'bg-white rounded-lg shadow-xl border border-gray-200 p-6 relative',
                  className
                )}
              >
                {/* Arrow */}
                <div className={getArrowClasses()} />

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {currentStepData.title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                    aria-label="Close tour"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {currentStepData.content}
                </p>

                {/* Action button if provided */}
                {currentStepData.action && (
                  <div className="mb-4">
                    <Button
                      onClick={currentStepData.action.onClick}
                      variant="outline"
                      size="sm"
                    >
                      {currentStepData.action.label}
                    </Button>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors duration-200',
                          index === currentStep ? 'bg-primary-500' : 'bg-gray-300'
                        )}
                      />
                    ))}
                    <span className="ml-2 text-xs text-gray-500">
                      {currentStep + 1} of {steps.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentStepData.showSkip !== false && (
                      <Button
                        onClick={skipTour}
                        variant="ghost"
                        size="sm"
                      >
                        Skip
                      </Button>
                    )}
                    
                    {!isFirstStep && (
                      <Button
                        onClick={prevStep}
                        variant="outline"
                        size="sm"
                        leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
                      >
                        Back
                      </Button>
                    )}
                    
                    <Button
                      onClick={nextStep}
                      size="sm"
                      rightIcon={!isLastStep ? <ChevronRightIcon className="h-4 w-4" /> : undefined}
                    >
                      {isLastStep ? 'Finish' : 'Next'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// Hook for managing tour state
export function useTour(tourKey: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem(`tour-completed-${tourKey}`)
    setHasCompleted(completed === 'true')
  }, [tourKey])

  const startTour = () => {
    setIsOpen(true)
  }

  const closeTour = () => {
    setIsOpen(false)
  }

  const completeTour = () => {
    setIsOpen(false)
    setHasCompleted(true)
    localStorage.setItem(`tour-completed-${tourKey}`, 'true')
  }

  const resetTour = () => {
    setHasCompleted(false)
    localStorage.removeItem(`tour-completed-${tourKey}`)
  }

  return {
    isOpen,
    hasCompleted,
    startTour,
    closeTour,
    completeTour,
    resetTour
  }
}