/**
 * Integration tests for backup functionality
 * Tests the core backup service functionality without complex UI dependencies
 */

import { backupService } from '@/lib/backup/backupService'
import { Application } from '@/types/application'

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

// Mock crypto.subtle
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation((algorithm, data) => {
        // Create a unique hash based on the input data
        const input = new Uint8Array(data)
        const hash = new ArrayBuffer(32)
        const view = new Uint8Array(hash)
        
        // Simple hash based on input content and timestamp
        let seed = Date.now() + Math.random() * 1000000
        for (let i = 0; i < input.length; i++) {
          seed = (seed * 31 + input[i]) % 0xFFFFFFFF
        }
        
        for (let i = 0; i < 32; i++) {
          view[i] = (seed + i) % 256
        }
        
        return Promise.resolve(hash)
      })
    }
  }
})

// Mock Blob
global.Blob = class MockBlob {
  constructor(public parts: any[], public options?: any) {}
  
  get size() {
    return JSON.stringify(this.parts).length
  }
  
  get type() {
    return this.options?.type || 'text/plain'
  }
  
  async text() {
    return this.parts.join('')
  }
} as any

describe('Backup Integration Tests', () => {
  const mockApplications: Application[] = [
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

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('Complete Backup Workflow', () => {
    it('should complete full backup and restore cycle', async () => {
      // Step 1: Create backup
      const backupMetadata = await backupService.createBackup(
        mockApplications,
        'Integration test backup',
        'manual'
      )

      expect(backupMetadata).toBeDefined()
      expect(backupMetadata.applicationCount).toBe(1)
      expect(backupMetadata.description).toBe('Integration test backup')

      // Step 2: Verify backup is listed
      const backupList = await backupService.getBackupList()
      expect(backupList).toHaveLength(1)
      expect(backupList[0].id).toBe(backupMetadata.id)

      // Step 3: Restore backup
      const restoredApplications = await backupService.restoreBackup(backupMetadata.id)
      expect(restoredApplications).toHaveLength(1)
      expect(restoredApplications[0].company).toBe('Test Company')

      // Step 4: Verify backup still exists after restore
      const backupListAfterRestore = await backupService.getBackupList()
      expect(backupListAfterRestore.length).toBeGreaterThanOrEqual(1)
    })

    it('should handle data validation and repair workflow', async () => {
      // Create invalid application data
      const invalidApplications = [
        {
          ...mockApplications[0],
          id: '', // Missing required field
          company: '', // Missing required field
          appliedDate: 'invalid-date' as any // Invalid date
        }
      ] as Application[]

      // Step 1: Validate data and find issues
      const validationResult = await backupService.validateData(invalidApplications)
      expect(validationResult.isValid).toBe(false)
      expect(validationResult.errors.length).toBeGreaterThan(0)

      // Step 2: Repair data
      const repairedApplications = await backupService.repairData(invalidApplications)
      expect(repairedApplications[0].id).toBeTruthy()
      expect(repairedApplications[0].appliedDate).toBeInstanceOf(Date)

      // Step 3: Validate repaired data
      const repairedValidation = await backupService.validateData(repairedApplications)
      expect(repairedValidation.isValid).toBe(true)
      expect(repairedValidation.errors.filter(e => e.severity === 'critical')).toHaveLength(0)
    })

    it('should handle export and import workflow', async () => {
      // Step 1: Export data as JSON
      const exportOptions = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: true,
        validateData: false
      }

      const exportBlob = await backupService.exportForMigration(mockApplications, exportOptions)
      expect(exportBlob.type).toBe('application/json')

      // Step 2: Create file from blob for import
      const exportContent = await exportBlob.text()
      const importFile = new File([exportContent], 'test-export.json', { type: 'application/json' })

      // Step 3: Import data back
      const importOptions = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: true
      }

      const importedApplications = await backupService.importFromMigration(importFile, importOptions)
      expect(importedApplications).toHaveLength(1)
      expect(importedApplications[0].company).toBe('Test Company')
    })

    it('should handle CSV export and import workflow', async () => {
      // Step 1: Export as CSV
      const csvExportOptions = {
        sourceFormat: 'json' as const,
        targetFormat: 'csv' as const,
        includeMetadata: false,
        validateData: false
      }

      const csvBlob = await backupService.exportForMigration(mockApplications, csvExportOptions)
      expect(csvBlob.type).toBe('text/csv')

      // Step 2: Verify CSV content
      const csvContent = await csvBlob.text()
      expect(csvContent).toContain('id,userId,company,position')
      expect(csvContent).toContain('Test Company')

      // Step 3: Import CSV back
      const csvFile = new File([csvContent], 'test-export.csv', { type: 'text/csv' })
      
      const csvImportOptions = {
        sourceFormat: 'csv' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: false
      }

      const importedFromCsv = await backupService.importFromMigration(csvFile, csvImportOptions)
      expect(importedFromCsv).toHaveLength(1)
      expect(importedFromCsv[0].company).toBe('Test Company')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle backup of empty application list', async () => {
      const emptyBackup = await backupService.createBackup([], 'Empty backup', 'manual')
      expect(emptyBackup.applicationCount).toBe(0)

      const restoredEmpty = await backupService.restoreBackup(emptyBackup.id)
      expect(restoredEmpty).toHaveLength(0)
    })

    it('should handle validation of empty data', async () => {
      const validation = await backupService.validateData([])
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should handle export of empty data', async () => {
      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: true,
        validateData: false
      }

      const blob = await backupService.exportForMigration([], options)
      const content = await blob.text()
      const data = JSON.parse(content)
      
      expect(data.applications).toHaveLength(0)
      expect(data.metadata.applicationCount).toBe(0)
    })

    it('should handle backup cleanup when limit is exceeded', async () => {
      // Create multiple backups to test cleanup
      const backups = []
      for (let i = 0; i < 12; i++) {
        const backup = await backupService.createBackup(
          mockApplications,
          `Backup ${i}`,
          'automatic'
        )
        backups.push(backup)
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1))
      }

      // Verify cleanup occurred (should keep only 10 most recent)
      const finalBackupList = await backupService.getBackupList()
      expect(finalBackupList.length).toBeLessThanOrEqual(10)
      
      // Verify most recent backups are kept
      const latestBackup = finalBackupList.find(b => b.description === 'Backup 11')
      expect(latestBackup).toBeDefined()
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data integrity through backup/restore cycle', async () => {
      const originalData = mockApplications[0]
      
      // Create backup
      const backup = await backupService.createBackup([originalData], 'Integrity test')
      
      // Restore and verify all fields are preserved
      const restored = await backupService.restoreBackup(backup.id)
      const restoredData = restored[0]
      
      expect(restoredData.id).toBe(originalData.id)
      expect(restoredData.company).toBe(originalData.company)
      expect(restoredData.position).toBe(originalData.position)
      expect(restoredData.location).toBe(originalData.location)
      expect(restoredData.status).toBe(originalData.status)
      expect(new Date(restoredData.appliedDate)).toEqual(originalData.appliedDate)
      expect(restoredData.requirements).toEqual(originalData.requirements)
      expect(restoredData.tags).toEqual(originalData.tags)
    })

    it('should generate unique backup IDs', async () => {
      const backup1 = await backupService.createBackup(mockApplications, 'Backup 1')
      const backup2 = await backupService.createBackup(mockApplications, 'Backup 2')
      
      expect(backup1.id).not.toBe(backup2.id)
      expect(backup1.checksum).not.toBe(backup2.checksum)
    })

    it('should validate checksums for data integrity', async () => {
      const backup = await backupService.createBackup(mockApplications, 'Checksum test')
      
      expect(backup.checksum).toBeDefined()
      expect(backup.checksum.length).toBeGreaterThan(0)
      
      // Verify backup can be restored (checksum validation passes)
      const restored = await backupService.restoreBackup(backup.id)
      expect(restored).toHaveLength(1)
    })
  })
})