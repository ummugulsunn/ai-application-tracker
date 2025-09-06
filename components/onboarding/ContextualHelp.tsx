'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QuestionMarkCircleIcon,
  XMarkIcon,
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { cn } from '@/lib/utils'

interface ContextualTip {
  id: string
  title: string
  content: string
  action?: {
    label: string
    onClick: () => void
  }
  trigger: 'hover' | 'click' | 'auto'
  position: 'top' | 'bottom' | 'left' | 'right'
  showOnce?: boolean
}

interface ContextualHelpProps {
  tips: ContextualTip[]
  className?: string
}

export function ContextualHelp({ tips, className }: ContextualHelpProps) {
  const [activeTip, setActiveTip] = useState<string | null>(null)
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load dismissed tips from localStorage
    const dismissed = localStorage.getItem('dismissed-tips')
    if (dismissed) {
      setDismissedTips(new Set(JSON.parse(dismissed)))
    }
  }, [])

  const dismissTip = (tipId: string) => {
    const newDismissed = new Set(dismissedTips)
    newDismissed.add(tipId)
    setDismissedTips(newDismissed)
    localStorage.setItem('dismissed-tips', JSON.stringify(Array.from(newDismissed)))
    setActiveTip(null)
  }

  const showTip = (tipId: string) => {
    const tip = tips.find(t => t.id === tipId)
    if (tip && (!tip.showOnce || !dismissedTips.has(tipId))) {
      setActiveTip(tipId)
    }
  }

  const activeTipData = tips.find(t => t.id === activeTip)

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {activeTipData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 w-80"
          >
            <Card className="border-blue-200 bg-blue-50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <LightBulbIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">{activeTipData.title}</h4>
                  </div>
                  <button
                    onClick={() => dismissTip(activeTipData.id)}
                    className="text-blue-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label="Dismiss tip"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-sm text-blue-700 mb-3">
                  {activeTipData.content}
                </p>

                {activeTipData.action && (
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={activeTipData.action.onClick}
                      size="sm"
                      variant="outline"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      rightIcon={<ArrowRightIcon className="w-3 h-3" />}
                    >
                      {activeTipData.action.label}
                    </Button>
                    <button
                      onClick={() => dismissTip(activeTipData.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Don't show again
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help trigger buttons */}
      {tips.map((tip) => (
        <button
          key={tip.id}
          onClick={() => showTip(tip.id)}
          className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
          aria-label={`Show help: ${tip.title}`}
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}

// Predefined contextual help tips for common scenarios
export const commonHelpTips = {
  csvImport: {
    id: 'csv-import-help',
    title: 'CSV Import Tips',
    content: 'Upload CSV files from LinkedIn, Indeed, or custom spreadsheets. Our smart system automatically detects and maps columns to save you time.',
    trigger: 'click' as const,
    position: 'bottom' as const,
    action: {
      label: 'Try Import',
      onClick: () => console.log('Open import modal')
    }
  },
  
  aiInsights: {
    id: 'ai-insights-help',
    title: 'AI Insights Explained',
    content: 'AI analyzes your application patterns to identify success factors, optimal timing, and improvement opportunities. Add more applications to get better insights.',
    trigger: 'click' as const,
    position: 'left' as const
  },
  
  statusTracking: {
    id: 'status-tracking-help',
    title: 'Application Status Guide',
    content: 'Track your applications through each stage: Pending → Applied → Interviewing → Offered/Rejected. Update statuses to see accurate analytics.',
    trigger: 'click' as const,
    position: 'right' as const
  },
  
  successRate: {
    id: 'success-rate-help',
    title: 'Success Rate Calculation',
    content: 'Success rate = (Interviews + Offers) / Total Applications × 100. Industry average is 10-20%, so aim to improve over time.',
    trigger: 'hover' as const,
    position: 'top' as const
  }
}