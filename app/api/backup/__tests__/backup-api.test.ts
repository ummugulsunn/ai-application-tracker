/**
 * @jest-environment node
 */

// Mock the backup service before importing anything else
jest.mock('@/lib/backup/backupService', () => ({
  backupService: {
    createBackup: jest.fn(),
    getBackupList: jest.fn(),
    restoreBackup: jest.fn(),
    validateData: jest.fn(),
    repairData: jest.fn()
  }
}))

import { NextRequest } from 'next/server'
import { POST as createBackup } from '../create/route'
import { GET as listBackups } from '../list/route'
import { POST as restoreBackup } from '../restore/route'
import { POST as validateData } from '../validate/route'
import { POST as repairData } from '../repair/route'

import { backupService } from '@/lib/backup/backupService'

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

describe('Backup API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/backup/create', () => {
    it('should create backup successfully', async () => {
      const mockMetadata = {
        id: 'backup-123',
        timestamp: new Date(),
        version: 'v1.0',
        description: 'Test backup',
        dataSize: 1024,
        checksum: 'abc123',
        type: 'manual' as const,
        applicationCount: 1
      }

      ;(backupService.createBackup as jest.Mock).mockResolvedValue(mockMetadata)

      const request = new NextRequest('http://localhost/api/backup/create', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications,
          description: 'Test backup',
          type: 'manual'
        })
      })

      const response = await createBackup(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockMetadata)
      expect(backupService.createBackup).toHaveBeenCalledWith(
        mockApplications,
        'Test backup',
        'manual'
      )
    })

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost/api/backup/create', {
        method: 'POST',
        body: JSON.stringify({
          applications: 'invalid', // Should be array
          type: 'invalid_type' // Invalid enum value
        })
      })

      const response = await createBackup(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle service errors', async () => {
      ;(backupService.createBackup as jest.Mock).mockRejectedValue(
        new Error('Backup creation failed')
      )

      const request = new NextRequest('http://localhost/api/backup/create', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await createBackup(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('BACKUP_CREATION_FAILED')
      expect(data.error.message).toBe('Backup creation failed')
    })
  })

  describe('GET /api/backup/list', () => {
    it('should return backup list successfully', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          timestamp: new Date(),
          version: 'v1.0',
          description: 'Backup 1',
          dataSize: 1024,
          checksum: 'abc123',
          type: 'manual' as const,
          applicationCount: 1
        },
        {
          id: 'backup-2',
          timestamp: new Date(),
          version: 'v1.1',
          description: 'Backup 2',
          dataSize: 2048,
          checksum: 'def456',
          type: 'automatic' as const,
          applicationCount: 2
        }
      ]

      ;(backupService.getBackupList as jest.Mock).mockResolvedValue(mockBackups)

      const request = new NextRequest('http://localhost/api/backup/list')
      const response = await listBackups(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockBackups)
      expect(backupService.getBackupList).toHaveBeenCalled()
    })

    it('should handle service errors', async () => {
      ;(backupService.getBackupList as jest.Mock).mockRejectedValue(
        new Error('Failed to get backup list')
      )

      const request = new NextRequest('http://localhost/api/backup/list')
      const response = await listBackups(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('BACKUP_LIST_FAILED')
    })
  })

  describe('POST /api/backup/restore', () => {
    it('should restore backup successfully', async () => {
      ;(backupService.restoreBackup as jest.Mock).mockResolvedValue(mockApplications)

      const request = new NextRequest('http://localhost/api/backup/restore', {
        method: 'POST',
        body: JSON.stringify({
          backupId: 'backup-123'
        })
      })

      const response = await restoreBackup(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockApplications)
      expect(backupService.restoreBackup).toHaveBeenCalledWith('backup-123')
    })

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost/api/backup/restore', {
        method: 'POST',
        body: JSON.stringify({
          backupId: 123 // Should be string
        })
      })

      const response = await restoreBackup(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should handle service errors', async () => {
      ;(backupService.restoreBackup as jest.Mock).mockRejectedValue(
        new Error('Backup not found')
      )

      const request = new NextRequest('http://localhost/api/backup/restore', {
        method: 'POST',
        body: JSON.stringify({
          backupId: 'non-existent'
        })
      })

      const response = await restoreBackup(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('BACKUP_RESTORATION_FAILED')
    })
  })

  describe('POST /api/backup/validate', () => {
    it('should validate data successfully', async () => {
      const mockValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        repairSuggestions: []
      }

      ;(backupService.validateData as jest.Mock).mockResolvedValue(mockValidationResult)

      const request = new NextRequest('http://localhost/api/backup/validate', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await validateData(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockValidationResult)
      expect(backupService.validateData).toHaveBeenCalledWith(mockApplications)
    })

    it('should handle validation with errors', async () => {
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

      const request = new NextRequest('http://localhost/api/backup/validate', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await validateData(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isValid).toBe(false)
      expect(data.data.errors).toHaveLength(1)
      expect(data.data.repairSuggestions).toHaveLength(1)
    })

    it('should handle service errors', async () => {
      ;(backupService.validateData as jest.Mock).mockRejectedValue(
        new Error('Validation service error')
      )

      const request = new NextRequest('http://localhost/api/backup/validate', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await validateData(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATA_VALIDATION_FAILED')
    })
  })

  describe('POST /api/backup/repair', () => {
    it('should repair data successfully', async () => {
      const repairedApplications = [
        {
          ...mockApplications[0],
          id: 'repaired-id' // Fixed ID
        }
      ]

      ;(backupService.repairData as jest.Mock).mockResolvedValue(repairedApplications)

      const request = new NextRequest('http://localhost/api/backup/repair', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications,
          repairOptions: ['fix_ids', 'fix_dates']
        })
      })

      const response = await repairData(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(repairedApplications)
      expect(backupService.repairData).toHaveBeenCalledWith(
        mockApplications,
        ['fix_ids', 'fix_dates']
      )
    })

    it('should handle repair without options', async () => {
      ;(backupService.repairData as jest.Mock).mockResolvedValue(mockApplications)

      const request = new NextRequest('http://localhost/api/backup/repair', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await repairData(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(backupService.repairData).toHaveBeenCalledWith(
        mockApplications,
        undefined
      )
    })

    it('should handle service errors', async () => {
      ;(backupService.repairData as jest.Mock).mockRejectedValue(
        new Error('Repair failed')
      )

      const request = new NextRequest('http://localhost/api/backup/repair', {
        method: 'POST',
        body: JSON.stringify({
          applications: mockApplications
        })
      })

      const response = await repairData(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('DATA_REPAIR_FAILED')
    })
  })
})