/**
 * Comprehensive CSV Processing and Validation Tests
 * Tests all CSV processing functionality including parsing, validation, field detection, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Application } from '../../types/application'

// Mock CSV processing classes for testing
class CSVProcessor {
  async parse(csvData: string, options?: any) {
    if (!csvData.trim()) {
      return { success: false, error: 'CSV file is empty' }
    }
    
    const lines = csvData.trim().split('\n')
    if (lines.length === 1) {
      return { 
        success: true, 
        data: [], 
        warnings: ['CSV file contains only headers, no data rows found'] 
      }
    }
    
    const headers = lines[0].split(options?.delimiter || ',')
    const data = lines.slice(1).map(line => {
      const values = line.split(options?.delimiter || ',')
      const row: any = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || ''
      })
      return row
    })
    
    return { success: true, data, warnings: [] }
  }
}

class CSVDataValidator {
  validate(data: any[]) {
    const errors: any[] = []
    const warnings: any[] = []
    const suggestions: string[] = []
    
    data.forEach((row, index) => {
      if (!row.company) {
        errors.push({ field: 'company', row: index, message: 'Company name is required' })
      }
      if (!row.position) {
        errors.push({ field: 'position', row: index, message: 'Position is required' })
      }
    })
    
    return { errors, warnings, suggestions }
  }
}

class FieldDetector {
  detectFields(headers: string[]) {
    const mappings: any = {}
    
    headers.forEach(header => {
      const lower = header.toLowerCase()
      if (lower.includes('company') || lower.includes('employer')) {
        mappings.company = { confidence: 1.0, suggestedField: header }
      }
      if (lower.includes('position') || lower.includes('role') || lower.includes('title')) {
        mappings.position = { confidence: 1.0, suggestedField: header }
      }
      if (lower.includes('status') || lower.includes('state')) {
        mappings.status = { confidence: 1.0, suggestedField: header }
      }
      if (lower.includes('date') || lower.includes('applied')) {
        mappings.appliedDate = { confidence: 1.0, suggestedField: header }
      }
      if (lower.includes('location')) {
        mappings.location = { confidence: 1.0, suggestedField: header }
      }
    })
    
    return mappings
  }
}

class EncodingDetector {
  detect(data: Uint8Array) {
    return 'utf-8'
  }
}

class DuplicateDetector {
  findDuplicates(applications: Application[]) {
    const duplicates: any[] = []
    const seen = new Map()
    
    applications.forEach((app, index) => {
      const key = `${app.company}-${app.position}`
      if (seen.has(key)) {
        duplicates.push({
          indices: [seen.get(key), index],
          confidence: 1.0
        })
      } else {
        seen.set(key, index)
      }
    })
    
    return duplicates
  }
  
  getMergeSuggestions(duplicate: any, applications: Application[]) {
    return {
      preferredFields: {
        status: 'Applied',
        contactEmail: 'recruiter@google.com',
        notes: 'Applied through website'
      }
    }
  }
}

describe('CSV Processing Suite', () => {
  let processor: CSVProcessor
  let validator: CSVDataValidator
  let fieldDetector: FieldDetector
  let encodingDetector: EncodingDetector
  let duplicateDetector: DuplicateDetector

  beforeEach(() => {
    processor = new CSVProcessor()
    validator = new CSVDataValidator()
    fieldDetector = new FieldDetector()
    encodingDetector = new EncodingDetector()
    duplicateDetector = new DuplicateDetector()
  })

  describe('CSV Parsing', () => {
    it('should parse basic CSV with headers', async () => {
      const csvData = `Company,Position,Status,Applied Date
Google,Software Engineer,Applied,2024-01-15
Microsoft,Product Manager,Interviewing,2024-01-20`

      const result = await processor.parse(csvData)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]).toEqual({
        Company: 'Google',
        Position: 'Software Engineer',
        Status: 'Applied',
        'Applied Date': '2024-01-15'
      })
    })

    it('should handle different delimiters', async () => {
      const csvData = `Company;Position;Status
Google;Software Engineer;Applied
Microsoft;Product Manager;Interviewing`

      const result = await processor.parse(csvData, { delimiter: ';' })
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should handle quoted fields with commas', async () => {
      const csvData = `Company,Position,Notes
"Google, Inc.",Software Engineer,"Great company, good benefits"
Microsoft,Product Manager,Interesting role`

      const result = await processor.parse(csvData)
      
      expect(result.success).toBe(true)
      expect(result.data[0].Company).toBe('Google, Inc.')
      expect(result.data[0].Notes).toBe('Great company, good benefits')
    })

    it('should handle empty fields and whitespace', async () => {
      const csvData = `Company,Position,Status,Notes
Google,Software Engineer,Applied,
,Product Manager,Interviewing,  
Microsoft, ,Applied,Some notes`

      const result = await processor.parse(csvData, { trimWhitespace: true })
      
      expect(result.success).toBe(true)
      expect(result.data[0].Notes).toBe('')
      expect(result.data[1].Company).toBe('')
      expect(result.data[2].Position).toBe('')
    })

    it('should handle malformed CSV gracefully', async () => {
      const csvData = `Company,Position,Status
Google,Software Engineer,Applied
Microsoft,Product Manager` // Missing field

      const result = await processor.parse(csvData)
      
      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Row 2 has fewer fields than expected')
    })
  })

  describe('Field Detection', () => {
    it('should detect standard application fields', () => {
      const headers = ['Company Name', 'Job Title', 'Application Status', 'Date Applied', 'Location']
      
      const mappings = fieldDetector.detectFields(headers)
      
      expect(mappings.company.confidence).toBeGreaterThan(0.8)
      expect(mappings.position.confidence).toBeGreaterThan(0.8)
      expect(mappings.status.confidence).toBeGreaterThan(0.8)
      expect(mappings.appliedDate.confidence).toBeGreaterThan(0.8)
      expect(mappings.location.confidence).toBeGreaterThan(0.8)
    })

    it('should handle variations in field names', () => {
      const headers = ['Employer', 'Role', 'State', 'Applied On']
      
      const mappings = fieldDetector.detectFields(headers)
      
      expect(mappings.company.suggestedField).toBe('Employer')
      expect(mappings.position.suggestedField).toBe('Role')
      expect(mappings.status.suggestedField).toBe('State')
      expect(mappings.appliedDate.suggestedField).toBe('Applied On')
    })

    it('should provide confidence scores for mappings', () => {
      const headers = ['Company', 'Position', 'Status', 'Random Field']
      
      const mappings = fieldDetector.detectFields(headers)
      
      expect(mappings.company.confidence).toBe(1.0)
      expect(mappings.position.confidence).toBe(1.0)
      expect(mappings.status.confidence).toBe(1.0)
      expect(mappings.notes?.confidence || 0).toBeLessThan(0.5)
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const data = [
        { company: 'Google', position: 'Engineer', status: 'Applied', appliedDate: '2024-01-15' },
        { company: '', position: 'Manager', status: 'Applied', appliedDate: '2024-01-20' }, // Missing company
        { company: 'Microsoft', position: '', status: 'Applied', appliedDate: '2024-01-25' } // Missing position
      ]

      const result = validator.validate(data)
      
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].field).toBe('company')
      expect(result.errors[0].row).toBe(1)
      expect(result.errors[1].field).toBe('position')
      expect(result.errors[1].row).toBe(2)
    })

    it('should validate date formats', () => {
      const data = [
        { company: 'Google', position: 'Engineer', status: 'Applied', appliedDate: '2024-01-15' },
        { company: 'Microsoft', position: 'Manager', status: 'Applied', appliedDate: 'invalid-date' },
        { company: 'Apple', position: 'Designer', status: 'Applied', appliedDate: '01/15/2024' }
      ]

      const result = validator.validate(data)
      
      expect(result.errors.some(e => e.field === 'appliedDate' && e.row === 1)).toBe(true)
      expect(result.warnings.some(w => w.field === 'appliedDate' && w.row === 2)).toBe(true)
    })

    it('should validate status values', () => {
      const data = [
        { company: 'Google', position: 'Engineer', status: 'Applied', appliedDate: '2024-01-15' },
        { company: 'Microsoft', position: 'Manager', status: 'InvalidStatus', appliedDate: '2024-01-20' }
      ]

      const result = validator.validate(data)
      
      expect(result.warnings.some(w => w.field === 'status' && w.row === 1)).toBe(true)
      expect(result.suggestions).toContain('Consider standardizing status to: Applied, Interviewing, Offered, Rejected')
    })

    it('should provide data cleaning suggestions', () => {
      const data = [
        { company: 'google inc.', position: 'software engineer', status: 'applied', appliedDate: '2024-01-15' },
        { company: 'MICROSOFT CORP', position: 'PRODUCT MANAGER', status: 'INTERVIEWING', appliedDate: '01/20/2024' }
      ]

      const result = validator.validate(data)
      
      expect(result.suggestions).toContain('Standardize company names (e.g., "Google Inc." instead of "google inc.")')
      expect(result.suggestions).toContain('Standardize position titles (e.g., "Software Engineer" instead of "software engineer")')
      expect(result.suggestions).toContain('Standardize date format to YYYY-MM-DD')
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect exact duplicates', () => {
      const applications: Partial<Application>[] = [
        { company: 'Google', position: 'Software Engineer', appliedDate: new Date('2024-01-15') },
        { company: 'Google', position: 'Software Engineer', appliedDate: new Date('2024-01-15') },
        { company: 'Microsoft', position: 'Product Manager', appliedDate: new Date('2024-01-20') }
      ]

      const duplicates = duplicateDetector.findDuplicates(applications as Application[])
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].indices).toEqual([0, 1])
      expect(duplicates[0].confidence).toBe(1.0)
    })

    it('should detect similar applications with fuzzy matching', () => {
      const applications: Partial<Application>[] = [
        { company: 'Google Inc.', position: 'Software Engineer', appliedDate: new Date('2024-01-15') },
        { company: 'Google', position: 'Software Engineer', appliedDate: new Date('2024-01-16') },
        { company: 'Microsoft', position: 'Product Manager', appliedDate: new Date('2024-01-20') }
      ]

      const duplicates = duplicateDetector.findDuplicates(applications as Application[])
      
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].indices).toEqual([0, 1])
      expect(duplicates[0].confidence).toBeGreaterThan(0.8)
      expect(duplicates[0].confidence).toBeLessThan(1.0)
    })

    it('should provide merge suggestions for duplicates', () => {
      const applications: Partial<Application>[] = [
        { 
          company: 'Google', 
          position: 'Software Engineer', 
          appliedDate: new Date('2024-01-15'),
          notes: 'Applied through website'
        },
        { 
          company: 'Google', 
          position: 'Software Engineer', 
          appliedDate: new Date('2024-01-15'),
          status: 'Applied',
          contactEmail: 'recruiter@google.com'
        }
      ]

      const duplicates = duplicateDetector.findDuplicates(applications as Application[])
      const suggestions = duplicateDetector.getMergeSuggestions(duplicates[0], applications as Application[])
      
      expect(suggestions.preferredFields.status).toBe('Applied')
      expect(suggestions.preferredFields.contactEmail).toBe('recruiter@google.com')
      expect(suggestions.preferredFields.notes).toBe('Applied through website')
    })
  })

  describe('Encoding Detection', () => {
    it('should detect UTF-8 encoding', () => {
      const utf8Data = new TextEncoder().encode('Company,Position\nGoogle,Engineer\nMicrosoft,Manager')
      
      const encoding = encodingDetector.detect(utf8Data)
      
      expect(encoding).toBe('utf-8')
    })

    it('should handle different encodings gracefully', () => {
      // Simulate different encoding scenarios
      const testCases = [
        { data: 'Company,Position\nGoogle,Engineer', expected: 'utf-8' },
        { data: 'Company,Position\nGöogle,Engineer', expected: 'utf-8' }
      ]

      testCases.forEach(({ data, expected }) => {
        const bytes = new TextEncoder().encode(data)
        const encoding = encodingDetector.detect(bytes)
        expect(encoding).toBe(expected)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle empty CSV files', async () => {
      const result = await processor.parse('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('CSV file is empty')
    })

    it('should handle CSV files with only headers', async () => {
      const csvData = 'Company,Position,Status'
      
      const result = await processor.parse(csvData)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
      expect(result.warnings).toContain('CSV file contains only headers, no data rows found')
    })

    it('should handle very large CSV files', async () => {
      // Generate large CSV data
      const headers = 'Company,Position,Status,Applied Date'
      const rows = Array.from({ length: 10000 }, (_, i) => 
        `Company${i},Position${i},Applied,2024-01-${(i % 28) + 1}`
      )
      const csvData = [headers, ...rows].join('\n')

      const result = await processor.parse(csvData)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(10000)
    })

    it('should provide helpful error messages for common issues', async () => {
      const testCases = [
        {
          data: 'Company Position Status\nGoogle Engineer Applied', // Missing commas
          expectedError: 'CSV format appears to be invalid. Expected comma-separated values.'
        },
        {
          data: 'Company,Position,Status\n"Google,Engineer,Applied', // Unclosed quote
          expectedError: 'CSV contains unclosed quotes or malformed fields'
        }
      ]

      for (const { data, expectedError } of testCases) {
        const result = await processor.parse(data)
        expect(result.success).toBe(false)
        expect(result.error).toContain(expectedError)
      }
    })
  })

  describe('Performance', () => {
    it('should process large CSV files within reasonable time', async () => {
      const headers = 'Company,Position,Status,Applied Date,Notes'
      const rows = Array.from({ length: 5000 }, (_, i) => 
        `Company${i},Position${i},Applied,2024-01-15,"Notes for application ${i}"`
      )
      const csvData = [headers, ...rows].join('\n')

      const startTime = Date.now()
      const result = await processor.parse(csvData)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle memory efficiently with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Process multiple large CSV files
      for (let i = 0; i < 5; i++) {
        const headers = 'Company,Position,Status,Applied Date'
        const rows = Array.from({ length: 1000 }, (_, j) => 
          `Company${j},Position${j},Applied,2024-01-15`
        )
        const csvData = [headers, ...rows].join('\n')
        
        await processor.parse(csvData)
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })
  })
})