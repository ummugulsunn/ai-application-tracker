import { backupService } from '@/lib/backup/backupService'
import { Application } from '@/types/application'

// Mock localStorage
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock crypto.subtle for checksum calculation
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
})

// Mock Blob for Node.js environment
global.Blob = class MockBlob {
  constructor(public parts: any[], public options?: any) { }

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

// Mock File for Node.js environment
global.File = class MockFile extends (global.Blob as any) {
  constructor(public parts: any[], public name: string, public options?: any) {
    super(parts, options)
  }

  get lastModified() {
    return Date.now()
  }
} as any

// Mock FileReader for Node.js environment
global.FileReader = class MockFileReader {
  result: string | null = null
  error: any = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsText(file: any) {
    setTimeout(() => {
      try {
        this.result = file.parts.join('')
        if (this.onload) {
          this.onload({ target: this })
        }
      } catch (error) {
        this.error = error
        if (this.onerror) {
          this.onerror({ target: this })
        }
      }
    }, 0)
  }
} as any

describe('BackupService', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      userId: 'user1',
      company: 'Test Company',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$100k-120k',
      status: 'Applied',
      priority: 'High',
      appliedDate: '2024-01-15',
      responseDate: null,
      interviewDate: null,
      notes: 'Great opportunity',
      jobDescription: 'Exciting role',
      requirements: ['React', 'TypeScript'],
      contactPerson: 'John Doe',
      contactEmail: 'john@test.com',
      contactPhone: '555-0123',
      website: 'https://test.com',
      companyWebsite: 'https://test.com',
      jobUrl: 'https://test.com/jobs/1',
      tags: ['tech', 'startup'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      userId: 'user1',
      company: 'Another Company',
      position: 'Frontend Developer',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$90k-110k',
      status: 'Interviewing',
      priority: 'Medium',
      appliedDate: '2024-01-20',
      responseDate: null,
      interviewDate: null,
      notes: 'Second round interview scheduled',
      jobDescription: 'Frontend focused role',
      requirements: ['Vue.js', 'JavaScript'],
      contactPerson: 'Jane Smith',
      contactEmail: 'jane@another.com',
      contactPhone: '555-0456',
      website: 'https://another.com',
      companyWebsite: 'https://another.com',
      jobUrl: 'https://another.com/careers/2',
      tags: ['frontend', 'remote'],
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20'
    }
  ]

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const metadata = await backupService.createBackup(
        mockApplications,
        'Test backup',
        'manual'
      )

      expect(metadata).toBeDefined()
      expect(metadata.description).toBe('Test backup')
      expect(metadata.type).toBe('manual')
      expect(metadata.applicationCount).toBe(2)
      expect(metadata.id).toBeDefined()
      expect(metadata.timestamp).toBeDefined()
      expect(metadata.checksum).toBeDefined()
    })

    it('should store backup data in localStorage', async () => {
      const metadata = await backupService.createBackup(mockApplications)

      const storedData = localStorageMock.getItem(`app_backup_${metadata.id}`)
      expect(storedData).toBeDefined()

      const parsedData = JSON.parse(storedData!)
      expect(parsedData.applications).toHaveLength(2)
      expect(parsedData.metadata.id).toBe(metadata.id)
    })

    it('should update backup metadata index', async () => {
      await backupService.createBackup(mockApplications, 'First backup')
      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      await backupService.createBackup(mockApplications, 'Second backup')

      const backupList = await backupService.getBackupList()
      expect(backupList).toHaveLength(2)
      expect(backupList[0]?.description).toBe('Second backup') // Most recent first
      expect(backupList[1]?.description).toBe('First backup')
    })
  })

  describe('restoreBackup', () => {
    it('should restore backup successfully', async () => {
      // Create a backup first
      const metadata = await backupService.createBackup(mockApplications, 'Test backup')

      // Restore the backup
      const restoredApplications = await backupService.restoreBackup(metadata.id)

      expect(restoredApplications).toHaveLength(2)
      expect(restoredApplications[0]?.company).toBe('Test Company')
      expect(restoredApplications[1]?.company).toBe('Another Company')
    })

    it('should throw error for non-existent backup', async () => {
      await expect(backupService.restoreBackup('non-existent-id'))
        .rejects.toThrow('Backup not found: non-existent-id')
    })

    it('should create pre-restore backup when current data exists', async () => {
      // Set up current applications
      localStorageMock.setItem('applications', JSON.stringify(mockApplications))

      // Create and restore a backup
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')
      const metadata = await backupService.createBackup([firstApp], 'Single app backup')
      await backupService.restoreBackup(metadata.id)

      // Should have original backup + pre-restore backup
      const backupList = await backupService.getBackupList()
      expect(backupList.length).toBeGreaterThanOrEqual(2)

      const preRestoreBackup = backupList.find(b => b.description === 'Pre-restore backup')
      expect(preRestoreBackup).toBeDefined()
    })
  })

  describe('getBackupList', () => {
    it('should return empty array when no backups exist', async () => {
      const backupList = await backupService.getBackupList()
      expect(backupList).toEqual([])
    })

    it('should return backups sorted by timestamp (newest first)', async () => {
      // Create backups with slight delay to ensure different timestamps
      await backupService.createBackup(mockApplications, 'First backup')
      await new Promise(resolve => setTimeout(resolve, 10))
      await backupService.createBackup(mockApplications, 'Second backup')

      const backupList = await backupService.getBackupList()
      expect(backupList).toHaveLength(2)
      expect(backupList[0]?.description).toBe('Second backup')
      expect(backupList[1]?.description).toBe('First backup')
    })
  })

  describe('deleteBackup', () => {
    it('should delete backup successfully', async () => {
      const metadata = await backupService.createBackup(mockApplications, 'Test backup')

      await backupService.deleteBackup(metadata.id)

      const backupList = await backupService.getBackupList()
      expect(backupList).toHaveLength(0)

      const storedData = localStorageMock.getItem(`app_backup_${metadata.id}`)
      expect(storedData).toBeNull()
    })
  })

  describe('validateData', () => {
    it('should validate correct data successfully', async () => {
      const result = await backupService.validateData(mockApplications)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const invalidApplications = [
        {
          ...firstApp,
          company: '', // Missing required field
          id: '' // Missing required field
        }
      ] as Application[]

      const result = await backupService.validateData(invalidApplications)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)

      const missingCompanyError = result.errors.find(e => e.field === 'company')
      const missingIdError = result.errors.find(e => e.field === 'id')

      expect(missingCompanyError).toBeDefined()
      expect(missingIdError).toBeDefined()
    })

    it('should detect invalid date formats', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const invalidApplications = [
        {
          ...firstApp,
          appliedDate: 'invalid-date' as any
        }
      ] as Application[]

      const result = await backupService.validateData(invalidApplications)

      expect(result.isValid).toBe(false)
      const dateError = result.errors.find(e => e.field === 'appliedDate')
      expect(dateError).toBeDefined()
      expect(dateError?.type).toBe('invalid_format')
    })

    it('should detect duplicate IDs', async () => {
      const firstApp = mockApplications[0]
      const secondApp = mockApplications[1]
      if (!firstApp || !secondApp) throw new Error('Mock applications not found')

      const duplicateApplications = [
        firstApp,
        { ...secondApp, id: firstApp.id } // Duplicate ID
      ]

      const result = await backupService.validateData(duplicateApplications)

      expect(result.isValid).toBe(false)
      const duplicateError = result.errors.find(e => e.type === 'duplicate_id')
      expect(duplicateError).toBeDefined()
    })

    it('should generate warnings for missing optional fields', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const applicationsWithMissingOptional = [
        {
          ...firstApp,
          location: '' // Optional field
        }
      ] as Application[]

      const result = await backupService.validateData(applicationsWithMissingOptional)

      expect(result.isValid).toBe(true) // Still valid, just warnings
      expect(result.warnings.length).toBeGreaterThan(0)

      const locationWarning = result.warnings.find(w => w.field === 'location')
      expect(locationWarning).toBeDefined()
    })

    it('should provide repair suggestions for errors', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const invalidApplications = [
        {
          ...firstApp,
          id: '', // Missing ID
          company: '' // Missing company
        }
      ] as Application[]

      const result = await backupService.validateData(invalidApplications)

      expect(result.repairSuggestions.length).toBeGreaterThan(0)
      expect(result.repairSuggestions[0]?.type).toBe('auto_fix')
      expect(result.repairSuggestions[0]?.description).toContain('Automatically fix')
    })
  })

  describe('repairData', () => {
    it('should repair missing IDs', async () => {
      const firstApp = mockApplications[0]
      const secondApp = mockApplications[1]
      if (!firstApp || !secondApp) throw new Error('Mock applications not found')

      const applicationsWithMissingIds = [
        { ...firstApp, id: '' },
        { ...secondApp, id: '' }
      ] as Application[]

      const repairedApplications = await backupService.repairData(applicationsWithMissingIds)

      expect(repairedApplications[0]?.id).toBeTruthy()
      expect(repairedApplications[1]?.id).toBeTruthy()
      expect(repairedApplications[0]?.id).not.toBe(repairedApplications[1]?.id)
    })

    it('should repair duplicate IDs', async () => {
      const firstApp = mockApplications[0]
      const secondApp = mockApplications[1]
      if (!firstApp || !secondApp) throw new Error('Mock applications not found')

      const applicationsWithDuplicateIds = [
        firstApp,
        { ...secondApp, id: firstApp.id }
      ]

      const repairedApplications = await backupService.repairData(applicationsWithDuplicateIds)

      expect(repairedApplications[0]?.id).not.toBe(repairedApplications[1]?.id)
      expect(repairedApplications[0]?.id).toBe(firstApp.id) // First one keeps original ID
      expect(repairedApplications[1]?.id).not.toBe(firstApp.id) // Second one gets new ID
    })

    it('should repair invalid dates', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const applicationsWithInvalidDates = [
        {
          ...firstApp,
          appliedDate: 'invalid-date' as any
        }
      ] as Application[]

      const repairedApplications = await backupService.repairData(applicationsWithInvalidDates)

      expect(repairedApplications[0]?.appliedDate).toBeTruthy()
      expect(new Date(repairedApplications[0]?.appliedDate || '').getTime()).not.toBeNaN()
    })
  })

  describe('exportForMigration', () => {
    it('should export data as JSON', async () => {
      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: true,
        validateData: false
      }

      const blob = await backupService.exportForMigration(mockApplications, options)

      expect(blob.type).toBe('application/json')
      expect(blob.size).toBeGreaterThan(0)

      const text = await blob.text()
      const data = JSON.parse(text)

      expect(data.applications).toHaveLength(2)
      expect(data.metadata).toBeDefined()
      expect(data.metadata.applicationCount).toBe(2)
    })

    it('should export data as CSV', async () => {
      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'csv' as const,
        includeMetadata: false,
        validateData: false
      }

      const blob = await backupService.exportForMigration(mockApplications, options)

      expect(blob.type).toBe('text/csv')
      expect(blob.size).toBeGreaterThan(0)

      const text = await blob.text()
      const lines = text.split('\n')

      expect(lines.length).toBeGreaterThan(2) // Header + 2 data rows
      expect(lines[0]).toContain('id,userId,company,position') // CSV header
    })

    it('should validate data before export when requested', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const invalidApplications = [
        { ...firstApp, id: '' }
      ] as Application[]

      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: true
      }

      await expect(backupService.exportForMigration(invalidApplications, options))
        .rejects.toThrow('Data validation failed')
    })
  })

  describe('importFromMigration', () => {
    it('should import JSON data', async () => {
      const jsonData = {
        applications: mockApplications
      }

      const file = new File([JSON.stringify(jsonData)], 'test.json', { type: 'application/json' })

      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: false
      }

      const importedApplications = await backupService.importFromMigration(file, options)

      expect(importedApplications).toHaveLength(2)
      expect(importedApplications[0]?.company).toBe('Test Company')
    })

    it('should import CSV data', async () => {
      const csvContent = 'id,company,position,status\n1,"Test Company","Software Engineer","Applied"\n2,"Another Company","Frontend Developer","Interviewing"'
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

      const options = {
        sourceFormat: 'csv' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: false
      }

      const importedApplications = await backupService.importFromMigration(file, options)

      expect(importedApplications).toHaveLength(2)
      expect(importedApplications[0]?.company).toBe('Test Company')
      expect(importedApplications[1]?.company).toBe('Another Company')
    })

    it('should validate and repair data during import when requested', async () => {
      const firstApp = mockApplications[0]
      if (!firstApp) throw new Error('Mock application not found')

      const invalidJsonData = {
        applications: [
          { ...firstApp, id: '' } // Missing ID
        ]
      }

      const file = new File([JSON.stringify(invalidJsonData)], 'test.json', { type: 'application/json' })

      const options = {
        sourceFormat: 'json' as const,
        targetFormat: 'json' as const,
        includeMetadata: false,
        validateData: true
      }

      const importedApplications = await backupService.importFromMigration(file, options)

      expect(importedApplications).toHaveLength(1)
      expect(importedApplications[0]?.id).toBeTruthy() // Should be repaired
    })
  })

  describe('cleanup and maintenance', () => {
    it('should cleanup old backups when limit is exceeded', async () => {
      // Create more backups than the limit (10)
      for (let i = 0; i < 12; i++) {
        await backupService.createBackup(mockApplications, `Backup ${i}`)
        await new Promise(resolve => setTimeout(resolve, 1)) // Ensure different timestamps
      }

      const backupList = await backupService.getBackupList()
      expect(backupList.length).toBeLessThanOrEqual(10)
    })
  })
})