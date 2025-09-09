import { CSVTemplate, FieldMapping } from '@/types/csv-import'
import { Application } from '@/types/application'

/**
 * CSV Template System for different job platforms and custom formats
 */
export class CSVTemplateSystem {
  
  /**
   * Predefined templates for different platforms
   */
  private static readonly TEMPLATES: Record<string, CSVTemplate> = {
    linkedin: {
      id: 'linkedin',
      name: 'LinkedIn Export',
      description: 'Standard format for LinkedIn job application exports',
      source: 'linkedin',
      fieldMappings: [
        { csvColumn: 'Company', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Position', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Location', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Applied Date', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Notes', applicationField: 'notes', confidence: 1.0, required: false }
      ],
      sampleData: [
        ['Company', 'Position', 'Location', 'Applied Date', 'Status', 'Notes'],
        ['Google', 'Software Engineer', 'Mountain View, CA', '2024-01-15', 'Applied', 'Applied via LinkedIn'],
        ['Microsoft', 'Product Manager', 'Seattle, WA', '2024-01-20', 'Interviewing', 'Phone screen completed'],
        ['Apple', 'iOS Developer', 'Cupertino, CA', '2024-01-25', 'Pending', 'Waiting for response']
      ]
    },

    indeed: {
      id: 'indeed',
      name: 'Indeed Format',
      description: 'Format compatible with Indeed job applications',
      source: 'indeed',
      fieldMappings: [
        { csvColumn: 'Company Name', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Job Title', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Location', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Date Applied', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Application Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Salary', applicationField: 'salary', confidence: 1.0, required: false },
        { csvColumn: 'Job Type', applicationField: 'type', confidence: 1.0, required: false }
      ],
      sampleData: [
        ['Company Name', 'Job Title', 'Location', 'Date Applied', 'Application Status', 'Salary', 'Job Type'],
        ['Apple', 'iOS Developer', 'Cupertino, CA', '2024-01-15', 'Applied', '$120,000', 'Full-time'],
        ['Netflix', 'Data Scientist', 'Los Gatos, CA', '2024-01-20', 'Pending', '$140,000', 'Full-time'],
        ['Tesla', 'Software Engineer', 'Palo Alto, CA', '2024-01-25', 'Interviewing', '$110,000', 'Full-time']
      ]
    },

    glassdoor: {
      id: 'glassdoor',
      name: 'Glassdoor Format',
      description: 'Format for Glassdoor job applications with company ratings',
      source: 'glassdoor',
      fieldMappings: [
        { csvColumn: 'Employer', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Job Title', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Location', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Date Applied', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Salary Estimate', applicationField: 'salary', confidence: 1.0, required: false }
      ],
      sampleData: [
        ['Employer', 'Job Title', 'Location', 'Date Applied', 'Status', 'Salary Estimate', 'Company Rating'],
        ['Tesla', 'Software Engineer', 'Palo Alto, CA', '2024-01-15', 'Applied', '$110,000-130,000', '4.2'],
        ['Spotify', 'Backend Engineer', 'Stockholm, Sweden', '2024-01-20', 'Interviewing', '45,000 SEK/month', '4.5'],
        ['Airbnb', 'Product Designer', 'San Francisco, CA', '2024-01-25', 'Pending', '$130,000-150,000', '4.3']
      ]
    },

    custom: {
      id: 'custom',
      name: 'Complete Template',
      description: 'Comprehensive template with all available fields',
      source: 'custom',
      fieldMappings: [
        { csvColumn: 'Company', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Position', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Location', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Type', applicationField: 'type', confidence: 1.0, required: false },
        { csvColumn: 'Salary', applicationField: 'salary', confidence: 1.0, required: false },
        { csvColumn: 'Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Applied Date', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Response Date', applicationField: 'responseDate', confidence: 1.0, required: false },
        { csvColumn: 'Interview Date', applicationField: 'interviewDate', confidence: 1.0, required: false },
        { csvColumn: 'Offer Date', applicationField: 'offerDate', confidence: 1.0, required: false },
        { csvColumn: 'Rejection Date', applicationField: 'rejectionDate', confidence: 1.0, required: false },
        { csvColumn: 'Notes', applicationField: 'notes', confidence: 1.0, required: false },
        { csvColumn: 'Job Description', applicationField: 'jobDescription', confidence: 1.0, required: false },
        { csvColumn: 'Requirements', applicationField: 'requirements', confidence: 1.0, required: false },
        { csvColumn: 'Contact Person', applicationField: 'contactPerson', confidence: 1.0, required: false },
        { csvColumn: 'Contact Email', applicationField: 'contactEmail', confidence: 1.0, required: false },
        { csvColumn: 'Contact Phone', applicationField: 'contactPhone', confidence: 1.0, required: false },
        { csvColumn: 'Website', applicationField: 'website', confidence: 1.0, required: false },
        { csvColumn: 'Job URL', applicationField: 'jobUrl', confidence: 1.0, required: false },
        { csvColumn: 'Company Website', applicationField: 'companyWebsite', confidence: 1.0, required: false },
        { csvColumn: 'Tags', applicationField: 'tags', confidence: 1.0, required: false },
        { csvColumn: 'Priority', applicationField: 'priority', confidence: 1.0, required: false },
        { csvColumn: 'Follow Up Date', applicationField: 'followUpDate', confidence: 1.0, required: false }
      ],
      sampleData: [
        [
          'Company', 'Position', 'Location', 'Type', 'Salary', 'Status', 'Applied Date', 
          'Response Date', 'Interview Date', 'Notes', 'Contact Person', 'Contact Email', 
          'Website', 'Tags', 'Priority'
        ],
        [
          'Spotify', 'Software Engineer Intern', 'Stockholm, Sweden', 'Internship', 
          '15,000 SEK/month', 'Applied', '2024-01-15', '', '', 
          'Applied through LinkedIn', 'Sarah Johnson', 'careers@spotify.com', 
          'https://spotify.com/careers', 'Backend;Music;Sweden', 'High'
        ],
        [
          'Klarna', 'Data Scientist', 'Stockholm, Sweden', 'Full-time', 
          '45,000 SEK/month', 'Pending', '2024-01-20', '', '', 
          'Waiting for response', 'Marcus Andersson', 'careers@klarna.com', 
          'https://klarna.com/careers', 'Data Science;Fintech;Sweden', 'Medium'
        ]
      ]
    },

    minimal: {
      id: 'minimal',
      name: 'Minimal Template',
      description: 'Simple template with only essential fields',
      source: 'custom',
      fieldMappings: [
        { csvColumn: 'Company', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Position', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Applied Date', applicationField: 'appliedDate', confidence: 1.0, required: false }
      ],
      sampleData: [
        ['Company', 'Position', 'Status', 'Applied Date'],
        ['Google', 'Software Engineer', 'Applied', '2024-01-15'],
        ['Microsoft', 'Product Manager', 'Interviewing', '2024-01-20'],
        ['Apple', 'iOS Developer', 'Pending', '2024-01-25']
      ]
    },

    european: {
      id: 'european',
      name: 'European Format',
      description: 'Template optimized for European job markets',
      source: 'custom',
      fieldMappings: [
        { csvColumn: 'Company', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Position', applicationField: 'position', confidence: 1.0, required: true },
        { csvColumn: 'Location', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Salary (Annual)', applicationField: 'salary', confidence: 1.0, required: false },
        { csvColumn: 'Contract Type', applicationField: 'type', confidence: 1.0, required: false },
        { csvColumn: 'Application Status', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'Application Date', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Notes', applicationField: 'notes', confidence: 1.0, required: false }
      ],
      sampleData: [
        ['Company', 'Position', 'Location', 'Salary (Annual)', 'Contract Type', 'Application Status', 'Application Date', 'Notes'],
        ['Spotify', 'Backend Developer', 'Stockholm, Sweden', '550,000 SEK', 'Permanent', 'Applied', '2024-01-15', 'Applied via company website'],
        ['SAP', 'Software Engineer', 'Berlin, Germany', '€75,000', 'Permanent', 'Interviewing', '2024-01-20', 'Technical interview scheduled'],
        ['ASML', 'Hardware Engineer', 'Eindhoven, Netherlands', '€68,000', 'Permanent', 'Pending', '2024-01-25', 'Waiting for response']
      ]
    },

    erasmus_turkish: {
      id: 'erasmus_turkish',
      name: 'Erasmus Staj Takip (Türkçe)',
      description: 'Türkçe Erasmus staj başvuru takip listesi formatı',
      source: 'custom',
      fieldMappings: [
        { csvColumn: 'Şirket Adı', applicationField: 'company', confidence: 1.0, required: true },
        { csvColumn: 'Ülke', applicationField: 'location', confidence: 1.0, required: false },
        { csvColumn: 'Sektör', applicationField: 'tags', confidence: 1.0, required: false },
        { csvColumn: 'E-posta Tarihi', applicationField: 'appliedDate', confidence: 1.0, required: false },
        { csvColumn: 'Cevap Tarihi', applicationField: 'responseDate', confidence: 1.0, required: false },
        { csvColumn: 'Durum', applicationField: 'status', confidence: 1.0, required: false },
        { csvColumn: 'İletişim Bilgisi', applicationField: 'contactEmail', confidence: 1.0, required: false },
        { csvColumn: 'Notlar', applicationField: 'notes', confidence: 1.0, required: false },
        // Add position mapping with default value
        { csvColumn: 'Pozisyon', applicationField: 'position', confidence: 0.8, required: false }
      ],
      sampleData: [
        ['Şirket Adı', 'Ülke', 'Sektör', 'E-posta Tarihi', 'Cevap Tarihi', 'Durum', 'İletişim Bilgisi', 'Notlar', 'Pozisyon'],
        ['Spotify', 'İsveç', 'Technology/Music', '2024-01-15', '', 'Başvuru Planlanıyor', 'careers@spotify.com', 'Müzik teknolojisi alanında staj', 'Stajyer'],
        ['Klarna', 'İsveç', 'Fintech', '2024-01-20', '2024-01-25', 'Cevap Bekleniyor', 'internships@klarna.com', 'Fintech sektöründe deneyim', 'Yazılım Geliştirici Stajyeri'],
        ['Ericsson', 'İsveç', 'Telecommunications', '2024-01-18', '', 'Başvuru Yapıldı', 'career@ericsson.com', 'Telekomünikasyon mühendisliği', 'Mühendislik Stajyeri']
      ]
    }
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): CSVTemplate[] {
    return Object.values(this.TEMPLATES)
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): CSVTemplate | null {
    return this.TEMPLATES[id] || null
  }

  /**
   * Get templates by source platform
   */
  static getTemplatesBySource(source: CSVTemplate['source']): CSVTemplate[] {
    return Object.values(this.TEMPLATES).filter(template => template.source === source)
  }

  /**
   * Generate CSV content for a template
   */
  static generateTemplateCSV(templateId: string, includeExamples: boolean = true): string {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const rows: string[][] = []
    
    // Add header row
    const headers = template.fieldMappings.map(mapping => mapping.csvColumn)
    rows.push(headers)

    // Add sample data if requested
    if (includeExamples && template.sampleData.length > 1) {
      // Skip the header row from sample data (index 0) and add the rest
      rows.push(...template.sampleData.slice(1))
    }

    // Convert to CSV format
    return rows.map(row => 
      row.map(cell => {
        // Escape cells that contain commas, quotes, or newlines
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(',')
    ).join('\n')
  }

  /**
   * Auto-detect template based on CSV headers
   */
  static detectTemplate(headers: string[]): {
    template: CSVTemplate | null
    confidence: number
    matchedFields: number
  } {
    let bestMatch: CSVTemplate | null = null
    let bestConfidence = 0
    let bestMatchedFields = 0

    // Normalize headers and handle encoding issues
    const normalizedHeaders = headers.map(h => this.normalizeHeader(h))

    for (const template of Object.values(this.TEMPLATES)) {
      let matchedFields = 0
      let totalWeight = 0
      let matchedWeight = 0

      for (const mapping of template.fieldMappings) {
        const normalizedColumn = this.normalizeHeader(mapping.csvColumn)
        const weight = mapping.required ? 2 : 1
        totalWeight += weight

        // Check for exact match
        if (normalizedHeaders.includes(normalizedColumn)) {
          matchedFields++
          matchedWeight += weight
          continue
        }

        // Check for partial matches
        const partialMatch = normalizedHeaders.some(header => {
          return header.includes(normalizedColumn) || normalizedColumn.includes(header)
        })

        if (partialMatch) {
          matchedFields++
          matchedWeight += weight * 0.7 // Partial match gets 70% weight
        }

        // Special handling for Turkish Erasmus template
        if (template.id === 'erasmus_turkish') {
          const turkishMatch = this.checkTurkishMatch(headers, mapping.csvColumn)
          if (turkishMatch) {
            matchedFields++
            matchedWeight += weight * 0.9 // High confidence for Turkish matches
          }
        }
      }

      const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0

      if (confidence > bestConfidence) {
        bestMatch = template
        bestConfidence = confidence
        bestMatchedFields = matchedFields
      }
    }

    return {
      template: bestMatch,
      confidence: bestConfidence,
      matchedFields: bestMatchedFields
    }
  }

  /**
   * Normalize header for better matching
   */
  private static normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .trim()
      // Handle common encoding issues
      .replace(/ã¼/g, 'ü')
      .replace(/ã¶/g, 'ö')
      .replace(/ã§/g, 'ç')
      .replace(/ä±/g, 'ı')
      .replace(/ä°/g, 'i')
      .replace(/åž/g, 'ş')
      .replace(/å/g, 'ğ')
  }

  /**
   * Check for Turkish-specific matches
   */
  private static checkTurkishMatch(headers: string[], expectedColumn: string): boolean {
    const turkishMappings: Record<string, string[]> = {
      'şirket adı': ['sirket', 'company', 'firma'],
      'ülke': ['ulke', 'country', 'location'],
      'sektör': ['sektor', 'sector', 'industry'],
      'e-posta tarihi': ['eposta', 'email', 'tarih', 'date'],
      'cevap tarihi': ['cevap', 'response', 'yanitlama'],
      'durum': ['status', 'state'],
      'iletişim bilgisi': ['iletisim', 'contact', 'email'],
      'notlar': ['notes', 'note', 'aciklama']
    }

    const expectedLower = expectedColumn.toLowerCase()
    const possibleMatches = turkishMappings[expectedLower] || []

    return headers.some(header => {
      const headerLower = this.normalizeHeader(header)
      return possibleMatches.some(match => 
        headerLower.includes(match) || match.includes(headerLower)
      )
    })
  }

  /**
   * Generate field mapping based on template
   */
  static generateMappingFromTemplate(
    templateId: string, 
    csvHeaders: string[]
  ): {
    mapping: Record<string, string>
    confidence: Record<string, number>
    unmappedHeaders: string[]
    missingFields: string[]
  } {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const mapping: Record<string, string> = {}
    const confidence: Record<string, number> = {}
    const unmappedHeaders = [...csvHeaders]
    const missingFields: string[] = []

    const normalizedHeaders = csvHeaders.map(h => h.toLowerCase().trim())

    for (const fieldMapping of template.fieldMappings) {
      const targetField = fieldMapping.applicationField
      const expectedColumn = fieldMapping.csvColumn.toLowerCase().trim()
      
      // Look for exact match first
      let matchIndex = normalizedHeaders.findIndex(h => h === expectedColumn)
      let matchConfidence = 1.0

      // If no exact match, look for partial matches
      if (matchIndex === -1) {
        matchIndex = normalizedHeaders.findIndex(h => 
          h.includes(expectedColumn) || expectedColumn.includes(h)
        )
        matchConfidence = 0.7
      }

      // If still no match, try fuzzy matching for common variations
      if (matchIndex === -1) {
        const variations = this.getFieldVariations(fieldMapping.applicationField)
        for (const variation of variations) {
          matchIndex = normalizedHeaders.findIndex(h => 
            h.includes(variation) || variation.includes(h)
          )
          if (matchIndex !== -1) {
            matchConfidence = 0.5
            break
          }
        }
      }

      if (matchIndex !== -1) {
        const actualHeader = csvHeaders[matchIndex]!
        mapping[targetField] = actualHeader
        confidence[targetField] = matchConfidence
        
        // Remove from unmapped list
        const originalIndex = csvHeaders.indexOf(actualHeader)
        if (originalIndex !== -1) {
          unmappedHeaders.splice(unmappedHeaders.indexOf(actualHeader), 1)
        }
      } else if (fieldMapping.required) {
        missingFields.push(fieldMapping.applicationField)
      }
    }

    return {
      mapping,
      confidence,
      unmappedHeaders,
      missingFields
    }
  }

  /**
   * Get common field variations for fuzzy matching
   */
  private static getFieldVariations(field: keyof Application): string[] {
    const variations: Record<string, string[]> = {
      company: ['employer', 'organization', 'firm', 'business', 'corp'],
      position: ['job title', 'role', 'title', 'job', 'position title'],
      location: ['city', 'place', 'address', 'where', 'office'],
      type: ['job type', 'employment type', 'contract', 'work type'],
      salary: ['pay', 'wage', 'compensation', 'income', 'remuneration'],
      status: ['state', 'stage', 'progress', 'application status'],
      appliedDate: ['date applied', 'application date', 'apply date', 'submitted'],
      responseDate: ['response', 'reply date', 'heard back'],
      interviewDate: ['interview', 'meeting date', 'call date'],
      notes: ['comments', 'remarks', 'description', 'memo'],
      contactPerson: ['contact', 'recruiter', 'hr', 'person'],
      contactEmail: ['email', 'contact email', 'recruiter email'],
      website: ['url', 'link', 'site', 'web'],
      tags: ['keywords', 'categories', 'labels']
    }

    return variations[field] || []
  }

  /**
   * Create custom template from user mapping
   */
  static createCustomTemplate(
    name: string,
    description: string,
    mapping: Record<string, string>,
    sampleData?: string[][]
  ): CSVTemplate {
    const fieldMappings: FieldMapping[] = Object.entries(mapping).map(([field, column]) => ({
      csvColumn: column,
      applicationField: field as keyof Application,
      confidence: 1.0,
      required: field === 'company' || field === 'position'
    }))

    return {
      id: `custom-${Date.now()}`,
      name,
      description,
      source: 'custom',
      fieldMappings,
      sampleData: sampleData || [
        Object.values(mapping),
        ...Array(3).fill(null).map(() => 
          Object.keys(mapping).map(() => 'Sample Data')
        )
      ]
    }
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleData(templateId: string, count: number = 10): Record<string, unknown>[] {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const sampleCompanies = [
      'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla', 
      'Spotify', 'Airbnb', 'Uber', 'LinkedIn', 'Twitter', 'Adobe', 'Salesforce'
    ]

    const samplePositions = [
      'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
      'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Machine Learning Engineer', 'Product Designer', 'Engineering Manager'
    ]

    const sampleLocations = [
      'San Francisco, CA', 'Seattle, WA', 'New York, NY', 'Austin, TX',
      'Boston, MA', 'Los Angeles, CA', 'Chicago, IL', 'Denver, CO',
      'Stockholm, Sweden', 'London, UK', 'Berlin, Germany', 'Amsterdam, Netherlands'
    ]

    const sampleStatuses = ['Applied', 'Pending', 'Interviewing', 'Offered', 'Rejected']

    const data: Record<string, unknown>[] = []
    const headers = template.fieldMappings.map(m => m.csvColumn)

    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {}
      
      for (const mapping of template.fieldMappings) {
        const field = mapping.applicationField
        const column = mapping.csvColumn

        switch (field) {
          case 'company':
            row[column] = sampleCompanies[Math.floor(Math.random() * sampleCompanies.length)]
            break
          case 'position':
            row[column] = samplePositions[Math.floor(Math.random() * samplePositions.length)]
            break
          case 'location':
            row[column] = sampleLocations[Math.floor(Math.random() * sampleLocations.length)]
            break
          case 'status':
            row[column] = sampleStatuses[Math.floor(Math.random() * sampleStatuses.length)]
            break
          case 'appliedDate':
            const date = new Date()
            date.setDate(date.getDate() - Math.floor(Math.random() * 30))
            row[column] = date.toISOString().split('T')[0]
            break
          case 'salary':
            row[column] = `$${(Math.floor(Math.random() * 100) + 80)}k`
            break
          case 'type':
            row[column] = Math.random() > 0.8 ? 'Part-time' : 'Full-time'
            break
          default:
            row[column] = `Sample ${field}`
        }
      }
      
      data.push(row)
    }

    return data
  }

  /**
   * Validate template structure
   */
  static validateTemplate(template: Partial<CSVTemplate>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!template.id) errors.push('Template ID is required')
    if (!template.name) errors.push('Template name is required')
    if (!template.description) errors.push('Template description is required')
    if (!template.source) errors.push('Template source is required')
    if (!template.fieldMappings || template.fieldMappings.length === 0) {
      errors.push('Template must have at least one field mapping')
    }

    // Check for required company field
    const hasCompanyField = template.fieldMappings?.some(
      mapping => mapping.applicationField === 'company'
    )
    if (!hasCompanyField) {
      errors.push('Template must include company field mapping')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}