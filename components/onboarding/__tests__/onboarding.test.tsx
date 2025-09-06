import { render, screen, fireEvent } from '@testing-library/react'
import { WelcomeWizard, QuickStart, ProgressiveDisclosure, OnboardingProgress, ContextualHelp } from '../index'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useApplicationStore } from '@/store/applicationStore'

// Mock the stores
jest.mock('@/store/onboardingStore')
jest.mock('@/store/applicationStore')

const mockOnboardingStore = {
  completeStep: jest.fn(),
  loadSampleData: jest.fn(),
  steps: [
    { id: 'welcome', title: 'Welcome', description: 'Test', completed: false },
    { id: 'add-application', title: 'Add App', description: 'Test', completed: false }
  ]
}

const mockApplicationStore = {
  applications: [],
  importApplications: jest.fn(),
  getStats: () => ({
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
  })
}

describe('Onboarding Components', () => {
  beforeEach(() => {
    ;(useOnboardingStore as jest.Mock).mockReturnValue(mockOnboardingStore)
    ;(useApplicationStore as jest.Mock).mockReturnValue(mockApplicationStore)
  })

  describe('WelcomeWizard', () => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      onStartTour: jest.fn(),
      onAddApplication: jest.fn(),
      onImportCSV: jest.fn()
    }

    it('renders welcome wizard when open', () => {
      render(<WelcomeWizard {...defaultProps} />)
      expect(screen.getByText(/Welcome to AI Application Tracker/)).toBeInTheDocument()
    })

    it('does not render when closed', () => {
      render(<WelcomeWizard {...defaultProps} isOpen={false} />)
      expect(screen.queryByText(/Welcome to AI Application Tracker/)).not.toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      render(<WelcomeWizard {...defaultProps} />)
      const closeButton = screen.getByLabelText('Close welcome wizard')
      fireEvent.click(closeButton)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  describe('QuickStart', () => {
    const defaultProps = {
      onAddApplication: jest.fn(),
      onImportCSV: jest.fn(),
      onStartTour: jest.fn()
    }

    it('renders quick start guide', () => {
      render(<QuickStart {...defaultProps} />)
      expect(screen.getByText('Quick Start Guide')).toBeInTheDocument()
    })

    it('shows progress based on completed steps', () => {
      render(<QuickStart {...defaultProps} />)
      expect(screen.getByText(/0\/4 completed/)).toBeInTheDocument()
    })
  })

  describe('ProgressiveDisclosure', () => {
    it('does not render when no applications exist', () => {
      const { container } = render(<ProgressiveDisclosure />)
      expect(container.firstChild).toBeNull()
    })

    it('renders when applications exist', () => {
      ;(useApplicationStore as jest.Mock).mockReturnValue({
        ...mockApplicationStore,
        applications: [{ id: '1', company: 'Test' }]
      })

      render(<ProgressiveDisclosure />)
      // Should render but features might be locked
      expect(screen.queryByText('Coming Soon')).toBeInTheDocument()
    })
  })

  describe('OnboardingProgress', () => {
    it('renders progress milestones', () => {
      render(<OnboardingProgress />)
      expect(screen.getByText('Your Progress')).toBeInTheDocument()
      expect(screen.getByText(/milestones/)).toBeInTheDocument()
    })

    it('shows completed milestones based on application count', () => {
      ;(useApplicationStore as jest.Mock).mockReturnValue({
        ...mockApplicationStore,
        applications: [{ id: '1', company: 'Test' }]
      })

      render(<OnboardingProgress />)
      expect(screen.getByText('First Application Added')).toBeInTheDocument()
    })
  })

  describe('ContextualHelp', () => {
    const mockTips = [
      {
        id: 'test-tip',
        title: 'Test Tip',
        content: 'This is a test tip',
        trigger: 'click' as const,
        position: 'bottom' as const
      }
    ]

    it('renders help triggers', () => {
      render(<ContextualHelp tips={mockTips} />)
      expect(screen.getByLabelText('Show help: Test Tip')).toBeInTheDocument()
    })
  })
})