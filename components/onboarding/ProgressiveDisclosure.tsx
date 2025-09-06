'use client'

import { useState, useEffect } from 'react'
import { 
  HydrationSafeMotion, 
  HydrationSafeAnimatePresence, 
  hydrationSafeVariants,
  conditionalAnimationClass,
  useHydrationSafeAnimation
} from '@/lib/utils/hydrationSafeAnimation'
import { 
  ChevronRightIcon,
  ChevronDownIcon,
  SparklesIcon,
  LightBulbIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { useApplicationStore } from '@/store/applicationStore'
import { cn } from '@/lib/utils'

interface AdvancedFeature {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  unlockCondition: () => boolean
  unlockMessage: string
  content: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

interface ProgressiveDisclosureProps {
  className?: string
}

export function ProgressiveDisclosure({ className }: ProgressiveDisclosureProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())
  const { applications, getStats } = useApplicationStore()
  const stats = getStats()

  const advancedFeatures: AdvancedFeature[] = [
    {
      id: 'ai-insights',
      title: 'AI-Powered Insights',
      description: 'Get intelligent analysis of your application patterns and success factors',
      icon: SparklesIcon,
      unlockCondition: () => applications.length >= 3,
      unlockMessage: 'Add 3+ applications to unlock AI insights',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Our AI analyzes your applications to identify success patterns, optimal timing, 
            and improvement opportunities. Get personalized recommendations to boost your success rate.
          </p>
          <div className="bg-blue-50 rounded-lg p-3">
            <h5 className="font-medium text-blue-900 mb-1">What you'll discover:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Success rate patterns by company size and industry</li>
              <li>• Optimal application timing and frequency</li>
              <li>• Personalized improvement suggestions</li>
              <li>• Response time predictions and benchmarks</li>
              <li>• Job market trend analysis</li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Analyze My Applications',
      onAction: () => {
        console.log('Starting AI analysis...')
      }
    },
    {
      id: 'smart-reminders',
      title: 'Smart Follow-up Reminders',
      description: 'Never miss important follow-ups with intelligent scheduling',
      icon: LightBulbIcon,
      unlockCondition: () => applications.filter(app => app.status === 'Applied' || app.status === 'Pending').length >= 2,
      unlockMessage: 'Have 2+ pending applications to unlock smart reminders',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Automatically schedule follow-ups based on industry best practices and company response patterns. 
            Get notified at the optimal time to maximize your chances.
          </p>
          <div className="bg-orange-50 rounded-lg p-3">
            <h5 className="font-medium text-orange-900 mb-1">Smart Features:</h5>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Industry-specific follow-up timing</li>
              <li>• Company size-based recommendations</li>
              <li>• Automated reminder scheduling</li>
              <li>• Email template suggestions</li>
              <li>• Interview preparation reminders</li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Set Up Reminders',
      onAction: () => {
        console.log('Setting up smart reminders...')
      }
    },
    {
      id: 'advanced-analytics',
      title: 'Advanced Analytics Dashboard',
      description: 'Deep dive into your job search performance with visual insights',
      icon: ChartBarIcon,
      unlockCondition: () => applications.length >= 5,
      unlockMessage: 'Add 5+ applications to unlock advanced analytics',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Visualize your job search journey with interactive charts, trend analysis, 
            and comparative benchmarks against industry standards.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <h5 className="font-medium text-purple-900 text-sm mb-1">Performance Metrics</h5>
              <p className="text-xs text-purple-700">Response rates, conversion funnels, time-to-hire analysis</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <h5 className="font-medium text-green-900 text-sm mb-1">Trend Analysis</h5>
              <p className="text-xs text-green-700">Weekly/monthly progress, seasonal patterns, success trends</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <h5 className="font-medium text-blue-900 text-sm mb-1">Benchmarking</h5>
              <p className="text-xs text-blue-700">Compare against industry averages and best practices</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <h5 className="font-medium text-pink-900 text-sm mb-1">Predictive Insights</h5>
              <p className="text-xs text-pink-700">Success probability and optimization recommendations</p>
            </div>
          </div>
        </div>
      ),
      actionLabel: 'View Analytics Dashboard',
      onAction: () => {
        console.log('Opening analytics dashboard...')
      }
    },
    {
      id: 'export-reports',
      title: 'Advanced Export & Reporting',
      description: 'Generate comprehensive reports and export data in multiple formats',
      icon: ChartBarIcon,
      unlockCondition: () => applications.length >= 8,
      unlockMessage: 'Add 8+ applications to unlock advanced reporting',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Create detailed reports for your job search progress, export data for external analysis, 
            and generate professional summaries for career counselors or networking.
          </p>
          <div className="bg-teal-50 rounded-lg p-3">
            <h5 className="font-medium text-teal-900 mb-1">Export Options:</h5>
            <ul className="text-sm text-teal-700 space-y-1">
              <li>• PDF reports with analytics and insights</li>
              <li>• Excel exports with pivot tables</li>
              <li>• CSV data for external analysis</li>
              <li>• Professional summary reports</li>
              <li>• Custom date range filtering</li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Generate Reports',
      onAction: () => {
        console.log('Opening report generator...')
      }
    },
    {
      id: 'advanced-filters',
      title: 'Advanced Search & Filtering',
      description: 'Powerful tools to organize and find your applications efficiently',
      icon: CogIcon,
      unlockCondition: () => applications.length >= 10,
      unlockMessage: 'Add 10+ applications to unlock advanced filtering',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Use advanced filters, saved searches, and custom tags to organize your applications. 
            Create custom views for different job search strategies and bulk operations.
          </p>
          <div className="bg-indigo-50 rounded-lg p-3">
            <h5 className="font-medium text-indigo-900 mb-1">Advanced Tools:</h5>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Multi-criteria filtering and sorting</li>
              <li>• Saved search queries and custom views</li>
              <li>• Advanced tag management system</li>
              <li>• Bulk operations and batch updates</li>
              <li>• Smart duplicate detection and merging</li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Explore Advanced Filters',
      onAction: () => {
        console.log('Opening advanced filters...')
      }
    },
    {
      id: 'networking-tools',
      title: 'Networking & Contact Management',
      description: 'Track contacts, referrals, and networking opportunities',
      icon: SparklesIcon,
      unlockCondition: () => applications.length >= 15,
      unlockMessage: 'Add 15+ applications to unlock networking tools',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Manage your professional network, track referrals, and identify networking opportunities 
            to boost your job search success through connections.
          </p>
          <div className="bg-emerald-50 rounded-lg p-3">
            <h5 className="font-medium text-emerald-900 mb-1">Networking Features:</h5>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• Contact database with relationship tracking</li>
              <li>• Referral opportunity identification</li>
              <li>• LinkedIn integration and outreach tracking</li>
              <li>• Follow-up reminders for networking</li>
              <li>• Connection strength analysis</li>
            </ul>
          </div>
        </div>
      ),
      actionLabel: 'Manage Network',
      onAction: () => {
        console.log('Opening networking tools...')
      }
    }
  ]

  const toggleFeature = (featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(featureId)) {
        newSet.delete(featureId)
      } else {
        newSet.add(featureId)
      }
      return newSet
    })
  }

  const unlockedFeatures = advancedFeatures.filter(feature => feature.unlockCondition())
  const lockedFeatures = advancedFeatures.filter(feature => !feature.unlockCondition())

  // Don't show if no applications yet
  if (applications.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Unlocked Features */}
      {unlockedFeatures.length > 0 && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">New Features Unlocked!</h3>
            </div>
            
            <div className="space-y-3">
              {unlockedFeatures.map((feature) => (
                <div key={feature.id} className="border border-green-200 rounded-lg bg-white">
                  <button
                    onClick={() => toggleFeature(feature.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-green-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <div className="flex items-center space-x-3">
                      <feature.icon className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{feature.title}</h4>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                    {expandedFeatures.has(feature.id) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <HydrationSafeAnimatePresence>
                    {expandedFeatures.has(feature.id) && (
                      <HydrationSafeMotion
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-green-100">
                          {feature.content}
                          {feature.actionLabel && feature.onAction && (
                            <div className="mt-4">
                              <Button
                                onClick={feature.onAction}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {feature.actionLabel}
                              </Button>
                            </div>
                          )}
                        </div>
                      </HydrationSafeMotion>
                    )}
                  </HydrationSafeAnimatePresence>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Features Preview */}
      {lockedFeatures.length > 0 && (
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <LightBulbIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Coming Soon</h3>
            </div>
            
            <div className="space-y-3">
              {lockedFeatures.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg bg-white opacity-75">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <feature.icon className="w-5 h-5 text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-700">{feature.title}</h4>
                        <p className="text-sm text-gray-500">{feature.unlockMessage}</p>
                      </div>
                    </div>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Locked
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}