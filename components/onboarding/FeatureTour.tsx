'use client'

import { TourStep, GuidedTour } from '../ui/GuidedTour'

interface FeatureTourProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function FeatureTour({ isOpen, onClose, onComplete }: FeatureTourProps) {
  // Define tour steps with better error handling
  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="header"]',
      title: 'Welcome to Your Dashboard! 👋',
      content: 'This is your command center where you can manage all aspects of your job search. The header provides quick access to key actions and help resources.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="add-button"]',
      title: 'Add New Applications',
      content: 'Click here to manually add a new job application. The smart form includes auto-completion for companies, job titles, and locations to speed up data entry.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="import-button"]',
      title: 'Smart CSV Import System',
      content: 'Import applications from spreadsheets with our intelligent field mapping system. Supports LinkedIn exports, Indeed saves, Glassdoor data, and custom formats.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="stats-cards"]',
      title: 'Real-Time Progress Tracking',
      content: 'Monitor your job search performance with key metrics: total applications, pending responses, success rate, and average response time.',
      placement: 'bottom'
    },
    {
      target: '[data-tour="status-breakdown"]',
      title: 'Application Status Overview',
      content: 'Visual breakdown of your applications by current status. This helps you understand your pipeline and identify where applications might be stuck.',
      placement: 'right'
    },
    {
      target: '[data-tour="insights"]',
      title: 'Smart Insights & Patterns',
      content: 'Discover patterns in your job search: top companies you\'ve applied to, preferred locations, and success trends.',
      placement: 'left'
    },
    {
      target: '[data-tour="application-table"]',
      title: 'Comprehensive Application Management',
      content: 'View, edit, and manage all your applications in one organized table. Use powerful filters, search functionality, and sorting to find specific applications quickly.',
      placement: 'top'
    },
    {
      target: '[data-tour="help-button"]',
      title: 'Help & Support System',
      content: 'Access contextual help, tutorials, and support anytime. You can restart this tour or get specific help for any feature.',
      placement: 'bottom'
    }
  ]

  const handleComplete = () => {
    try {
      onComplete?.()
      onClose()
    } catch (error) {
      console.error('Error completing tour:', error)
      onClose()
    }
  }

  // Add error boundary for the tour
  try {
    return (
      <GuidedTour
        steps={tourSteps}
        isOpen={isOpen}
        onClose={onClose}
        onComplete={handleComplete}
      />
    )
  } catch (error) {
    console.error('Error rendering FeatureTour:', error)
    return null
  }
}