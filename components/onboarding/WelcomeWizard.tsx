'use client'

import { useState } from 'react'
import { 
  HydrationSafeMotion, 
  HydrationSafeAnimatePresence, 
  hydrationSafeVariants,
  useHydrationSafeAnimation,
  conditionalAnimationClass
} from '@/lib/utils/hydrationSafeAnimation'
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon,
  SparklesIcon,
  DocumentArrowUpIcon,
  ChartBarIcon,
  CogIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useApplicationStore } from '@/store/applicationStore'
import { cn } from '@/lib/utils'

interface WelcomeWizardProps {
  isOpen: boolean
  onClose: () => void
  onStartTour: () => void
  onAddApplication: () => void
  onImportCSV: () => void
}

const wizardSteps = [
  {
    id: 'welcome',
    title: 'Welcome to AI Application Tracker! 🎉',
    description: 'Your intelligent companion for job search success',
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-10 h-10 text-white" />
        </div>
        <p className="text-gray-600 leading-relaxed">
          Transform your job search with intelligent tracking, AI-powered insights, and smart automation. 
          This tool helps you stay organized, identify success patterns, and boost your application success rate.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          <div className="bg-primary-50 rounded-lg p-3 text-sm text-primary-700">
            <strong>✨ Smart Features:</strong> AI insights, auto-completion, duplicate detection
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>🔒 Privacy First:</strong> Works completely offline - no account required
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'getting-started',
    title: 'How would you like to start?',
    description: 'Choose the best way to begin tracking your applications',
    content: null // Will be handled specially
  },
  {
    id: 'features',
    title: 'Key Features You\'ll Love',
    description: 'Discover what makes this tracker special',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <DocumentArrowUpIcon className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900">Smart CSV Import</h4>
              <p className="text-sm text-blue-700">Automatically detect and map columns from LinkedIn, Indeed, or custom spreadsheets</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <ChartBarIcon className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900">AI-Powered Insights</h4>
              <p className="text-sm text-green-700">Get success patterns, timing recommendations, and personalized improvement tips</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <SparklesIcon className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-purple-900">Smart Automation</h4>
              <p className="text-sm text-purple-700">Auto-complete company names, detect duplicates, and smart follow-up reminders</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <CogIcon className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-orange-900">Fully Customizable</h4>
              <p className="text-sm text-orange-700">Adapt to your workflow with custom tags, filters, and dashboard preferences</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <h4 className="font-medium text-indigo-900 mb-2">🚀 Progressive Enhancement</h4>
          <p className="text-sm text-indigo-700">
            Advanced features unlock as you use the app more - from basic tracking to AI insights, 
            advanced analytics, and networking tools. Start simple, grow sophisticated!
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'ready',
    title: 'You\'re All Set! 🚀',
    description: 'Ready to supercharge your job search',
    content: (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <PlayIcon className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-600 leading-relaxed">
          You\'re ready to start tracking your applications! Take the interactive tour 
          to see everything in action, or jump right in and start adding applications.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
          <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
            <strong>💡 Pro Tip:</strong> Start with sample data to explore features immediately
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>🎯 Quick Start:</strong> Access help and tutorials anytime from the header menu
          </div>
        </div>
      </div>
    )
  }
]

