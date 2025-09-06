'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Force client-side rendering for this page
export const runtime = 'edge'

// Dynamically import components that might access window
const DynamicGuidedTour = dynamic(() => import('@/components/ui/GuidedTour').then(mod => ({ default: mod.GuidedTour })), {
  ssr: false
})

import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Input,
  EmptyState,
  NoApplicationsEmptyState,
  LoadingSpinner,
  Skeleton,
  HelpTooltip,
  useTour,
  Grid,
  Stack,
  Container
} from '@/components/ui'
import { 
  QuickStart, 
  ProgressiveDisclosure, 
  OnboardingProgress, 
  ContextualHelp, 
  commonHelpTips 
} from '@/components/onboarding'
import { 
  PlusIcon, 
  ArrowDownTrayIcon,
  DocumentIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

export default function UIDemo() {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { isOpen, startTour, closeTour, completeTour } = useTour('ui-demo')

  const tourSteps = [
    {
      target: '#demo-buttons',
      title: 'Interactive Buttons',
      content: 'These buttons are fully accessible with keyboard navigation, loading states, and proper ARIA labels.',
      placement: 'bottom' as const
    },
    {
      target: '#demo-cards',
      title: 'Responsive Cards',
      content: 'Cards automatically adapt to different screen sizes and support hover effects.',
      placement: 'top' as const
    },
    {
      target: '#demo-inputs',
      title: 'Smart Form Inputs',
      content: 'Form inputs include validation, help text, and accessibility features like screen reader support.',
      placement: 'bottom' as const
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    if (value.length > 0 && value.length < 3) {
      setInputError('Must be at least 3 characters')
    } else {
      setInputError('')
    }
  }

  const simulateLoading = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <Container size="lg" className="py-8">
      <Stack spacing={8}>
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            UI Component Library Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            WCAG 2.1 AA compliant, responsive, and accessible components
          </p>
          <Button onClick={startTour} variant="outline">
            Take a Guided Tour
          </Button>
        </div>

        {/* Buttons Section */}
        <section id="demo-buttons">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Interactive Buttons</span>
                <HelpTooltip content="All buttons support keyboard navigation and screen readers" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={3} gap={4}>
                <Stack spacing={3}>
                  <h4 className="font-medium text-gray-700">Primary Actions</h4>
                  <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
                    Add New
                  </Button>
                  <Button 
                    variant="success" 
                    loading={loading}
                    onClick={simulateLoading}
                  >
                    Save Changes
                  </Button>
                  <Button variant="danger" size="sm">
                    Delete
                  </Button>
                </Stack>

                <Stack spacing={3}>
                  <h4 className="font-medium text-gray-700">Secondary Actions</h4>
                  <Button 
                    variant="secondary"
                    leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                  >
                    Import
                  </Button>
                  <Button variant="outline">
                    Cancel
                  </Button>
                  <Button variant="ghost" size="lg">
                    Skip
                  </Button>
                </Stack>

                <Stack spacing={3}>
                  <h4 className="font-medium text-gray-700">States</h4>
                  <Button disabled>
                    Disabled
                  </Button>
                  <Button loading>
                    Loading
                  </Button>
                  <Button variant="link">
                    Link Style
                  </Button>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section id="demo-cards">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Card Layouts</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={3} gap={6}>
                <Card variant="elevated">
                  <CardContent className="p-6 text-center">
                    <ChartBarIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                    <p className="text-gray-600 text-sm">
                      Track your application success rates
                    </p>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent className="p-6 text-center">
                    <DocumentIcon className="w-12 h-12 text-success-600 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Import</h3>
                    <p className="text-gray-600 text-sm">
                      Import data from CSV files
                    </p>
                  </CardContent>
                </Card>

                <Card variant="gradient">
                  <CardContent className="p-6 text-center">
                    <PlusIcon className="w-12 h-12 text-primary-700 mx-auto mb-4" />
                    <h3 className="font-semibold text-primary-900 mb-2">Add New</h3>
                    <p className="text-primary-700 text-sm">
                      Create new applications
                    </p>
                  </CardContent>
                </Card>
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Form Inputs Section */}
        <section id="demo-inputs">
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={2} gap={6}>
                <Stack spacing={4}>
                  <Input
                    label="Company Name"
                    placeholder="Enter company name"
                    helperText="The company you're applying to"
                  />
                  
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="your@email.com"
                    required
                    success="Valid email format"
                  />
                  
                  <Input
                    label="Password"
                    type="password"
                    showPasswordToggle
                    placeholder="Enter password"
                  />
                </Stack>

                <Stack spacing={4}>
                  <Input
                    label="Validation Demo"
                    value={inputValue}
                    onChange={handleInputChange}
                    error={inputError}
                    placeholder="Type at least 3 characters"
                  />
                  
                  <Input
                    label="Disabled Input"
                    disabled
                    value="Cannot edit this"
                  />
                  
                  <Input
                    label="With Left Icon"
                    leftIcon={<DocumentIcon className="w-4 h-4" />}
                    placeholder="Search documents..."
                  />
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Loading States Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={3} gap={6}>
                <Stack spacing={4} className="text-center">
                  <h4 className="font-medium text-gray-700">Spinners</h4>
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </Stack>

                <Stack spacing={4}>
                  <h4 className="font-medium text-gray-700">Skeleton Loading</h4>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full rounded-lg" />
                </Stack>

                <Stack spacing={4}>
                  <h4 className="font-medium text-gray-700">Card Skeleton</h4>
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Empty States Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Empty States</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid cols={2} gap={6}>
                <EmptyState
                  title="No data found"
                  description="There's nothing here yet. Get started by adding your first item."
                  action={{
                    label: 'Add Item',
                    onClick: () => alert('Add item clicked!')
                  }}
                  size="sm"
                />

                <NoApplicationsEmptyState
                  onAddNew={() => alert('Add new clicked!')}
                  onImport={() => alert('Import clicked!')}
                />
              </Grid>
            </CardContent>
          </Card>
        </section>

        {/* Onboarding Components Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Onboarding & User Experience Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack spacing={6}>
                {/* Quick Start Demo */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Quick Start Guide</h4>
                  <QuickStart
                    onAddApplication={() => alert('Add application clicked!')}
                    onImportCSV={() => alert('Import CSV clicked!')}
                    onStartTour={() => alert('Start tour clicked!')}
                  />
                </div>

                {/* Onboarding Progress Demo */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Onboarding Progress Tracker</h4>
                  <OnboardingProgress
                    onStartAction={(actionId) => alert(`Start action: ${actionId}`)}
                  />
                </div>

                {/* Progressive Disclosure Demo */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Progressive Feature Disclosure</h4>
                  <ProgressiveDisclosure />
                </div>

                {/* Contextual Help Demo */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Contextual Help System</h4>
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">CSV Import Feature</span>
                    <ContextualHelp tips={[commonHelpTips.csvImport]} />
                    
                    <span className="text-sm text-gray-600">AI Insights</span>
                    <ContextualHelp tips={[commonHelpTips.aiInsights]} />
                    
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <ContextualHelp tips={[commonHelpTips.successRate]} />
                  </div>
                </div>

                {/* Demo Buttons for Onboarding */}
                <div className="flex flex-wrap gap-3 p-4 bg-blue-50 rounded-lg">
                  <Button
                    onClick={() => {
                      // This would trigger the welcome wizard in a real app
                      alert('Welcome Wizard would open here')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Show Welcome Wizard
                  </Button>
                  <Button
                    onClick={() => {
                      // This would trigger the feature tour in a real app
                      alert('Feature Tour would start here')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Start Feature Tour
                  </Button>
                  <Button
                    onClick={() => {
                      // This would reset onboarding in a real app
                      alert('Onboarding would reset here')
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Reset Onboarding
                  </Button>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </section>

        {/* Accessibility Features */}
        <section>
          <Card variant="gradient">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-semibold text-primary-900 mb-4">
                ♿ Accessibility Features
              </h3>
              <Grid cols={2} gap={6} className="text-left">
                <Stack spacing={2}>
                  <h4 className="font-medium text-primary-800">WCAG 2.1 AA Compliant</h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader compatibility</li>
                    <li>• High contrast mode support</li>
                    <li>• Focus management</li>
                  </ul>
                </Stack>
                <Stack spacing={2}>
                  <h4 className="font-medium text-primary-800">Responsive Design</h4>
                  <ul className="text-sm text-primary-700 space-y-1">
                    <li>• Mobile-first approach</li>
                    <li>• Touch-friendly interfaces</li>
                    <li>• Flexible grid system</li>
                    <li>• Reduced motion support</li>
                  </ul>
                </Stack>
              </Grid>
            </CardContent>
          </Card>
        </section>
      </Stack>

      {/* Guided Tour */}
      <DynamicGuidedTour
        steps={tourSteps}
        isOpen={isOpen}
        onClose={closeTour}
        onComplete={completeTour}
      />
    </Container>
  )
}