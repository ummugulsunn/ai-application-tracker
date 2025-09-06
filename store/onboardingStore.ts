import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  optional?: boolean
}

export interface OnboardingState {
  isFirstVisit: boolean
  currentStep: number
  steps: OnboardingStep[]
  showWelcomeWizard: boolean
  showFeatureTour: boolean
  hasLoadedSampleData: boolean
  completedMilestones: string[]
  dismissedTips: string[]
  tourCompletedAt?: string
  onboardingCompletedAt?: string
  
  // Actions
  completeStep: (stepId: string) => void
  setCurrentStep: (step: number) => void
  showWizard: () => void
  hideWizard: () => void
  showTour: () => void
  hideTour: () => void
  loadSampleData: () => void
  resetOnboarding: () => void
  skipOnboarding: () => void
  completeMilestone: (milestoneId: string) => void
  dismissTip: (tipId: string) => void
  markTourCompleted: () => void
  markOnboardingCompleted: () => void
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Application Tracker',
    description: 'Learn how to get the most out of your job search tracking',
    completed: false
  },
  {
    id: 'add-application',
    title: 'Add Your First Application',
    description: 'Track your job applications manually or import from CSV',
    completed: false
  },
  {
    id: 'explore-features',
    title: 'Explore Key Features',
    description: 'Discover analytics, AI insights, and smart tracking',
    completed: false
  },
  {
    id: 'customize-experience',
    title: 'Customize Your Experience',
    description: 'Set up preferences and explore advanced features',
    completed: false,
    optional: true
  }
]

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isFirstVisit: true,
      currentStep: 0,
      steps: defaultSteps,
      showWelcomeWizard: false,
      showFeatureTour: false,
      hasLoadedSampleData: false,
      completedMilestones: [],
      dismissedTips: [],

      completeStep: (stepId) => {
        set((state) => ({
          steps: state.steps.map(step =>
            step.id === stepId ? { ...step, completed: true } : step
          )
        }))
      },

      setCurrentStep: (step) => {
        set({ currentStep: step })
      },

      showWizard: () => {
        set({ showWelcomeWizard: true })
      },

      hideWizard: () => {
        set({ showWelcomeWizard: false })
      },

      showTour: () => {
        set({ showFeatureTour: true })
      },

      hideTour: () => {
        set({ showFeatureTour: false })
      },

      loadSampleData: () => {
        set({ hasLoadedSampleData: true })
      },

      resetOnboarding: () => {
        set({
          isFirstVisit: true,
          currentStep: 0,
          steps: defaultSteps,
          showWelcomeWizard: false,
          showFeatureTour: false,
          hasLoadedSampleData: false,
          completedMilestones: [],
          dismissedTips: [],
          tourCompletedAt: undefined,
          onboardingCompletedAt: undefined
        })
      },

      skipOnboarding: () => {
        set({
          isFirstVisit: false,
          showWelcomeWizard: false,
          showFeatureTour: false,
          steps: defaultSteps.map(step => ({ ...step, completed: true })),
          onboardingCompletedAt: new Date().toISOString()
        })
      },

      completeMilestone: (milestoneId) => {
        set((state) => ({
          completedMilestones: [...state.completedMilestones, milestoneId]
        }))
      },

      dismissTip: (tipId) => {
        set((state) => ({
          dismissedTips: [...state.dismissedTips, tipId]
        }))
      },

      markTourCompleted: () => {
        set({ tourCompletedAt: new Date().toISOString() })
      },

      markOnboardingCompleted: () => {
        set({ 
          onboardingCompletedAt: new Date().toISOString(),
          isFirstVisit: false
        })
      }
    }),
    {
      name: 'onboarding-store',
      partialize: (state) => ({
        isFirstVisit: state.isFirstVisit,
        currentStep: state.currentStep,
        steps: state.steps,
        hasLoadedSampleData: state.hasLoadedSampleData,
        completedMilestones: state.completedMilestones,
        dismissedTips: state.dismissedTips,
        tourCompletedAt: state.tourCompletedAt,
        onboardingCompletedAt: state.onboardingCompletedAt
      })
    }
  )
)