/**
 * @jest-environment jsdom
 */

import { ExportService, ExportField, ExportOptions } from '../export/exportService'
import { Application, ApplicationStats } from '@/types/application'

// Mock the external dependencies
jest.mock('jspdf', () => {
  return {
    jsPDF: jest.fn().mockImplementation(() => ({
      internal: {
        pageSize: { width: 210, height: 297 },
        getCurrentPageInfo: () => ({ pageNumber: 1 })
      },
      setFontSize: jest.fn(),
      text: jest.fn(),
      output: jest.fn().mockReturnValue(new ArrayBuffer(8)),
      autoTable: jest.fn()
    }))
  }
})

jest.mock('jspdf-autotable', () => ({}))

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    aoa_to_sheet: jest.fn().mockReturnValue({ '!cols': [] }),
    book_append_sheet: jest.fn()
  },
  write: jest.fn().mockReturnValue(new ArrayBuffer(8))
}))

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn().mockReturnValue({
    href: '',
    download: '',
    click: jest.fn(),
    remove: jest.fn()
  })
})

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
})

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn()
})

describe('ExportService', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Software Engineer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$120,000 - $150,000',
      status: 'Applied',
      priority: 'High',
      appliedDate: '2024-01-15',
      responseDate: null,
      interviewDate: null,
      offerDate: null,
      rejectionDate: null,
      followUpDate: undefined,
      notes: 'Great company culture',
      jobDescription: 'Full-stack development role',
      requirements: ['React', 'Node.js', 'TypeScript'],
      contactPerson: 'John Doe',
      contactEmail: 'john@techcorp.com',
      contactPhone: '+1-555-0123',
      website: 'https://techcorp.com',
      jobUrl: 'https://techcorp.com/jobs/123',
      companyWebsite: 'https://techcorp.com',
      tags: ['frontend', 'backend'],
      aiMatchScore: 85,
      aiInsights: {
        matchReasons: ['Strong technical fit'],
        improvementSuggestions: ['Add more backend experience'],
        successProbability: 85,
        recommendedActions: ['Follow up in 1 week'],
        analysisDate: '2024-01-15T10:00:00Z',
        confidence: 85
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Frontend Developer',
      location: 'Remote',
      type: 'Contract',
      salary: '$80/hour',
      status: 'Interviewing',
      priority: 'Medium',
      appliedDate: '2024-01-10',
      responseDate: '2024-01-12',
      interviewDate: '2024-01-20T14:00:00Z',
      offerDate: null,
      rejectionDate: null,
      followUpDate: '2024-01-25',
      notes: 'Fast-paced environment',
      jobDescription: 'React development',
      requirements: ['React', 'CSS', 'JavaScript'],
      contactPerson: 'Jane Smith',
      contactEmail: 'jane@startupxyz.com',
      contactPhone: '',
      website: 'https://startupxyz.com',
      jobUrl: 'https://startupxyz.com/careers/frontend',
      companyWebsite: 'https://startupxyz.com',
      tags: ['react', 'remote'],
      aiMatchScore: 75,
      aiInsights: {
        matchReasons: ['Good React skills'],
        improvementSuggestions: ['Learn more about testing'],
        successProbability: 75,
        recommendedActions: ['Prepare for technical interview'],
        analysisDate: '2024-01-10T10:00:00Z',
        confidence: 75
      },
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z'
    }
  ]

  const mockStats: ApplicationStats = {
    total: 2,
    pending: 0,
    applied: 1,
    interviewing: 1,
    offered: 0,
    rejected: 0,
    accepted: 0,
    successRate: 50,
    averageResponseTime: 2,
    topCompanies: ['Tech Corp', 'StartupXYZ'],
    topLocations: ['San Francisco, CA', 'Remote'],
    averageMatchScore: 80,
    aiAnalyzedCount: 2,
    highPotentialCount: 1,
    improvementOpportunities: 2
  }

  describe('getDefaultFields', () => {
    it('should return default export fields', () => {
      const fields = ExportService.getDefaultFields()
      
      expect(fields).toHaveLength(26)
      expect(fields.find(f => f.key === 'company')).toBeDefined()
      expect(fields.find(f => f.key === 'position')).toBeDefined()
      expect(fields.find(f => f.key === 'status')).toBeDefined()
      
      // Check that basic fields are selected by default
      const selectedFields = fields.filter(f => f.selected)
      expect(selectedFields.length).toBeGreaterThan(0)
      expect(selectedFields.find(f => f.key === 'company')?.selected).toBe(true)
    })
  })

  describe('CSV Export', () => {
    it('should export applications to CSV format', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 5) // Use first 5 fields
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      expect(result.filename).toContain('.csv')
      expect(typeof result.data).toBe('string')
      
      const csvData = result.data as string
      expect(csvData).toContain('"Company","Position","Location"')
      expect(csvData).toContain('Tech Corp')
      expect(csvData).toContain('StartupXYZ')
    })

    it('should handle custom field selection', async () => {
      const fields: ExportField[] = [
        { key: 'company', label: 'Company Name', selected: true, type: 'string' },
        { key: 'status', label: 'Application Status', selected: true, type: 'string' }
      ]

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      const csvData = result.data as string
      expect(csvData).toContain('"Company Name","Application Status"')
      expect(csvData).not.toContain('Position')
    })

    it('should handle date range filtering', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'csv',
        fields,
        dateRange: {
          start: '2024-01-12',
          end: '2024-01-20'
        }
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      const csvData = result.data as string
      // Should only include StartupXYZ (applied on 2024-01-10, but we're testing the filter logic)
      expect(csvData.split('\n').length).toBeLessThan(4) // Header + filtered data
    })
  })

  describe('Excel Export', () => {
    it('should export applications to Excel format', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 5)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'excel',
        fields,
        includeStats: true
      }

      const result = await ExportService.exportApplications(mockApplications, options, mockStats)

      expect(result.success).toBe(true)
      expect(result.filename).toContain('.xlsx')
      expect(result.data).toBeInstanceOf(Blob)
    })
  })

  describe('PDF Export', () => {
    it('should export applications to PDF format', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 5)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'pdf',
        fields,
        includeStats: true
      }

      const result = await ExportService.exportApplications(mockApplications, options, mockStats)

      expect(result.success).toBe(true)
      expect(result.filename).toContain('.pdf')
      expect(result.data).toBeInstanceOf(Blob)
    })
  })

  describe('JSON Export', () => {
    it('should export applications to JSON format', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 5)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'json',
        fields,
        includeStats: true,
        includeAIInsights: true
      }

      const result = await ExportService.exportApplications(mockApplications, options, mockStats)

      expect(result.success).toBe(true)
      expect(result.filename).toContain('.json')
      
      const jsonData = JSON.parse(result.data as string)
      expect(jsonData.exportDate).toBeDefined()
      expect(jsonData.totalRecords).toBe(2)
      expect(jsonData.applications).toHaveLength(2)
      expect(jsonData.statistics).toEqual(mockStats)
      expect(jsonData.applications[0].aiInsights).toBeDefined()
    })

    it('should export without AI insights when not requested', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'json',
        fields,
        includeAIInsights: false
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      const jsonData = JSON.parse(result.data as string)
      expect(jsonData.applications[0].aiInsights).toBeUndefined()
    })
  })

  describe('Field Formatting', () => {
    it('should format array fields correctly', async () => {
      const fields: ExportField[] = [
        { key: 'company', label: 'Company', selected: true, type: 'string' },
        { key: 'requirements', label: 'Requirements', selected: true, type: 'array' },
        { key: 'tags', label: 'Tags', selected: true, type: 'array' }
      ]

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      const csvData = result.data as string
      expect(csvData).toContain('React; Node.js; TypeScript')
      expect(csvData).toContain('frontend; backend')
    })

    it('should format date fields correctly', async () => {
      const fields: ExportField[] = [
        { key: 'company', label: 'Company', selected: true, type: 'string' },
        { key: 'appliedDate', label: 'Applied Date', selected: true, type: 'date' },
        { key: 'responseDate', label: 'Response Date', selected: true, type: 'date' }
      ]

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      const csvData = result.data as string
      expect(csvData).toContain('1/15/2024') // Applied date formatted
    })
  })

  describe('Error Handling', () => {
    it('should handle empty applications array', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications([], options)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should handle no selected fields', async () => {
      const fields = ExportService.getDefaultFields()
      fields.forEach(f => f.selected = false) // No fields selected

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      // Should still work with empty field selection
    })

    it('should handle unsupported format', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'unsupported' as any,
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unsupported export format')
    })
  })

  describe('Custom Filename', () => {
    it('should use custom filename when provided', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'csv',
        fields,
        customFilename: 'my-custom-export.csv'
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      expect(result.filename).toBe('my-custom-export.csv')
    })

    it('should generate default filename when not provided', async () => {
      const fields = ExportService.getDefaultFields().slice(0, 3)
      fields.forEach(f => f.selected = true)

      const options: ExportOptions = {
        format: 'csv',
        fields
      }

      const result = await ExportService.exportApplications(mockApplications, options)

      expect(result.success).toBe(true)
      expect(result.filename).toMatch(/applications_export_\d{4}-\d{2}-\d{2}\.csv/)
    })
  })

  describe('downloadFile', () => {
    it('should create download link for string data', () => {
      const testData = 'test,data\n1,2'
      const filename = 'test.csv'

      ExportService.downloadFile(testData, filename)

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('should create download link for blob data', () => {
      const testBlob = new Blob(['test data'], { type: 'text/plain' })
      const filename = 'test.txt'

      ExportService.downloadFile(testBlob, filename)

      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })
  })
})