'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useApplicationStore } from '@/store/applicationStore'
import { cn } from '@/lib/utils'

interface OnboardingProgressProps {
  className?: string
  onStartAction?: (actionId: string) => void
}

export function OnboardingProgress({ className, onStartAction }: OnboardingProgressProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { steps } = useOnboardingStore()
  const { applications } = useApplicationStore()

  const milestones = [
    {
      id: 'first-application',
      title: 'First Application Added',
      description: 'Track your first job application',
      completed: applications.length > 0,
      icon: CheckCircleIcon,
      reward: '+10 XP',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'five-applications',
      title: 'Getting Started',
      description: 'Add 5 applications to unlock insights',
      completed: applications.length >= 5,
      icon: StarIcon,
      reward: '+25 XP',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'first-interview',
      title: 'Interview Scheduled',
      description: 'Mark your first interview',
      completed: applications.some(app => app.status === 'Interviewing'),
      icon: TrophyIcon,
      reward: '+50 XP',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'power-user',
      title: 'Power User',
      description: 'Add 20+ applications and explore all features',
      completed: applications.length >= 20 && steps.every(step => step.completed),
      icon: TrophyIcon,
      reward: '+100 XP',
      color: 'text-gold-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  const completedMilestones = milestones.filter(m => m.completed).length
  const totalMilestones = milestones.length
  const progressPercentage = (completedMilestones / totalMilestones) * 100

  const nextMilestone = milestones.find(m => !m.completed)

  if (!isExpanded && completedMilestones === totalMilestones) {
    return null // Hide when all milestones are complete
  }

  return (
    <Card className={cn('border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-indigo-900 flex items-center space-x-2">
            <TrophyIcon className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-indigo-700">
              {completedMilestones}/{totalMilestones} milestones
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-indigo-400 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
            >
              <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-indigo-200 rounded-full h-2">
            <motion.div
              className="bg-indigo-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
                  milestone.completed 
                    ? 'bg-white border-green-200' 
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    milestone.completed 
                      ? 'bg-green-100 text-green-600' 
                      : milestone.bgColor
                  )}>
                    {milestone.completed ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <milestone.icon className={cn('w-4 h-4', milestone.color)} />
                    )}
                  </div>
                  <div>
                    <h4 className={cn(
                      'font-medium',
                      milestone.completed ? 'text-green-900' : 'text-gray-900'
                    )}>
                      {milestone.title}
                    </h4>
                    <p className={cn(
                      'text-sm',
                      milestone.completed ? 'text-green-700' : 'text-gray-600'
                    )}>
                      {milestone.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {milestone.completed && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {milestone.reward}
                    </span>
                  )}
                  {!milestone.completed && milestone === nextMilestone && (
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next milestone call-to-action */}
          {nextMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-indigo-900 mb-1">
                    🎯 Next: {nextMilestone.title}
                  </h4>
                  <p className="text-sm text-indigo-700">
                    {nextMilestone.description}
                  </p>
                </div>
                {onStartAction && (
                  <Button
                    onClick={() => onStartAction(nextMilestone.id)}
                    size="sm"
                    variant="outline"
                    className="text-indigo-700 border-indigo-300 hover:bg-indigo-100"
                  >
                    Start
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Completion celebration */}
          {completedMilestones === totalMilestones && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg text-center border border-yellow-200"
            >
              <TrophyIcon className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-medium text-yellow-900 mb-1">
                🎉 Congratulations! You're a Job Search Pro!
              </h4>
              <p className="text-sm text-yellow-700">
                You've mastered all the key features. Keep tracking and analyzing for continued success!
              </p>
            </motion.div>
          )}
        </CardContent>
      )}
    </Card>
  )
}