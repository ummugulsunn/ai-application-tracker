import { CSVDataValidator } from '../csv/data-validator'

describe('CSVDataValidator', () => {
  const mockMapping = {
    company: 'Company',
    position: 'Position',
    location: 'Location',
    appliedDate: 'Applied Date',
    status: 'Status',
    contactEmail: 'Email',
    jobUrl: 'Job URL',
    salary: 'Salary'
  }

  describe('validateDataset', () => {
    it('should validate clean data without errors', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA',
          'Applied Date': '2024-01-15',
          'Status': 'Applied',
          'Email': 'recruiter@google.com',
          'Job URL': 'https://careers.google.com/jobs/123',
          'Salary': '$120,000'
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)
      expect(result.cleanedData).toHaveLength(1)
    })

    it('should detect missing required fields', () => {
      const data = [
        {
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA'
          // Missing Company
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.errors).toHaveLength(1) // Only Company is required in current implementation
      expect(result.errors[0]?.column).toBe('Company')
      expect(result.errors[0]?.severity).toBe('error')
    })

    it('should clean and standardize date formats', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Applied Date': '01/15/2024' // MM/DD/YYYY format
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.warnings).toHaveLength(1) // Should warn about date format change
      // The date parsing converts MM/DD/YYYY to YYYY-MM-DD format
      expect(result.cleanedData[0]?.['Applied Date']).toMatch(/2024-01-1[45]/)
    })

    it('should validate and clean email addresses', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Email': 'RECRUITER@GOOGLE.COM' // Should be lowercased
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.cleanedData[0]?.['Email']).toBe('recruiter@google.com')
    })

    it('should detect invalid email formats', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Email': 'invalid-email'
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]?.column).toBe('Contact Email')
    })

    it('should normalize status values', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Status': 'submitted application', // Should normalize to 'Applied'
          'Applied Date': '2024-01-15' // Add applied date to avoid additional warning
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.cleanedData[0]?.['Status']).toBe('Applied')
      expect(result.warnings).toHaveLength(1) // Should warn about standardization
    })

    it('should detect duplicate applications', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA'
        },
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Location': 'Mountain View, CA'
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.warnings.some(w => w.column === 'Duplicate')).toBe(true)
    })

    it('should validate URL formats and add protocols', () => {
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Job URL': 'careers.google.com/jobs/123' // Missing protocol
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMapping)

      expect(result.cleanedData[0]?.['Job URL']).toBe('https://careers.google.com/jobs/123')
      expect(result.warnings).toHaveLength(1) // Should warn about URL correction
    })

    it('should validate date chronology', () => {
      const mockMappingWithResponse = {
        ...mockMapping,
        responseDate: 'Response Date'
      }
      
      const data = [
        {
          'Company': 'Google',
          'Position': 'Software Engineer',
          'Applied Date': '2024-01-20',
          'Response Date': '2024-01-15' // Response before application
        }
      ]

      const result = CSVDataValidator.validateDataset(data, mockMappingWithResponse)

      expect(result.warnings.some(w => w.column === 'Date Logic')).toBe(true)
    })
  })

  describe('generateValidationSummary', () => {
    it('should generate summary for clean data', () => {
      const summary = CSVDataValidator.generateValidationSummary([], [])

      expect(summary.canProceed).toBe(true)
      expect(summary.totalIssues).toBe(0)
      expect(summary.summary).toContain('successfully')
    })

    it('should generate summary with errors', () => {
      const errors = [
        {
          row: 1,
          column: 'Company',
          message: 'Required field missing',
          severity: 'error' as const,
          suggestedFix: 'Add company name'
        }
      ]

      const summary = CSVDataValidator.generateValidationSummary(errors, [])

      expect(summary.canProceed).toBe(false)
      expect(summary.criticalErrors).toBe(1)
      expect(summary.recommendations).toContain('Fix critical errors before importing')
    })

    it('should generate summary with warnings only', () => {
      const warnings = [
        {
          row: 1,
          column: 'Status',
          message: 'Status standardized',
          suggestedFix: 'Auto-corrected'
        }
      ]

      const summary = CSVDataValidator.generateValidationSummary([], warnings)

      expect(summary.canProceed).toBe(true)
      expect(summary.warnings).toBe(1)
      expect(summary.summary).toContain('auto-corrected')
    })
  })
})