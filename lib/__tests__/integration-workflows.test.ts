/**
 * Integration Tests for User Workflows and Data Operations
 * Tests complete user journeys and data flow through the application
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ApplicationStore } from '../../store/applicationStore'
import { OnboardingStore } from '../../store/onboardingStore'
import Dashboard from '../../components/Dashboard'
import ImportModal from '../../components/ImportModal'
import AddApplicationModal from '../../components/AddApplicationModal'
import type { Application } from '../../types/application'

// Mock external dependencies
jest.mock('../../lib/indexeddb')
jest.mock('../../lib/ai')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('User Workflow Integration Tests', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()
    
    // Reset stores
    ApplicationStore.getState().clearApplications()
    OnboardingStore.getState().resetOnboarding()
  })

  afterEach(() => {
    queryClient.clear()
    jest.clearAllMocks()
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('First-Time User Onboarding Workflow', () => {
    it('should guide new users through complete onboarding process', async () => {
      renderWithProviders(<Dashboard />)

      // Should show welcome message for new users
      expect(screen.getByText(/welcome to ai application tracker/i)).toBeInTheDocument()
      
      // Should show onboarding tour option
      const startTourButton = screen.getByRole('button', { name: /start tour/i })
      expect(startTourButton).toBeInTheDocument()

      // Start the tour
      await user.click(startTourButton)
      
      // Should show first tour step
      expect(screen.getByText(/let's get you started/i)).toBeInTheDocument()
      
      // Progress through tour steps
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      // Should show import data step
      expect(screen.getByText(/import your existing applications/i)).toBeInTheDocument()
      
      // Skip to end of tour
      const skipButton = screen.getByRole('button', { name: /skip tour/i })
      await user.click(skipButton)
      
      // Should mark onboarding as completed
      await waitFor(() => {
        expect(OnboardingStore.getState().isCompleted).toBe(true)
      })
    })

    it('should allow users to start with sample data', async () => {
      renderWithProviders(<Dashboard />)

      const loadSampleButton = screen.getByRole('button', { name: /load sample data/i })
      await user.click(loadSampleButton)

      // Should load sample applications
      await waitFor(() => {
        expect(ApplicationStore.getState().applications.length).toBeGreaterThan(0)
      })

      // Should show applications in the table
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText(/google/i)).toBeInTheDocument()
    })
  })

  describe('CSV Import Workflow', () => {
    it('should complete full CSV import process with field mapping', async () => {
      renderWithProviders(<ImportModal isOpen={true} onClose={jest.fn()} />)

      // Step 1: File upload
      const fileInput = screen.getByLabelText(/upload csv file/i)
      const csvFile = new File(['Company,Position,Status\nGoogle,Engineer,Applied'], 'applications.csv', {
        type: 'text/csv'
      })
      
      await user.upload(fileInput, csvFile)

      // Should show file analysis
      await waitFor(() => {
        expect(screen.getByText(/analyzing file/i)).toBeInTheDocument()
      })

      // Step 2: Field mapping
      await waitFor(() => {
        expect(screen.getByText(/map your fields/i)).toBeInTheDocument()
      })

      // Should show detected mappings
      expect(screen.getByText(/company/i)).toBeInTheDocument()
      expect(screen.getByText(/position/i)).toBeInTheDocument()
      expect(screen.getByText(/status/i)).toBeInTheDocument()

      // Confirm mappings
      const confirmMappingButton = screen.getByRole('button', { name: /confirm mapping/i })
      await user.click(confirmMappingButton)

      // Step 3: Data validation
      await waitFor(() => {
        expect(screen.getByText(/validating data/i)).toBeInTheDocument()
      })

      // Step 4: Import preview
      await waitFor(() => {
        expect(screen.getByText(/import preview/i)).toBeInTheDocument()
      })

      // Should show preview table
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText(/google/i)).toBeInTheDocument()

      // Complete import
      const importButton = screen.getByRole('button', { name: /import applications/i })
      await user.click(importButton)

      // Step 5: Import completion
      await waitFor(() => {
        expect(screen.getByText(/import successful/i)).toBeInTheDocument()
      })

      // Should show import summary
      expect(screen.getByText(/1 application imported/i)).toBeInTheDocument()
    })

    it('should handle CSV import with validation errors', async () => {
      renderWithProviders(<ImportModal isOpen={true} onClose={jest.fn()} />)

      // Upload CSV with validation issues
      const fileInput = screen.getByLabelText(/upload csv file/i)
      const csvFile = new File([
        'Company,Position,Status,Applied Date\n' +
        ',Engineer,Applied,2024-01-15\n' + // Missing company
        'Google,,Applied,invalid-date\n' + // Missing position, invalid date
        'Microsoft,Manager,InvalidStatus,2024-01-20' // Invalid status
      ], 'applications.csv', { type: 'text/csv' })
      
      await user.upload(fileInput, csvFile)

      // Complete field mapping
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm mapping/i })
        user.click(confirmButton)
      })

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/validation issues found/i)).toBeInTheDocument()
      })

      // Should show specific errors
      expect(screen.getByText(/company name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/position is required/i)).toBeInTheDocument()
      expect(screen.getByText(/invalid date format/i)).toBeInTheDocument()

      // Should show suggestions
      expect(screen.getByText(/suggested fixes/i)).toBeInTheDocument()

      // User can choose to fix or skip errors
      const skipErrorsButton = screen.getByRole('button', { name: /import valid rows only/i })
      await user.click(skipErrorsButton)

      // Should import only valid rows
      await waitFor(() => {
        expect(screen.getByText(/1 application imported/i)).toBeInTheDocument()
        expect(screen.getByText(/2 rows skipped due to errors/i)).toBeInTheDocument()
      })
    })

    it('should handle duplicate detection during import', async () => {
      // Pre-populate with existing application
      ApplicationStore.getState().addApplication({
        id: '1',
        company: 'Google',
        position: 'Software Engineer',
        status: 'Applied',
        appliedDate: new Date('2024-01-15'),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      } as Application)

      renderWithProviders(<ImportModal isOpen={true} onClose={jest.fn()} />)

      // Upload CSV with duplicate
      const fileInput = screen.getByLabelText(/upload csv file/i)
      const csvFile = new File([
        'Company,Position,Status,Applied Date\n' +
        'Google,Software Engineer,Applied,2024-01-15'
      ], 'applications.csv', { type: 'text/csv' })
      
      await user.upload(fileInput, csvFile)

      // Complete field mapping and validation
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm mapping/i })
        user.click(confirmButton)
      })

      // Should detect duplicates
      await waitFor(() => {
        expect(screen.getByText(/duplicates detected/i)).toBeInTheDocument()
      })

      // Should show duplicate resolution options
      expect(screen.getByText(/merge with existing/i)).toBeInTheDocument()
      expect(screen.getByText(/skip duplicate/i)).toBeInTheDocument()
      expect(screen.getByText(/import as new/i)).toBeInTheDocument()

      // Choose to skip duplicate
      const skipButton = screen.getByRole('button', { name: /skip duplicate/i })
      await user.click(skipButton)

      // Complete import
      const importButton = screen.getByRole('button', { name: /import applications/i })
      await user.click(importButton)

      // Should show no new applications imported
      await waitFor(() => {
        expect(screen.getByText(/0 applications imported/i)).toBeInTheDocument()
        expect(screen.getByText(/1 duplicate skipped/i)).toBeInTheDocument()
      })
    })
  })

  describe('Application Management Workflow', () => {
    it('should complete full application creation workflow', async () => {
      renderWithProviders(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)

      // Fill in basic information
      await user.type(screen.getByLabelText(/company/i), 'Google')
      await user.type(screen.getByLabelText(/position/i), 'Software Engineer')
      
      // Should show auto-suggestions
      await waitFor(() => {
        expect(screen.getByText(/google inc/i)).toBeInTheDocument()
      })

      // Select suggestion
      await user.click(screen.getByText(/google inc/i))

      // Fill in additional fields
      await user.type(screen.getByLabelText(/location/i), 'Mountain View, CA')
      await user.selectOptions(screen.getByLabelText(/status/i), 'Applied')
      
      // Set application date
      const dateInput = screen.getByLabelText(/applied date/i)
      await user.type(dateInput, '2024-01-15')

      // Add notes
      await user.type(screen.getByLabelText(/notes/i), 'Applied through company website')

      // Submit application
      const submitButton = screen.getByRole('button', { name: /add application/i })
      await user.click(submitButton)

      // Should add to store
      await waitFor(() => {
        expect(ApplicationStore.getState().applications.length).toBe(1)
      })

      // Should show success message
      expect(screen.getByText(/application added successfully/i)).toBeInTheDocument()
    })

    it('should handle job URL parsing workflow', async () => {
      renderWithProviders(<AddApplicationModal isOpen={true} onClose={jest.fn()} />)

      // Paste job URL
      const urlInput = screen.getByLabelText(/job url/i)
      await user.type(urlInput, 'https://careers.google.com/jobs/results/123456789')

      // Should trigger URL parsing
      await waitFor(() => {
        expect(screen.getByText(/parsing job details/i)).toBeInTheDocument()
      })

      // Should auto-fill fields from URL
      await waitFor(() => {
        expect(screen.getByDisplayValue(/google/i)).toBeInTheDocument()
        expect(screen.getByDisplayValue(/software engineer/i)).toBeInTheDocument()
      })

      // User can review and modify parsed data
      const positionInput = screen.getByLabelText(/position/i)
      await user.clear(positionInput)
      await user.type(positionInput, 'Senior Software Engineer')

      // Submit application
      const submitButton = screen.getByRole('button', { name: /add application/i })
      await user.click(submitButton)

      // Should save with modified data
      await waitFor(() => {
        const applications = ApplicationStore.getState().applications
        expect(applications[0].position).toBe('Senior Software Engineer')
      })
    })
  })

  describe('Data Export Workflow', () => {
    beforeEach(() => {
      // Add sample applications
      const sampleApps: Application[] = [
        {
          id: '1',
          company: 'Google',
          position: 'Software Engineer',
          status: 'Applied',
          appliedDate: new Date('2024-01-15'),
          notes: 'Applied through website',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          company: 'Microsoft',
          position: 'Product Manager',
          status: 'Interviewing',
          appliedDate: new Date('2024-01-20'),
          notes: 'Phone interview scheduled',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as Application[]

      sampleApps.forEach(app => ApplicationStore.getState().addApplication(app))
    })

    it('should complete CSV export workflow', async () => {
      renderWithProviders(<Dashboard />)

      // Open export modal
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Should show export options
      expect(screen.getByText(/export format/i)).toBeInTheDocument()
      
      // Select CSV format
      await user.click(screen.getByLabelText(/csv/i))

      // Select fields to export
      expect(screen.getByText(/select fields/i)).toBeInTheDocument()
      await user.click(screen.getByLabelText(/company/i))
      await user.click(screen.getByLabelText(/position/i))
      await user.click(screen.getByLabelText(/status/i))

      // Start export
      const startExportButton = screen.getByRole('button', { name: /export data/i })
      await user.click(startExportButton)

      // Should show export progress
      await waitFor(() => {
        expect(screen.getByText(/preparing export/i)).toBeInTheDocument()
      })

      // Should complete export
      await waitFor(() => {
        expect(screen.getByText(/export ready/i)).toBeInTheDocument()
      })

      // Should provide download link
      expect(screen.getByRole('link', { name: /download/i })).toBeInTheDocument()
    })
  })

  describe('AI Insights Workflow', () => {
    beforeEach(() => {
      // Add applications with various statuses for analysis
      const sampleApps: Application[] = [
        { id: '1', company: 'Google', position: 'Engineer', status: 'Applied', appliedDate: new Date('2024-01-01') },
        { id: '2', company: 'Microsoft', position: 'Engineer', status: 'Interviewing', appliedDate: new Date('2024-01-05') },
        { id: '3', company: 'Apple', position: 'Engineer', status: 'Rejected', appliedDate: new Date('2024-01-10') },
        { id: '4', company: 'Meta', position: 'Engineer', status: 'Offered', appliedDate: new Date('2024-01-15') },
      ] as Application[]

      sampleApps.forEach(app => ApplicationStore.getState().addApplication(app))
    })

    it('should generate and display AI insights', async () => {
      renderWithProviders(<Dashboard />)

      // Should show AI insights section
      expect(screen.getByText(/ai insights/i)).toBeInTheDocument()

      // Click to generate insights
      const generateInsightsButton = screen.getByRole('button', { name: /analyze applications/i })
      await user.click(generateInsightsButton)

      // Should show analysis in progress
      await waitFor(() => {
        expect(screen.getByText(/analyzing your applications/i)).toBeInTheDocument()
      })

      // Should display insights
      await waitFor(() => {
        expect(screen.getByText(/success rate/i)).toBeInTheDocument()
        expect(screen.getByText(/25%/i)).toBeInTheDocument() // 1 offer out of 4 applications
      })

      // Should show recommendations
      expect(screen.getByText(/recommendations/i)).toBeInTheDocument()
      expect(screen.getByText(/follow up/i)).toBeInTheDocument()
    })
  })

  describe('Error Recovery Workflows', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      renderWithProviders(<Dashboard />)

      // Try to perform an action that requires network
      const addButton = screen.getByRole('button', { name: /add application/i })
      await user.click(addButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })

      // Should provide retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

      // Should allow offline functionality
      expect(screen.getByText(/working offline/i)).toBeInTheDocument()
    })

    it('should recover from application crashes', async () => {
      // Simulate component error
      const ThrowError = () => {
        throw new Error('Component crashed')
      }

      const { rerender } = renderWithProviders(
        <div>
          <ThrowError />
          <Dashboard />
        </div>
      )

      // Should show error boundary
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()

      // Should allow recovery
      rerender(renderWithProviders(<Dashboard />))
      
      expect(screen.getByText(/ai application tracker/i)).toBeInTheDocument()
    })
  })
})