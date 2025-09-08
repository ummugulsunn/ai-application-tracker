'use client'

import { useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useApplicationStore } from '@/store/applicationStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard'
import { HydrationErrorBoundary } from '@/components/HydrationErrorBoundary'
import { AccessibleMotion } from '@/components/ui/AccessibilityWrapper'

export default function AnalyticsPage() {
  const router = useRouter()
  const { applications } = useApplicationStore()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <HydrationErrorBoundary
      fallback={
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <AccessibleMotion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <Button onClick={handleBack} variant="outline" className="mb-4">
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">
                  Advanced Analytics
                </h1>
                <p className="text-gray-600 mt-2">
                  Comprehensive insights and reporting for your job search
                </p>
              </div>
            </div>
          </AccessibleMotion>

          {/* Analytics Dashboard */}
          <AccessibleMotion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AdvancedAnalyticsDashboard 
              applications={applications}
              className="w-full"
            />
          </AccessibleMotion>
        </div>
      </div>
    </HydrationErrorBoundary>
  )
}