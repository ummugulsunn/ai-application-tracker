import { CSVTemplateSystem } from '../csv/templates'
import { CSVTemplate } from '@/types/csv-import'

describe('CSVTemplateSystem', () => {
  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = CSVTemplateSystem.getAllTemplates()
      
      expect(templates).toHaveLength(6) // linkedin, indeed, glassdoor, custom, minimal, european
      expect(templates.every(t => t.id && t.name && t.description)).toBe(true)
    })

    it('should include required templates', () => {
      const templates = CSVTemplateSystem.getAllTemplates()
      const templateIds = templates.map(t => t.id)
      
      expect(templateIds).toContain('linkedin')
      expect(templateIds).toContain('indeed')
      expect(templateIds).toContain('glassdoor')
      expect(templateIds).toContain('custom')
    })
  })

  describe('getTemplate', () => {
    it('should return specific template by ID', () => {
      const template = CSVTemplateSystem.getTemplate('linkedin')
      
      expect(template).toBeDefined()
      expect(template?.id).toBe('linkedin')
      expect(template?.name).toBe('LinkedIn Export')
      expect(template?.source).toBe('linkedin')
    })

    it('should return null for non-existent template', () => {
      const template = CSVTemplateSystem.getTemplate('non-existent')
      expect(template).toBeNull()
    })
  })

  describe('getTemplatesBySource', () => {
    it('should return templates filtered by source', () => {
      const linkedinTemplates = CSVTemplateSystem.getTemplatesBySource('linkedin')
      const customTemplates = CSVTemplateSystem.getTemplatesBySource('custom')
      
      expect(linkedinTemplates).toHaveLength(1)
      expect(linkedinTemplates[0]?.source).toBe('linkedin')
      
      expect(customTemplates.length).toBeGreaterThan(0)
      expect(customTemplates.every(t => t.source === 'custom')).toBe(true)
    })
  })

  describe('generateTemplateCSV', () => {
    it('should generate CSV content for template', () => {
      const csvContent = CSVTemplateSystem.generateTemplateCSV('linkedin', true)
      
      expect(csvContent).toContain('Company,Position,Location')
      expect(csvContent).toContain('Google,Software Engineer')
      expect(csvContent.split('\n').length).toBeGreaterThan(1)
    })

    it('should generate header-only CSV when includeExamples is false', () => {
      const csvContent = CSVTemplateSystem.generateTemplateCSV('linkedin', false)
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      expect(lines).toHaveLength(1) // Only header
      expect(lines[0]).toContain('Company,Position,Location')
    })

    it('should throw error for non-existent template', () => {
      expect(() => {
        CSVTemplateSystem.generateTemplateCSV('non-existent')
      }).toThrow('Template not found: non-existent')
    })
  })

  describe('detectTemplate', () => {
    it('should detect LinkedIn template from headers', () => {
      const headers = ['Company', 'Position', 'Location', 'Applied Date', 'Status', 'Notes']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template?.id).toBe('linkedin')
      expect(detection.confidence).toBeGreaterThan(0.8)
      expect(detection.matchedFields).toBeGreaterThan(4)
    })

    it('should detect Indeed template from headers', () => {
      const headers = ['Company Name', 'Job Title', 'Location', 'Date Applied', 'Application Status']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template?.id).toBe('indeed')
      expect(detection.confidence).toBeGreaterThan(0.7)
    })

    it('should return null for unrecognizable headers', () => {
      const headers = ['Random1', 'Random2', 'Random3']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template).toBeNull()
      expect(detection.confidence).toBeLessThan(0.3)
    })

    it('should handle partial matches', () => {
      const headers = ['Company', 'Job Title', 'Random Column']
      const detection = CSVTemplateSystem.detectTemplate(headers)
      
      expect(detection.template).toBeDefined()
      expect(detection.confidence).toBeGreaterThan(0)
      expect(detection.confidence).toBeLessThan(1)
    })
  })

  describe('generateMappingFromTemplate', () => {
    it('should generate field mapping from template', () => {
      const headers = ['Company', 'Position', 'Location', 'Status']
      const result = CSVTemplateSystem.generateMappingFromTemplate('linkedin', headers)
      
      expect(result.mapping.company).toBe('Company')
      expect(result.mapping.position).toBe('Position')
      expect(result.mapping.location).toBe('Location')
      expect(result.mapping.status).toBe('Status')
      
      expect(result.confidence.company).toBe(1.0)
      expect(result.confidence.position).toBe(1.0)
    })

    it('should handle fuzzy matching', () => {
      const headers = ['Company Name', 'Job Title', 'Work Location']
      const result = CSVTemplateSystem.generateMappingFromTemplate('linkedin', headers)
      
      expect(result.mapping.company).toBe('Company Name')
      expect(result.mapping.position).toBe('Job Title')
      expect(result.mapping.location).toBe('Work Location')
      
      // Fuzzy matches should have lower confidence
      expect(result.confidence.company).toBeLessThan(1.0)
      expect(result.confidence.company).toBeGreaterThan(0.5)
    })

    it('should identify unmapped headers', () => {
      const headers = ['Company', 'Position', 'Random Column', 'Another Random']
      const result = CSVTemplateSystem.generateMappingFromTemplate('linkedin', headers)
      
      expect(result.unmappedHeaders).toContain('Random Column')
      expect(result.unmappedHeaders).toContain('Another Random')
    })

    it('should identify missing required fields', () => {
      const headers = ['Position', 'Location'] // Missing Company
      const result = CSVTemplateSystem.generateMappingFromTemplate('linkedin', headers)
      
      expect(result.missingFields).toContain('company')
    })
  })

  describe('createCustomTemplate', () => {
    it('should create custom template from mapping', () => {
      const mapping = {
        company: 'Company Name',
        position: 'Job Title',
        status: 'Application Status'
      }
      
      const template = CSVTemplateSystem.createCustomTemplate(
        'My Custom Template',
        'A custom template for my needs',
        mapping
      )
      
      expect(template.name).toBe('My Custom Template')
      expect(template.description).toBe('A custom template for my needs')
      expect(template.source).toBe('custom')
      expect(template.fieldMappings).toHaveLength(3)
      
      const companyMapping = template.fieldMappings.find(m => m.applicationField === 'company')
      expect(companyMapping?.csvColumn).toBe('Company Name')
      expect(companyMapping?.required).toBe(true)
    })
  })

  describe('generateSampleData', () => {
    it('should generate sample data for template', () => {
      const sampleData = CSVTemplateSystem.generateSampleData('linkedin', 5)
      
      expect(sampleData).toHaveLength(5)
      expect(sampleData[0]).toHaveProperty('Company')
      expect(sampleData[0]).toHaveProperty('Position')
      expect(sampleData[0]).toHaveProperty('Location')
      
      // Check that data is varied
      const companies = sampleData.map(row => row.Company)
      const uniqueCompanies = new Set(companies)
      expect(uniqueCompanies.size).toBeGreaterThan(1)
    })

    it('should respect count parameter', () => {
      const sampleData = CSVTemplateSystem.generateSampleData('custom', 3)
      expect(sampleData).toHaveLength(3)
    })

    it('should throw error for non-existent template', () => {
      expect(() => {
        CSVTemplateSystem.generateSampleData('non-existent')
      }).toThrow('Template not found: non-existent')
    })
  })

  describe('validateTemplate', () => {
    it('should validate complete template', () => {
      const template = CSVTemplateSystem.getTemplate('linkedin')!
      const validation = CSVTemplateSystem.validateTemplate(template)
      
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const incompleteTemplate: Partial<CSVTemplate> = {
        name: 'Test Template',
        description: 'Test description'
        // Missing id, source, fieldMappings
      }
      
      const validation = CSVTemplateSystem.validateTemplate(incompleteTemplate)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some(e => e.includes('ID'))).toBe(true)
    })

    it('should require company field mapping', () => {
      const templateWithoutCompany: Partial<CSVTemplate> = {
        id: 'test',
        name: 'Test Template',
        description: 'Test description',
        source: 'custom',
        fieldMappings: [
          { csvColumn: 'Position', applicationField: 'position', confidence: 1.0, required: false }
        ]
      }
      
      const validation = CSVTemplateSystem.validateTemplate(templateWithoutCompany)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.includes('company'))).toBe(true)
    })
  })

  describe('CSV escaping', () => {
    it('should properly escape CSV cells with commas', () => {
      const template = CSVTemplateSystem.getTemplate('custom')!
      
      // Modify sample data to include commas
      const modifiedTemplate = {
        ...template,
        sampleData: [
          template.sampleData[0], // Header
          ['Company, Inc.', 'Software Engineer, Senior', 'San Francisco, CA', 'Full-time', '$120,000', 'Applied', '2024-01-15']
        ]
      }
      
      // Mock the template temporarily
      const originalGetTemplate = CSVTemplateSystem.getTemplate
      CSVTemplateSystem.getTemplate = jest.fn().mockReturnValue(modifiedTemplate)
      
      const csvContent = CSVTemplateSystem.generateTemplateCSV('custom', true)
      
      expect(csvContent).toContain('"Company, Inc."')
      expect(csvContent).toContain('"Software Engineer, Senior"')
      expect(csvContent).toContain('"San Francisco, CA"')
      
      // Restore original method
      CSVTemplateSystem.getTemplate = originalGetTemplate
    })
  })
})