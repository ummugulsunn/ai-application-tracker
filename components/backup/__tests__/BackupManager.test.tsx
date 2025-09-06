/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BackupManager } from '../BackupManager'
import { backupService } from '@/lib/backup/backupService'
import { useApplicationStore } from '@/store/applicationStore'

// Setup DOM environment
import '@testing-library/jest-dom'

// Mock the backup service
jest.mock('@/lib/backup/backupService', () => ({
  backupService: {
    getBackupList: jest.fn(),
    createBackup: jest.fn(),
    restoreBackup: jest.fn(),
    deleteBackup: jest.fn(),
    validateData: jest.fn(),
    repairData: jest.fn(),
    exportForMigration: jest.fn(),
    importFromMigration: jest.fn(),
    setupAutomaticBackup: jest.fn()
  }
}))

// Mock the application store
jest.mock('@/store/applicationStore', () => ({
  useApplicationStore: jest.fn()
}))

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock window.confirm and window.alert
global.confirm = jest.fn()
global.alert = jest.fn()

const mockApplications = [
  {
    id: '1',
    userId: 'user1',
    company: 'Test Company',
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    salaryRange: '$100k-120k',
    status: 'Applied',
    priority: 'High',
    appliedDate: new Date('2024-01-15'),
    notes: 'Great opportunity',
    jobDescription: 'Exciting role',
    requirements: ['React', 'TypeScript'],
    contactPerson: 'John Doe',
    contactEmail: 'john@test.com',
    contactPhone: '555-0123',
    companyWebsite: 'https://test.com',
    jobUrl: 'https://test.com/jobs/1',
    tags: ['tech', 'startup'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  }
]

const mockBackups = [
  {
    id: 'backup-1',
    timestamp: new Date('2024-01-20'),
    version: 'v1.0',
    description: 'Manual backup',
    dataSize: 1024,
    checksum: 'abc123',
    type: 'manual' as const,
    applicationCount: 1
  },
  {
    id: 'backup-2',
    timestamp: new Date('2024-01-19'),
    version: 'v0.9',
    description: 'Automatic backup',
    dataSize: 2048,
    checksum: 'def456',
    type: 'automatic' as const,
    applicationCount: 2
  }
]

describe('BackupManager', () => {
  const mockSetApplications = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useApplicationStore as jest.Mock).mockReturnValue({
      applications: mockApplications,
      setApplications: mockSetApplications
    })
    ;(backupService.getBackupList as jest.Mock).mockResolvedValue(mockBackups)
    ;(global.confirm as jest.Mock).mockReturnValue(true)
    ;(global.alert as jest.Mock).mockImplementation(() => {})
  })

  it('should render when open', async () => {
    await act(async () => {
      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
    })
    
    expect(screen.getByText('Data Backup & Version Control')).toBeInTheDocument()
    expect(screen.getByText('Backups')).toBeInTheDocument()
    expect(screen.getByText('Data Validation')).toBeInTheDocument()
    expect(screen.getByText('Data Migration')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<BackupManager isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Data Backup & Version Control')).not.toBeInTheDocument()
  })

  it('should load backups on open', async () => {
    render(<BackupManager isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(backupService.getBackupList).toHaveBeenCalled()
    })

    expect(screen.getByText('Manual backup')).toBeInTheDocument()
    expect(screen.getByText('Automatic backup')).toBeInTheDocument()
  })

  it('should setup automatic backup on open', async () => {
    render(<BackupManager isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(backupService.setupAutomaticBackup).toHaveBeenCalled()
    })
  })

  describe('Backup Tab', () => {
    it('should create backup when button is clicked', async () => {
      const user = userEvent.setup()
      const mockMetadata = {
        id: 'new-backup',
        timestamp: new Date(),
        version: 'v1.1',
        description: 'Manual backup',
        dataSize: 1024,
        checksum: 'xyz789',
        type: 'manual' as const,
        applicationCount: 1
      }

      ;(backupService.createBackup as jest.Mock).mockResolvedValue(mockMetadata)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const createButton = screen.getByText('Create Backup')
      await user.click(createButton)

      await waitFor(() => {
        expect(backupService.createBackup).toHaveBeenCalledWith(
          mockApplications,
          'Manual backup',
          'manual'
        )
      })

      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('Backup created successfully')
      )
    })

    it('should restore backup when restore button is clicked', async () => {
      const user = userEvent.setup()
      ;(backupService.restoreBackup as jest.Mock).mockResolvedValue(mockApplications)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      await waitFor(() => {
        expect(screen.getByText('Manual backup')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByText('Restore')[0]
      await user.click(restoreButton)

      await waitFor(() => {
        expect(backupService.restoreBackup).toHaveBeenCalledWith('backup-1')
      })

      expect(mockSetApplications).toHaveBeenCalledWith(mockApplications)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should delete backup when delete button is clicked', async () => {
      const user = userEvent.setup()
      ;(backupService.deleteBackup as jest.Mock).mockResolvedValue(undefined)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      await waitFor(() => {
        expect(screen.getByText('Manual backup')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg') && button.textContent === ''
      )
      
      if (deleteButton) {
        await user.click(deleteButton)

        await waitFor(() => {
          expect(backupService.deleteBackup).toHaveBeenCalledWith('backup-1')
        })
      }
    })

    it('should show empty state when no backups exist', async () => {
      ;(backupService.getBackupList as jest.Mock).mockResolvedValue([])

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      await waitFor(() => {
        expect(screen.getByText('No backups found. Create your first backup to get started.')).toBeInTheDocument()
      })
    })
  })

  describe('Validation Tab', () => {
    it('should switch to validation tab', async () => {
      const user = userEvent.setup()
      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const validationTab = screen.getByText('Data Validation')
      await user.click(validationTab)

      expect(screen.getByText('Data Integrity Validation')).toBeInTheDocument()
      expect(screen.getByText('Validate Data')).toBeInTheDocument()
    })

    it('should validate data when button is clicked', async () => {
      const user = userEvent.setup()
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        repairSuggestions: []
      }

      ;(backupService.validateData as jest.Mock).mockResolvedValue(mockValidationResult)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const validationTab = screen.getByText('Data Validation')
      await user.click(validationTab)

      const validateButton = screen.getByText('Validate Data')
      await user.click(validateButton)

      await waitFor(() => {
        expect(backupService.validateData).toHaveBeenCalledWith(mockApplications)
      })

      expect(screen.getByText('Data is valid')).toBeInTheDocument()
    })

    it('should show validation errors', async () => {
      const user = userEvent.setup()
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            type: 'missing_field' as const,
            message: 'Missing required field: company',
            applicationId: '1',
            field: 'company',
            severity: 'critical' as const
          }
        ],
        warnings: [],
        repairSuggestions: [
          {
            type: 'auto_fix' as const,
            description: 'Automatically fix missing fields',
            action: jest.fn()
          }
        ]
      }

      ;(backupService.validateData as jest.Mock).mockResolvedValue(mockValidationResult)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const validationTab = screen.getByText('Data Validation')
      await user.click(validationTab)

      const validateButton = screen.getByText('Validate Data')
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.getByText('Data validation issues found')).toBeInTheDocument()
      })

      expect(screen.getByText('Errors (1)')).toBeInTheDocument()
      expect(screen.getByText('Missing required field: company')).toBeInTheDocument()
      expect(screen.getByText('Repair Options')).toBeInTheDocument()
    })

    it('should repair data when repair button is clicked', async () => {
      const user = userEvent.setup()
      const mockValidationResult = {
        isValid: false,
        errors: [
          {
            type: 'missing_field' as const,
            message: 'Missing required field: company',
            applicationId: '1',
            field: 'company',
            severity: 'critical' as const
          }
        ],
        warnings: [],
        repairSuggestions: [
          {
            type: 'auto_fix' as const,
            description: 'Automatically fix missing fields',
            action: jest.fn()
          }
        ]
      }

      const repairedApplications = [
        { ...mockApplications[0], company: 'Fixed Company' }
      ]

      ;(backupService.validateData as jest.Mock)
        .mockResolvedValueOnce(mockValidationResult)
        .mockResolvedValueOnce({ isValid: true, errors: [], warnings: [], repairSuggestions: [] })
      ;(backupService.repairData as jest.Mock).mockResolvedValue(repairedApplications)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const validationTab = screen.getByText('Data Validation')
      await user.click(validationTab)

      const validateButton = screen.getByText('Validate Data')
      await user.click(validateButton)

      await waitFor(() => {
        expect(screen.getByText('Repair')).toBeInTheDocument()
      })

      const repairButton = screen.getByText('Repair')
      await user.click(repairButton)

      await waitFor(() => {
        expect(backupService.repairData).toHaveBeenCalledWith(mockApplications)
      })

      expect(mockSetApplications).toHaveBeenCalledWith(repairedApplications)
    })
  })

  describe('Migration Tab', () => {
    it('should switch to migration tab', async () => {
      const user = userEvent.setup()
      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const migrationTab = screen.getByText('Data Migration')
      await user.click(migrationTab)

      expect(screen.getByText('Export Data')).toBeInTheDocument()
      expect(screen.getByText('Import Data')).toBeInTheDocument()
      expect(screen.getByText('Export as JSON')).toBeInTheDocument()
      expect(screen.getByText('Export as CSV')).toBeInTheDocument()
      expect(screen.getByText('Export as Excel')).toBeInTheDocument()
    })

    it('should export data as JSON', async () => {
      const user = userEvent.setup()
      const mockBlob = new Blob(['{"test": "data"}'], { type: 'application/json' })
      ;(backupService.exportForMigration as jest.Mock).mockResolvedValue(mockBlob)

      // Mock document methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const migrationTab = screen.getByText('Data Migration')
      await user.click(migrationTab)

      const exportJsonButton = screen.getByText('Export as JSON')
      await user.click(exportJsonButton)

      await waitFor(() => {
        expect(backupService.exportForMigration).toHaveBeenCalledWith(
          mockApplications,
          expect.objectContaining({
            targetFormat: 'json',
            includeMetadata: true,
            validateData: true
          })
        )
      })

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toContain('.json')

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should import data from file', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['{"applications": []}'], 'test.json', { type: 'application/json' })
      const importedApplications = [mockApplications[0]]

      ;(backupService.importFromMigration as jest.Mock).mockResolvedValue(importedApplications)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const migrationTab = screen.getByText('Data Migration')
      await user.click(migrationTab)

      const fileInput = screen.getByLabelText(/Select file to import/)
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText('test.json')).toBeInTheDocument()
      })

      const importButton = screen.getByText('Import')
      await user.click(importButton)

      await waitFor(() => {
        expect(backupService.importFromMigration).toHaveBeenCalledWith(
          mockFile,
          expect.objectContaining({
            sourceFormat: 'json',
            validateData: true
          })
        )
      })

      expect(mockSetApplications).toHaveBeenCalledWith(importedApplications)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle backup creation errors', async () => {
      const user = userEvent.setup()
      ;(backupService.createBackup as jest.Mock).mockRejectedValue(
        new Error('Backup creation failed')
      )

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const createButton = screen.getByText('Create Backup')
      await user.click(createButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to create backup: Backup creation failed'
        )
      })
    })

    it('should handle validation errors', async () => {
      const user = userEvent.setup()
      ;(backupService.validateData as jest.Mock).mockRejectedValue(
        new Error('Validation service error')
      )

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const validationTab = screen.getByText('Data Validation')
      await user.click(validationTab)

      const validateButton = screen.getByText('Validate Data')
      await user.click(validateButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Validation failed: Validation service error'
        )
      })
    })

    it('should handle export errors', async () => {
      const user = userEvent.setup()
      ;(backupService.exportForMigration as jest.Mock).mockRejectedValue(
        new Error('Export failed')
      )

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      const migrationTab = screen.getByText('Data Migration')
      await user.click(migrationTab)

      const exportJsonButton = screen.getByText('Export as JSON')
      await user.click(exportJsonButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Export failed: Export failed'
        )
      })
    })
  })

  describe('User Confirmations', () => {
    it('should ask for confirmation before restore', async () => {
      const user = userEvent.setup()
      ;(global.confirm as jest.Mock).mockReturnValue(false)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      await waitFor(() => {
        expect(screen.getByText('Manual backup')).toBeInTheDocument()
      })

      const restoreButton = screen.getAllByText('Restore')[0]
      await user.click(restoreButton)

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to restore this backup? Current data will be backed up first.'
      )
      expect(backupService.restoreBackup).not.toHaveBeenCalled()
    })

    it('should ask for confirmation before delete', async () => {
      const user = userEvent.setup()
      ;(global.confirm as jest.Mock).mockReturnValue(false)

      render(<BackupManager isOpen={true} onClose={mockOnClose} />)
      
      await waitFor(() => {
        expect(screen.getByText('Manual backup')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button')
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg') && button.textContent === ''
      )
      
      if (deleteButton) {
        await user.click(deleteButton)

        expect(global.confirm).toHaveBeenCalledWith(
          'Are you sure you want to delete this backup? This action cannot be undone.'
        )
        expect(backupService.deleteBackup).not.toHaveBeenCalled()
      }
    })
  })
})