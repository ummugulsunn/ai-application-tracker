'use client'

import { useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence, MotionProps } from 'framer-motion'

// Hook to safely enable animations after hydration
export const useHydrationSafeAnimation = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(false)

  useEffect(() => {
    // Enable animations after hydration to prevent mismatches
    setAnimationsEnabled(true)
  }, [])

  return animationsEnabled
}

// Hydration-safe motion component
interface HydrationSafeMotionProps extends MotionProps {
  children?: ReactNode
  fallback?: ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
  onClick?: (event: React.MouseEvent) => void
  onMouseEnter?: (event: React.MouseEvent) => void
  onMouseLeave?: (event: React.MouseEvent) => void
}

export function HydrationSafeMotion({ 
  children, 
  fallback, 
  as = 'div',
  ...motionProps 
}: HydrationSafeMotionProps) {
  const animationsEnabled = useHydrationSafeAnimation()

  if (!animationsEnabled) {
    // Render static version during SSR and initial hydration
    const Component = as
    const staticProps = {
      className: motionProps.className,
      style: motionProps.style,
      onClick: motionProps.onClick,
      onMouseEnter: motionProps.onMouseEnter,
      onMouseLeave: motionProps.onMouseLeave,
    }
    
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Component {...staticProps}>
        {children}
      </Component>
    )
  }

  // Render animated version after hydration
  const MotionComponent = (motion as any)[as]
  return (
    <MotionComponent {...motionProps}>
      {children}
    </MotionComponent>
  )
}

// Hydration-safe AnimatePresence wrapper
interface HydrationSafeAnimatePresenceProps {
  children: ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
  initial?: boolean
  onExitComplete?: () => void
}

export function HydrationSafeAnimatePresence({ 
  children, 
  mode,
  initial = true,
  onExitComplete 
}: HydrationSafeAnimatePresenceProps) {
  const animationsEnabled = useHydrationSafeAnimation()

  if (!animationsEnabled) {
    // Render children directly without animation during SSR/hydration
    return <>{children}</>
  }

  // Render with animations after hydration
  return (
    <AnimatePresence 
      mode={mode} 
      initial={initial}
      onExitComplete={onExitComplete}
    >
      {children}
    </AnimatePresence>
  )
}

// Utility function to conditionally apply animation classes
export const conditionalAnimationClass = (enabled: boolean, animationClass: string) => {
  return enabled ? animationClass : ''
}

// Predefined animation variants that are hydration-safe
export const hydrationSafeVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  },
  slideInFromLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  },
  slideInFromRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  }
}

// Component for hydration-safe loading animations
export function HydrationSafeSpinner({ 
  className = "w-6 h-6", 
  color = "text-primary-600" 
}: { 
  className?: string
  color?: string 
}) {
  const animationsEnabled = useHydrationSafeAnimation()
  
  return (
    <div 
      className={`${className} ${color} ${animationsEnabled ? 'animate-spin' : ''} rounded-full border-2 border-current border-t-transparent`}
      role="status"
      aria-label="Loading"
    />
  )
}

// Component for hydration-safe progress bars
export function HydrationSafeProgressBar({ 
  progress, 
  className = "w-full bg-gray-200 rounded-full h-2",
  barClassName = "bg-primary-600 h-2 rounded-full"
}: { 
  progress: number
  className?: string
  barClassName?: string
}) {
  const animationsEnabled = useHydrationSafeAnimation()
  
  return (
    <div className={className}>
      <div
        className={`${barClassName} ${animationsEnabled ? 'transition-all duration-300 ease-out' : ''}`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}