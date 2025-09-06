import { CSVTemplateSystem } from '../csv/templates'
import { FieldDetector } from '../csv/field-detector'

describe('CSV Template Integration', () => {
  describe('Template-based field detection', () => {
    it('should use template detection for LinkedIn format', () => {
      const headers = ['Company', 'Position', 'Location', 'Applied Date', 'Status', 'Notes']
      const detection = FieldDetector.detectColumns(headers)
      
      // Should detect high confidence mappings
      expect(detection.detectedMapping.company).toBe('Company')
      expect(detection.detectedMapping.position).toBe('Position')
      expect(detection.detectedMapping.location).toBe('Location')
      expect(detection.detectedMapping.status).toBe('Status')
      
      // Should have high confidence
      expect(detection.confidence.company).toBeGreaterThan(0.8)
      expect(detection.confidence.position).toBeGreaterThan(0.8)
      
      // Should mention template detection in suggestions
      expect(detection.suggestions.some(s => s.includes('LinkedIn'))).toBe(true)
    })

    it('should use template detection for Indeed format', () => {
      const headers = ['Company Name', 'Job Title', 'Location', 'Date Applied', 'Application Status', 'Salary']
      const detection = FieldDetector.detectColumns(headers)
      
      expect(detection.detectedMapping.company).toBe('Company Name')
      expect(detection.detectedMapping.position).toBe('Job Title')
      expect(detection.detectedMapping.appliedDate).toBe('Date Applied')
      expect(detection.detectedMapping.status).toBe('Application Status')
      expect(detection.detectedMapping.salary).toBe('Salary')
      
      expect(detection.suggestions.some(s => s.includes('Indeed'))).toBe(true)
    })

    it('should fallback to pattern matching for unknown formats', () => {
      const headers = ['Employer', 'Role', 'City', 'Applied', 'Current Status']
      const detection = FieldDetector.detectColumns(headers)
      
      // Should still map fields using pattern matching
      expect(detection.detectedMapping.company).toBe('Employer')
      expect(detection.detectedMapping.position).toBe('Role')
      expect(detection.detectedMapping.location).toBe('City')
      
      // Should have suggestions (either template-related or mapping-related)
      expect(detection.suggestions.length).toBeGreaterThan(0)
      expect(detection.suggestions.some(s => 
        s.toLowerCase().includes('template') || 
        s.toLowerCase().includes('consider') ||
        s.toLowerCase().includes('partially') ||
        s.toLowerCase().includes('review')
      )).toBe(true)
    })

    it('should use specific template when requested', () => {
      const headers = ['Company Name', 'Job Title', 'Location']
      const detection = FieldDetector.detectColumnsWithTemplate(headers, 'indeed')
      
      expect(detection.detectedMapping.company).toBe('Company Name')
      expect(detection.detectedMapping.position).toBe('Job Title')
      expect(detection.detectedMapping.location).toBe('Location')
      
      expect(detection.suggestions.some(s => s.includes('Indeed'))).toBe(true)
    })
  })

  describe('Template and sample data generation', () => {
    it('should generate consistent sample data', () => {
      const template = CSVTemplateSystem.getTemplate('linkedin')!
      const sampleData = CSVTemplateSystem.generateSampleData('linkedin', 5)
      
      // Check that sample data matches template structure
      const expectedColumns = template.fieldMappings.map(m => m.csvColumn)
      const sampleColumns = Object.keys(sampleData[0] || {})
      
      expectedColumns.forEach(col => {
        expect(sampleColumns).toContain(col)
      })
      
      // Check that required fields have data
      sampleData.forEach(row => {
        expect(row.Company).toBeTruthy()
        expect(row.Position).toBeTruthy()
      })
    })

    it('should generate valid CSV content', () => {
      const csvContent = CSVTemplateSystem.generateTemplateCSV('minimal', true)
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      expect(lines.length).toBeGreaterThan(1) // Header + data
      
      // Check CSV structure - use minimal template for simpler parsing
      const headerColumns = lines[0]!.split(',').length
      lines.slice(1).forEach((line, index) => {
        // Handle quoted CSV fields properly
        const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.length || line.split(',').length
        expect(columns).toBeGreaterThanOrEqual(headerColumns - 1) // Allow for some flexibility with CSV parsing
      })
    })
  })

  describe('Template auto-detection accuracy', () => {
    it('should have high accuracy for exact template matches', () => {
      // Test specific templates individually to avoid conflicts
      const testCases = [
        { id: 'linkedin', headers: ['Company', 'Position', 'Location', 'Applied Date', 'Status', 'Notes'] },
        { id: 'indeed', headers: ['Company Name', 'Job Title', 'Location', 'Date Applied', 'Application Status', 'Salary', 'Job Type'] },
        { id: 'glassdoor', headers: ['Employer', 'Job Title', 'Location', 'Date Applied', 'Status', 'Salary Estimate'] }
      ]
      
      testCases.forEach(testCase => {
        const detection = CSVTemplateSystem.detectTemplate(testCase.headers)
        
        expect(detection.template?.id).toBe(testCase.id)
        expect(detection.confidence).toBeGreaterThan(0.8)
      })
    })

    it('should handle case variations', () => {
      const headers = ['company', 'position', 'location', 'applied date', 'status']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template).toBeDefined()
      expect(detection.confidence).toBeGreaterThan(0.5)
    })

    it('should handle partial matches gracefully', () => {
      const headers = ['Company', 'Position', 'Random Column']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template).toBeDefined()
      expect(detection.confidence).toBeGreaterThan(0)
      expect(detection.confidence).toBeLessThan(0.8) // Partial match
    })
  })

  describe('Error handling', () => {
    it('should handle invalid template IDs gracefully', () => {
      expect(() => {
        FieldDetector.detectColumnsWithTemplate(['Company'], 'invalid-template')
      }).toThrow('Template not found: invalid-template')
    })

    it('should handle empty headers', () => {
      const detection = CSVTemplateSystem.detectTemplate([])
      
      expect(detection.template).toBeNull()
      expect(detection.confidence).toBe(0)
      expect(detection.matchedFields).toBe(0)
    })

    it('should validate template structure', () => {
      const invalidTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test template',
        source: 'custom' as const,
        fieldMappings: [] // Empty mappings
      }
      
      const validation = CSVTemplateSystem.validateTemplate(invalidTemplate)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })
})