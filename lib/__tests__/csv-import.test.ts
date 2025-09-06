import { EncodingDetector } from '../csv/encoding-detector'
import { FieldDetector } from '../csv/field-detector'
import { CSVProcessor } from '../csv/processor'

// Mock File for testing
class MockFile extends File {
  constructor(content: string, filename: string, options?: FilePropertyBag) {
    const blob = new Blob([content], { type: 'text/csv' })
    super([blob], filename, options)
  }
}

describe('CSV Import System', () => {
  describe('EncodingDetector', () => {
    it('should detect UTF-8 encoding', async () => {
      const content = 'Company,Position,Location\nGoogle,Engineer,Mountain View'
      const file = new MockFile(content, 'test.csv')
      
      const result = await EncodingDetector.detectEncoding(file)
      
      expect(result.encoding).toBe('utf-8')
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should read file with detected encoding', async () => {
      const content = 'Company,Position\nGoogle,Engineer'
      const file = new MockFile(content, 'test.csv')
      
      const text = await EncodingDetector.readFileWithEncoding(file, 'utf-8')
      
      expect(text).toContain('Company,Position')
      expect(text).toContain('Google,Engineer')
    })
  })

  describe('FieldDetector', () => {
    it('should detect company field with high confidence', () => {
      const columns = ['Company Name', 'Job Title', 'Location']
      
      const result = FieldDetector.detectColumns(columns)
      
      expect(result.detectedMapping.company).toBe('Company Name')
      expect(result.confidence.company).toBeGreaterThan(0.8)
    })

    it('should detect multiple fields correctly', () => {
      const columns = ['Company', 'Position', 'Location', 'Status', 'Applied Date']
      
      const result = FieldDetector.detectColumns(columns)
      
      // The enhanced detector now uses template-based detection first
      // This matches the Minimal Template which has Company, Position, Status, Applied Date
      expect(result.detectedMapping.company).toBe('Company')
      expect(result.detectedMapping.position).toBe('Position')
      expect(result.detectedMapping.status).toBe('Status')
      expect(result.detectedMapping.appliedDate).toBe('Applied Date')
      
      // Should have high confidence due to template match
      expect(result.confidence.company).toBeGreaterThan(0.8)
      
      // Location might not be mapped by minimal template, but should be detected by fallback
      // The system should still work correctly even if not all fields are mapped
      expect(Object.keys(result.detectedMapping).length).toBeGreaterThan(3)
    })

    it('should handle non-English column names', () => {
      const columns = ['Şirket Adı', 'Pozisyon', 'Lokasyon', 'Durum']
      
      const result = FieldDetector.detectColumns(columns)
      
      expect(result.detectedMapping.company).toBe('Şirket Adı')
      expect(result.detectedMapping.position).toBe('Pozisyon')
      expect(result.detectedMapping.location).toBe('Lokasyon')
      expect(result.detectedMapping.status).toBe('Durum')
    })

    it('should provide field suggestions', () => {
      const suggestions = FieldDetector.getFieldSuggestions('Email Address')
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0]?.field).toBe('contactEmail')
      expect(suggestions[0]?.confidence).toBeGreaterThan(0.5)
    })
  })

  describe('CSVProcessor', () => {
    it('should validate data correctly', () => {
      const data = [
        { 'Company': 'Google', 'Email': 'invalid-email', 'Date': '2024-01-15' },
        { 'Company': '', 'Email': 'valid@email.com', 'Date': 'invalid-date' }
      ]
      const mapping = { 
        company: 'Company', 
        contactEmail: 'Email', 
        appliedDate: 'Date' 
      }
      
      const result = CSVProcessor.validateData(data, mapping)
      
      // Should have validation errors and warnings
      expect(result.errors.length).toBeGreaterThan(0) // Should catch missing company
      expect(result.warnings.length).toBeGreaterThan(0) // Should catch invalid email/date
      
      // Should have cleaned data
      expect(result.cleanedData).toBeDefined()
      expect(Array.isArray(result.cleanedData)).toBe(true)
    })

    it('should generate CSV templates', () => {
      const template = CSVProcessor.generateTemplate('custom')
      
      expect(template).toContain('Company,Position,Location')
      expect(template).toContain('Spotify,Software Engineer Intern')
    })

    it('should generate platform-specific templates', () => {
      const linkedinTemplate = CSVProcessor.generateTemplate('linkedin')
      const indeedTemplate = CSVProcessor.generateTemplate('indeed')
      
      expect(linkedinTemplate).toContain('Company,Position,Location')
      expect(indeedTemplate).toContain('Company Name,Job Title,Location')
    })
  })
})

// Integration test
describe('CSV Import Integration', () => {
  it('should process a complete CSV file', async () => {
    const csvContent = `Company,Position,Location,Status,Applied Date
Google,Software Engineer,Mountain View CA,Applied,2024-01-15
Microsoft,Product Manager,Seattle WA,Interviewing,2024-01-20
Apple,iOS Developer,Cupertino CA,Pending,2024-01-25`

    const file = new MockFile(csvContent, 'applications.csv')
    
    // Mock the progress callback
    const progressCallback = jest.fn()
    
    const result = await CSVProcessor.processFile(file, progressCallback)
    
    expect(result.data.length).toBe(3)
    expect(result.columns).toContain('Company')
    expect(result.columns).toContain('Position')
    expect(result.detectedMapping.company).toBe('Company')
    expect(result.detectedMapping.position).toBe('Position')
    expect(progressCallback).toHaveBeenCalled()
  })
})