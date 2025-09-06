/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportModal } from '../ExportModal'
import { Application, ApplicationStats } from '@/types/application'
import * as ExportService from '@/lib/export/exportService'

// Mock the export service
jest.mock('@/lib/export/exportService', () => ({
  ExportService: {
    getDefaultFields: jest.fn(),
    exportApplications: jest.fn(),
    downloadFile: jest.fn()
  }
}))

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockExportService = ExportService.ExportService as jest.Mocked<typeof ExportService.ExportService>

describe('ExportModal', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120,000',
      status: 'Applied',
      priority: 'High',
      appliedDate: '2024-01-15',
      responseDate: null,
      interviewDate: null,
      offerDate: null,
      rejectionDate: null,
      followUpDate: undefined,
      notes: 'Great company',
      jobDescription: 'Full-stack role',
      requirements: ['React', 'Node.js'],
      contactPerson: 'John Doe',
      contactEmail: 'john@techcorp.com',
      contactPhone: '+1-555-0123',
      website: 'https://techcorp.com',
      jobUrl: 'https://techcorp.com/jobs/123',
      companyWebsite: 'https://techcorp.com',
      tags: ['frontend', 'backend'],
      aiMatchScore: 85,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ]

  const mockStats: ApplicationStats = {
    total: 1,
    pending: 0,
    applied: 1,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    accepted: 0,
    successRate: 0,
    averageResponseTime: 0,
    topCompanies: ['Tech Corp'],
    topLocations: ['San Francisco, CA'],
    averageMatchScore: 85,
    aiAnalyzedCount: 1,
    highPotentialCount: 1,
    improvementOpportunities: 0
  }

  const mockFields = [
    { key: 'company' as keyof Application, label: 'Company', selected: true, type: 'string' as const },
    { key: 'position' as keyof Application, label: 'Position', selected: true, type: 'string' as const },
    { key: 'status' as keyof Application, label: 'Status', selected: false, type: 'string' as const }
  ]

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    applications: mockApplications,
    stats: mockStats
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockExportService.getDefaultFields.mockReturnValue(mockFields)
    mockExportService.exportApplications.mockResolvedValue({
      success: true,
      filename: 'test-export.csv',
      data: 'test,data'
    })
  })

  it('renders export modal when open', () => {
    render(<ExportModal {...defaultProps} />)
    
    expect(screen.getByText('Export Applications')).toBeInTheDocument()
    expect(screen.getByText('Export Format')).toBeInTheDocument()
    expect(screen.getByText('Select Fields')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ExportModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Export Applications')).not.toBeInTheDocument()
  })

  it('displays all export format options', () => {
    render(<ExportModal {...defaultProps} />)
    
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('Excel')).toBeInTheDocument()
    expect(screen.getByText('PDF Report')).toBeInTheDocument()
    expect(screen.getByText('JSON')).toBeInTheDocument()
  })

  it('allows format selection', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const excelOption = screen.getByLabelText(/Excel/)
    await user.click(excelOption)
    
    expect(excelOption).toBeChecked()
  })

  it('displays field selection with checkboxes', () => {
    render(<ExportModal {...defaultProps} />)
    
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Position')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    
    // Check that selected fields are checked
    const companyCheckbox = screen.getByRole('checkbox', { name: /Company/ })
    expect(companyCheckbox).toBeChecked()
  })

  it('allows toggling field selection', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const statusCheckbox = screen.getByRole('checkbox', { name: /Status/ })
    expect(statusCheckbox).not.toBeChecked()
    
    await user.click(statusCheckbox)
    expect(statusCheckbox).toBeChecked()
  })

  it('handles select all / deselect all', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const selectAllButton = screen.getByText('Select All')
    await user.click(selectAllButton)
    
    // Should change to "Deselect All" and all checkboxes should be checked
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
    
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      if (checkbox.getAttribute('name') !== 'format') {
        expect(checkbox).toBeChecked()
      }
    })
  })

  it('displays export options when stats are available', () => {
    render(<ExportModal {...defaultProps} />)
    
    expect(screen.getByText('Include statistics summary')).toBeInTheDocument()
    expect(screen.getByText('Include AI insights data')).toBeInTheDocument()
  })

  it('allows setting custom filename', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const filenameInput = screen.getByPlaceholderText(/applications_export_/)
    await user.clear(filenameInput)
    await user.type(filenameInput, 'my-custom-export')
    
    expect(filenameInput).toHaveValue('my-custom-export')
  })

  it('allows setting date range filter', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const startDateInput = screen.getByLabelText('From')
    const endDateInput = screen.getByLabelText('To')
    
    await user.type(startDateInput, '2024-01-01')
    await user.type(endDateInput, '2024-01-31')
    
    expect(startDateInput).toHaveValue('2024-01-01')
    expect(endDateInput).toHaveValue('2024-01-31')
  })

  it('shows preview information', () => {
    render(<ExportModal {...defaultProps} />)
    
    expect(screen.getByText(/1 applications ready for export/)).toBeInTheDocument()
    expect(screen.getByText(/1 applications, 2 fields/)).toBeInTheDocument()
  })

  it('handles successful export', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    const exportButton = screen.getByText(/Export CSV/)
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(mockExportService.exportApplications).toHaveBeenCalledWith(
        mockApplications,
        expect.objectContaining({
          format: 'csv',
          fields: expect.any(Array)
        }),
        mockStats
      )
    })
    
    expect(mockExportService.downloadFile).toHaveBeenCalledWith('test,data', 'test-export.csv')
  })

  it('handles export error', async () => {
    const user = userEvent.setup()
    mockExportService.exportApplications.mockResolvedValue({
      success: false,
      filename: '',
      error: 'Export failed'
    })
    
    render(<ExportModal {...defaultProps} />)
    
    const exportButton = screen.getByText(/Export CSV/)
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(mockExportService.exportApplications).toHaveBeenCalled()
    })
    
    // Should not call downloadFile on error
    expect(mockExportService.downloadFile).not.toHaveBeenCalled()
  })

  it('prevents export when no fields are selected', async () => {
    const user = userEvent.setup()
    
    // Mock fields with none selected
    const noSelectedFields = mockFields.map(f => ({ ...f, selected: false }))
    mockExportService.getDefaultFields.mockReturnValue(noSelectedFields)
    
    render(<ExportModal {...defaultProps} />)
    
    const exportButton = screen.getByText(/Export CSV/)
    expect(exportButton).toBeDisabled()
  })

  it('shows loading state during export', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed export
    mockExportService.exportApplications.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        filename: 'test.csv',
        data: 'test'
      }), 100))
    )
    
    render(<ExportModal {...defaultProps} />)
    
    const exportButton = screen.getByText(/Export CSV/)
    await user.click(exportButton)
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument()
    expect(exportButton).toBeDisabled()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<ExportModal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    render(<ExportModal {...defaultProps} onClose={onClose} />)
    
    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('updates export button text based on selected format', async () => {
    const user = userEvent.setup()
    render(<ExportModal {...defaultProps} />)
    
    // Initially should show CSV
    expect(screen.getByText(/Export CSV/)).toBeInTheDocument()
    
    // Change to Excel
    const excelOption = screen.getByLabelText(/Excel/)
    await user.click(excelOption)
    
    expect(screen.getByText(/Export EXCEL/)).toBeInTheDocument()
  })
})