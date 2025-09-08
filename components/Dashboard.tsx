'use client'

import { useState } from 'react'
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Grid, Stack } from './ui/Layout'
import { AccessibleMotion } from './ui/AccessibilityWrapper'
import { HelpTooltip } from './ui/HelpTooltip'
import { NoApplicationsEmptyState } from './ui/EmptyState'
import { HydrationErrorBoundary, useHydrationErrorHandler } from './HydrationErrorBoundary'
import { GuestModeBanner } from './auth/GuestModeBanner'
import { AuthModal } from './auth/AuthModal'
import AIInsightsDashboard from './ai/AIInsightsDashboard'
import { RemindersWidget } from './reminders/RemindersWidget'

interface DashboardProps {
  onAddNew: () => void
  onImport: () => void
  onExport?: () => void
  onViewAnalytics?: () => void
  onManageDuplicates?: () => void
  onManageBackups?: () => void
}

// Internal Dashboard component without error boundary
function DashboardInternal({ onAddNew, onImport, onExport, onViewAnalytics, onManageDuplicates, onManageBackups }: DashboardProps) {
  const { applications, getStats } = useApplicationStore()
  const { isGuest, shouldPromptRegistration } = useAuthStore()
  const { handleHydrationError } = useHydrationErrorHandler()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  
  let stats
  try {
    stats = getStats()
  } catch (error) {
    handleHydrationError(error as Error, 'Dashboard.getStats')
    // Fallback stats
    stats = {
      total: 0,
      pending: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
      rejected: 0,
      accepted: 0,
      successRate: 0,
      averageResponseTime: 0,
      topCompanies: [],
      topLocations: []
    }
  }

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  // Show empty state if no applications
  if (applications.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Guest Mode Banner */}
        {shouldPromptRegistration() && (
          <GuestModeBanner
            onRegisterClick={() => handleAuthClick('register')}
            onLoginClick={() => handleAuthClick('login')}
          />
        )}
        
        <NoApplicationsEmptyState 
          onAddNew={onAddNew}
          onImport={onImport}
        />
        
        {/* Authentication Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      helpText: 'Total number of job applications you have tracked'
    },
    {
      title: 'Pending Response',
      value: stats.pending + stats.applied,
      icon: ClockIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      helpText: 'Applications waiting for employer response'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: CheckCircleIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      helpText: 'Percentage of applications that led to interviews or offers'
    },
    {
      title: 'Avg Response Time',
      value: stats.averageResponseTime > 0 ? `${stats.averageResponseTime} days` : 'N/A',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      helpText: 'Average time to receive a response from employers'
    }
  ]

  const statusBreakdown = [
    { status: 'Pending', count: stats.pending, color: 'bg-warning-500' },
    { status: 'Applied', count: stats.applied, color: 'bg-primary-500' },
    { status: 'Interviewing', count: stats.interviewing, color: 'bg-blue-500' },
    { status: 'Offered', count: stats.offered, color: 'bg-success-500' },
    { status: 'Rejected', count: stats.rejected, color: 'bg-danger-500' },
    { status: 'Accepted', count: stats.accepted, color: 'bg-success-600' }
  ]

  return (
    <Stack spacing={6} className="mb-8">
      {/* Guest Mode Banner */}
      {shouldPromptRegistration() && (
        <GuestModeBanner
          onRegisterClick={() => handleAuthClick('register')}
          onLoginClick={() => handleAuthClick('login')}
        />
      )}
      
      {/* Stats Cards */}
      <section aria-labelledby="stats-heading" data-tour="stats-cards">
        <h2 id="stats-heading" className="sr-only">Application Statistics</h2>
        <Grid cols={4} gap={6}>
          {statCards.map((stat, index) => (
            <AccessibleMotion
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </p>
                        <HelpTooltip 
                          content={stat.helpText}
                          size="sm"
                        />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon 
                        className={`w-6 h-6 ${stat.color}`} 
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccessibleMotion>
          ))}
        </Grid>
      </section>

      {/* Status Breakdown, Top Insights, and Reminders */}
      <section aria-labelledby="insights-heading">
        <h2 id="insights-heading" className="sr-only">Application Insights</h2>
        <Grid cols={3} gap={6}>
          {/* Status Breakdown */}
          <AccessibleMotion
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card data-tour="status-breakdown">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Application Status</span>
                  <HelpTooltip 
                    content="Breakdown of your applications by current status"
                    size="sm"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3" role="list" aria-label="Application status breakdown">
                  {statusBreakdown.map((item) => (
                    <div 
                      key={item.status} 
                      className="flex items-center justify-between"
                      role="listitem"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-3 h-3 rounded-full ${item.color}`}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {item.status}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AccessibleMotion>

          {/* Top Companies and Locations */}
          <AccessibleMotion
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card data-tour="insights">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Top Insights</span>
                  <HelpTooltip 
                    content="Most frequently applied companies and locations"
                    size="sm"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Top Companies */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    Top Companies
                  </h4>
                  <div className="space-y-2" role="list" aria-label="Top companies">
                    {stats.topCompanies.length > 0 ? (
                      stats.topCompanies.map((company, index) => (
                        <div 
                          key={company} 
                          className="flex items-center justify-between text-sm"
                          role="listitem"
                        >
                          <span className="text-gray-700">{company}</span>
                          <span className="text-gray-500">#{index + 1}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No data available yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Locations */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                    Top Locations
                  </h4>
                  <div className="space-y-2" role="list" aria-label="Top locations">
                    {stats.topLocations.length > 0 ? (
                      stats.topLocations.map((location, index) => (
                        <div 
                          key={location} 
                          className="flex items-center justify-between text-sm"
                          role="listitem"
                        >
                          <span className="text-gray-700">{location}</span>
                          <span className="text-gray-500">#{index + 1}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No data available yet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccessibleMotion>

          {/* Reminders Widget */}
          <AccessibleMotion
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <RemindersWidget data-tour="reminders-widget" />
          </AccessibleMotion>
        </Grid>
      </section>

      {/* AI Insights Dashboard */}
      {applications.length >= 3 && (
        <AccessibleMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <AIInsightsDashboard 
            applications={applications}
            className="data-tour-ai-insights"
          />
        </AccessibleMotion>
      )}

      {/* Quick Actions */}
      <AccessibleMotion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card variant="gradient">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              🚀 Ready to boost your job search?
            </h3>
            <p className="text-primary-700 mb-6">
              Track your applications, analyze your success patterns, and get AI-powered insights
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onAddNew}>
                Add New Application
              </Button>
              {onExport && applications.length > 0 && (
                <Button onClick={onExport} variant="secondary">
                  Export Data
                </Button>
              )}
              {onViewAnalytics && (
                <Button onClick={onViewAnalytics} variant="secondary">
                  View Advanced Analytics
                </Button>
              )}
              {onManageDuplicates && applications.length > 1 && (
                <Button onClick={onManageDuplicates} variant="outline">
                  Manage Duplicates
                </Button>
              )}
              {onManageBackups && (
                <Button onClick={onManageBackups} variant="outline">
                  Backup & Restore
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </AccessibleMotion>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </Stack>
  )
}

// Hydration-safe fallback UI for the Dashboard
function DashboardFallback() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-500">
            Please wait while we load your application statistics...
          </p>
        </div>
      </div>
    </div>
  )
}

// Main export with hydration error boundary
export default function Dashboard({ onAddNew, onImport, onExport, onViewAnalytics, onManageDuplicates, onManageBackups }: DashboardProps) {
  const handleHydrationError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Hydration error in Dashboard:', error, errorInfo)
    
    // Additional logging for Dashboard specific context
    console.group('Dashboard Hydration Error Context')
    console.log('Component: Dashboard')
    console.log('Error occurred during dashboard rendering or stats calculation')
    console.log('Possible causes:')
    console.log('- Store state hydration issues')
    console.log('- Statistics calculation errors')
    console.log('- Animation state mismatches')
    console.groupEnd()
  }

  return (
    <HydrationErrorBoundary 
      fallback={<DashboardFallback />}
      onHydrationError={handleHydrationError}
    >
      <DashboardInternal 
        onAddNew={onAddNew}
        onImport={onImport}
        onExport={onExport}
        onViewAnalytics={onViewAnalytics}
        onManageDuplicates={onManageDuplicates}
        onManageBackups={onManageBackups}
      />
    </HydrationErrorBoundary>
  )
}