export function WelcomeWizard({ 
  isOpen, 
  onClose, 
  onStartTour, 
  onAddApplication, 
  onImportCSV 
}: WelcomeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { completeStep, loadSampleData } = useOnboardingStore()
  const { importApplications } = useApplicationStore()

  const currentStepData = wizardSteps[currentStep]
  const isLastStep = currentStep === wizardSteps.length - 1
  const isFirstStep = currentStep === 0

  const nextStep = () => {
    if (isLastStep) {
      completeStep('welcome')
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

  const handleLoadSampleData = () => {
    const sampleApplications = [
      {
        id: 'sample-1',
        company: 'TechCorp Inc.',
        position: 'Frontend Developer',
        location: 'San Francisco, CA',
        type: 'Full-time' as const,
        salary: '$80,000 - $120,000',
        status: 'Applied' as const,
        priority: 'High' as const,
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: null,
        interviewDate: null,
        notes: 'Great company culture, exciting product. Applied through LinkedIn.',
        contactPerson: 'Sarah Johnson',
        contactEmail: 'sarah@techcorp.com',
        website: 'https://techcorp.com',
        tags: ['React', 'TypeScript', 'Remote-friendly'],
        jobDescription: 'Looking for a passionate frontend developer to join our growing team working on cutting-edge web applications.',
        requirements: ['3+ years React experience', 'TypeScript proficiency', 'Team collaboration'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        company: 'StartupXYZ',
        position: 'Full Stack Engineer',
        location: 'New York, NY',
        type: 'Full-time' as const,
        salary: '$90,000 - $130,000',
        status: 'Interviewing' as const,
        priority: 'Medium' as const,
        appliedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Fast-growing startup, equity package included. Technical interview scheduled.',
        contactPerson: 'Mike Chen',
        contactEmail: 'mike@startupxyz.com',
        website: 'https://startupxyz.com',
        tags: ['Node.js', 'React', 'MongoDB'],
        jobDescription: 'Join our dynamic team building the next generation of productivity tools for remote teams.',
        requirements: ['Full-stack experience', 'Node.js/React', 'Startup experience preferred'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-3',
        company: 'Enterprise Solutions',
        position: 'Software Engineer',
        location: 'Austin, TX',
        type: 'Full-time' as const,
        salary: '$75,000 - $110,000',
        status: 'Rejected' as const,
        priority: 'Low' as const,
        appliedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        interviewDate: null,
        rejectionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        notes: 'Good interview experience, will apply again in the future. Feedback: need more enterprise experience.',
        contactPerson: 'Lisa Rodriguez',
        contactEmail: 'lisa@enterprise.com',
        website: 'https://enterprise.com',
        tags: ['Java', 'Spring', 'Enterprise'],
        jobDescription: 'Develop enterprise software solutions for Fortune 500 clients using modern Java technologies.',
        requirements: ['Java expertise', 'Enterprise experience', '5+ years development'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-4',
        company: 'InnovateLabs',
        position: 'Senior React Developer',
        location: 'Seattle, WA',
        type: 'Full-time' as const,
        salary: '$95,000 - $140,000',
        status: 'Offered' as const,
        priority: 'High' as const,
        appliedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        interviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        offerDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        notes: 'Excellent team, great benefits package. Considering the offer - need to negotiate salary.',
        contactPerson: 'Alex Thompson',
        contactEmail: 'alex@innovatelabs.com',
        website: 'https://innovatelabs.com',
        tags: ['React', 'Redux', 'AWS', 'Senior-level'],
        jobDescription: 'Lead frontend development for our flagship SaaS platform serving 100k+ users.',
        requirements: ['5+ years React', 'Team leadership', 'AWS experience'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-5',
        company: 'DataFlow Analytics',
        position: 'Frontend Engineer',
        location: 'Remote',
        type: 'Full-time' as const,
        salary: '$70,000 - $100,000',
        status: 'Pending' as const,
        priority: 'Medium' as const,
        appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: null,
        interviewDate: null,
        notes: 'Remote-first company, interesting data visualization work. Applied via company website.',
        contactPerson: 'Jordan Kim',
        contactEmail: 'jordan@dataflow.com',
        website: 'https://dataflow.com',
        tags: ['React', 'D3.js', 'Remote', 'Data-viz'],
        jobDescription: 'Build beautiful, interactive data visualizations and dashboards for enterprise clients.',
        requirements: ['React proficiency', 'Data visualization experience', 'Remote work experience'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-6',
        company: 'FinTech Solutions',
        position: 'JavaScript Developer',
        location: 'Chicago, IL',
        type: 'Contract' as const,
        salary: '$60/hour',
        status: 'Applied' as const,
        priority: 'Low' as const,
        appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
        responseDate: null,
        interviewDate: null,
        notes: '6-month contract with potential for extension. Financial services domain.',
        contactPerson: 'Maria Santos',
        contactEmail: 'maria@fintech.com',
        website: 'https://fintech.com',
        tags: ['JavaScript', 'Vue.js', 'FinTech', 'Contract'],
        jobDescription: 'Develop and maintain trading platform interfaces for institutional clients.',
        requirements: ['JavaScript expertise', 'Financial services experience preferred', 'Vue.js knowledge'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    importApplications(sampleApplications)
    loadSampleData()
    completeStep('add-application')
    nextStep()
  }

  const handleStartWithApplication = () => {
    completeStep('add-application')
    onClose()
    onAddApplication()
  }

  const handleStartWithImport = () => {
    completeStep('add-application')
    onClose()
    onImportCSV()
  }

  const handleFinishAndTour = () => {
    completeStep('welcome')
    onClose()
    onStartTour()
  }

  if (!isOpen || !currentStepData) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <HydrationSafeMotion
        {...hydrationSafeVariants.scaleIn}
        className="w-full max-w-2xl"
      >
        <Card className="relative">
          <CardContent className="p-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              aria-label="Close welcome wizard"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Progress indicator */}
            <div className="flex items-center justify-center mb-8">
              {wizardSteps.map((_, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors duration-200',
                      index === currentStep ? 'bg-primary-500' : 
                      index < currentStep ? 'bg-primary-300' : 'bg-gray-300'
                    )}
                  />
                  {index < wizardSteps.length - 1 && (
                    <div 
                      className={cn(
                        'w-8 h-0.5 mx-2 transition-colors duration-200',
                        index < currentStep ? 'bg-primary-300' : 'bg-gray-300'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            <HydrationSafeAnimatePresence mode="wait">
              <HydrationSafeMotion
                key={currentStep}
                {...hydrationSafeVariants.slideInFromRight}
                className="text-center"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-gray-600 mb-8">
                  {currentStepData.description}
                </p>

                {/* Special handling for getting started step */}
                {currentStepData.id === 'getting-started' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary-200">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                            <DocumentArrowUpIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">Import CSV</h3>
                          <p className="text-sm text-gray-600">
                            Already have applications in a spreadsheet?
                          </p>
                          <Button 
                            onClick={handleStartWithImport}
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            Import Data
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary-200">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-green-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">Try Sample Data</h3>
                          <p className="text-sm text-gray-600">
                            Explore features with example applications
                          </p>
                          <Button 
                            onClick={handleLoadSampleData}
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            Load Examples
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary-200">
                        <div className="text-center space-y-3">
                          <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                            <PlayIcon className="w-6 h-6 text-purple-600" />
                          </div>
                          <h3 className="font-medium text-gray-900">Start Fresh</h3>
                          <p className="text-sm text-gray-600">
                            Add your first application manually
                          </p>
                          <Button 
                            onClick={handleStartWithApplication}
                            variant="outline" 
                            size="sm"
                            className="w-full"
                          >
                            Add Application
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  currentStepData.content
                )}
              </HydrationSafeMotion>
            </HydrationSafeAnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Step {currentStep + 1} of {wizardSteps.length}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                >
                  Skip Setup
                </Button>

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

                {currentStepData.id !== 'getting-started' && (
                  <Button
                    onClick={isLastStep ? handleFinishAndTour : nextStep}
                    size="sm"
                    rightIcon={!isLastStep ? <ChevronRightIcon className="h-4 w-4" /> : undefined}
                  >
                    {isLastStep ? 'Take Tour' : 'Next'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </HydrationSafeMotion>
    </div>
  )
}