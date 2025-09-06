'use client'

import { useState } from 'react'
import { 
  HydrationSafeMotion, 
  HydrationSafeAnimatePresence, 
  hydrationSafeVariants,
  conditionalAnimationClass,
  useHydrationSafeAnimation
} from '@/lib/utils/hydrationSafeAnimation'
import { 
  CheckCircleIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  XMarkIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { useOnboardingStore } from '@/store/onboardingStore'
import { cn } from '@/lib/utils'

interface QuickStartTask {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  completed: boolean
  estimatedTime?: string
}

interface QuickStartProps {
  onAddApplication: () => void
  onImportCSV: () => void
  onStartTour: () => void
  className?: string
}

export function QuickStart({ 
  onAddApplication, 
  onImportCSV, 
  onStartTour,
  className 
}: QuickStartProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { steps, completeStep } = useOnboardingStore()

  const quickStartTasks = [
    {
      id: 'add-application',
      title: 'Add your first application',
      description: 'Start tracking by adding a job application manually with smart auto-completion',
      icon: PlusIcon,
      action: onAddApplication,
      completed: steps.find(s => s.id === 'add-application')?.completed || false,
      estimatedTime: '2 min'
    },
    {
      id: 'import-data',
      title: 'Import existing data',
      description: 'Upload a CSV file with your current applications using intelligent field mapping',
      icon: DocumentArrowUpIcon,
      action: onImportCSV,
      completed: false, // This will be handled by the import process
      estimatedTime: '5 min'
    },
    {
      id: 'explore-features',
      title: 'Take the interactive tour',
      description: 'Learn about analytics, AI insights, and smart automation features',
      icon: PlayIcon,
      action: onStartTour,
      completed: steps.find(s => s.id === 'explore-features')?.completed || false,
      estimatedTime: '3 min'
    },
    {
      id: 'view-analytics',
      title: 'Explore your dashboard',
      description: 'See patterns, insights, and success metrics from your applications',
      icon: ChartBarIcon,
      action: () => {
        completeStep('customize-experience')
        // This would navigate to analytics view
      },
      completed: steps.find(s => s.id === 'customize-experience')?.completed || false,
      estimatedTime: '2 min'
    }
  ]

  const completedTasks = quickStartTasks.filter(task => task.completed).length
  const totalTasks = quickStartTasks.length
  const progressPercentage = (completedTasks / totalTasks) * 100

  if (!isExpanded) {
    return (
      <HydrationSafeMotion
        {...hydrationSafeVariants.slideUp}
        className={cn('mb-6', className)}
      >
        <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-primary-900">Quick Start Guide</h3>
                  <p className="text-sm text-primary-700">
                    {completedTasks} of {totalTasks} tasks completed
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsExpanded(true)}
                variant="ghost"
                size="sm"
                className="text-primary-600 hover:text-primary-700"
              >
                Show Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      </HydrationSafeMotion>
    )
  }

  return (
    <HydrationSafeMotion
      {...hydrationSafeVariants.slideUp}
      className={cn('mb-6', className)}
    >
      <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-primary-900 flex items-center space-x-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span>Quick Start Guide</span>
              </CardTitle>
              <p className="text-sm text-primary-700 mt-1">
                Get the most out of your job tracking experience
              </p>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary-400 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              aria-label="Collapse quick start guide"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-primary-700 mb-2">
              <span>Progress</span>
              <span>{completedTasks}/{totalTasks} completed</span>
            </div>
            <div className="w-full bg-primary-200 rounded-full h-2">
              <HydrationSafeMotion
                className="bg-primary-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            <HydrationSafeAnimatePresence>
              {quickStartTasks.map((task, index) => (
                <HydrationSafeMotion
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
                    task.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      task.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {task.completed ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : (
                        <task.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          'font-medium',
                          task.completed ? 'text-green-900 line-through' : 'text-gray-900'
                        )}>
                          {task.title}
                        </h4>
                        {task.estimatedTime && !task.completed && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {task.estimatedTime}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        'text-sm',
                        task.completed ? 'text-green-700' : 'text-gray-600'
                      )}>
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {!task.completed && (
                    <Button
                      onClick={task.action}
                      variant="outline"
                      size="sm"
                      className="ml-4 flex-shrink-0"
                    >
                      Start
                    </Button>
                  )}
                </HydrationSafeMotion>
              ))}
            </HydrationSafeAnimatePresence>
          </div>

          {completedTasks === totalTasks && (
            <HydrationSafeMotion
              {...hydrationSafeVariants.scaleIn}
              className="mt-4 p-4 bg-green-100 rounded-lg text-center"
            >
              <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-green-900 mb-1">
                🎉 Great job! You\'re all set up!
              </h4>
              <p className="text-sm text-green-700">
                You\'ve completed the quick start guide. Happy job hunting!
              </p>
            </HydrationSafeMotion>
          )}
        </CardContent>
      </Card>
    </HydrationSafeMotion>
  )
}