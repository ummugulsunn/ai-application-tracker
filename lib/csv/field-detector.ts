import { ColumnDetectionResult } from '@/types/csv-import'
import { Application } from '@/types/application'
import { CSVTemplateSystem } from './templates'

/**
 * Enhanced field detection with template-based auto-mapping and machine learning-like scoring
 */
export class FieldDetector {
  private static readonly FIELD_MAPPINGS = {
    company: {
      keywords: [
        'company', 'şirket', 'firma', 'employer', 'organization', 'company name', 
        'şirket adı', 'firma adı', 'employer name', 'corp', 'corporation',
        'business', 'enterprise', 'inc', 'ltd', 'llc', 'co'
      ],
      weight: 1.0,
      required: true,
      patterns: [/company/i, /firm/i, /corp/i, /inc/i, /ltd/i]
    },
    position: {
      keywords: [
        'position', 'pozisyon', 'job title', 'role', 'title', 'job', 'iş', 
        'meslek', 'position title', 'job role', 'designation', 'post'
      ],
      weight: 0.9,
      required: false,
      patterns: [/position/i, /title/i, /role/i, /job/i]
    },
    location: {
      keywords: [
        'location', 'lokasyon', 'place', 'city', 'country', 'şehir', 'ülke', 
        'yer', 'address', 'where', 'site', 'office', 'region'
      ],
      weight: 0.8,
      required: false,
      patterns: [/location/i, /city/i, /country/i, /address/i, /where/i]
    },
    status: {
      keywords: [
        'status', 'durum', 'state', 'application status', 'başvuru durumu', 
        'current status', 'stage', 'phase', 'progress'
      ],
      weight: 0.7,
      required: false,
      patterns: [/status/i, /state/i, /stage/i, /progress/i]
    },
    appliedDate: {
      keywords: [
        'applied date', 'başvuru tarihi', 'date applied', 'application date', 
        'applied', 'tarih', 'submit date', 'submission date', 'apply date'
      ],
      weight: 0.8,
      required: false,
      patterns: [/applied.*date/i, /date.*applied/i, /application.*date/i, /submit.*date/i]
    },
    responseDate: {
      keywords: [
        'response date', 'cevap tarihi', 'reply date', 'response', 'cevap', 
        'reply received', 'feedback date', 'answer date'
      ],
      weight: 0.6,
      required: false,
      patterns: [/response.*date/i, /reply.*date/i, /feedback.*date/i]
    },
    interviewDate: {
      keywords: [
        'interview date', 'mülakat tarihi', 'interview', 'mülakat', 
        'meeting date', 'call date', 'screening date'
      ],
      weight: 0.6,
      required: false,
      patterns: [/interview.*date/i, /meeting.*date/i, /call.*date/i]
    },
    notes: {
      keywords: [
        'notes', 'notlar', 'comments', 'description', 'açıklama', 'yorum', 
        'remarks', 'memo', 'details', 'info', 'information'
      ],
      weight: 0.5,
      required: false,
      patterns: [/notes/i, /comments/i, /remarks/i, /description/i, /details/i]
    },
    contactEmail: {
      keywords: [
        'contact email', 'email', 'e-mail', 'contact', 'iletişim', 
        'email address', 'mail', 'recruiter email', 'hr email'
      ],
      weight: 0.7,
      required: false,
      patterns: [/email/i, /mail/i, /contact.*email/i, /@/]
    },
    contactPerson: {
      keywords: [
        'contact person', 'contact', 'person', 'name', 'kişi', 'iletişim kişisi', 
        'recruiter', 'hr', 'hiring manager', 'contact name'
      ],
      weight: 0.6,
      required: false,
      patterns: [/contact.*person/i, /recruiter/i, /hr/i, /manager/i, /name/i]
    },
    website: {
      keywords: [
        'website', 'web site', 'url', 'link', 'site', 'web address', 
        'homepage', 'web', 'portal'
      ],
      weight: 0.5,
      required: false,
      patterns: [/website/i, /url/i, /link/i, /http/i, /www/i, /\.com/i]
    },
    tags: {
      keywords: [
        'tags', 'etiketler', 'sector', 'sektör', 'category', 'kategori', 
        'skills', 'yetenekler', 'technologies', 'keywords', 'labels'
      ],
      weight: 0.6,
      required: false,
      patterns: [/tags/i, /skills/i, /tech/i, /category/i, /keywords/i]
    },
    salary: {
      keywords: [
        'salary', 'maaş', 'wage', 'compensation', 'pay', 'ücret', 'payment', 
        'remuneration', 'income', 'earnings', 'package'
      ],
      weight: 0.7,
      required: false,
      patterns: [/salary/i, /wage/i, /pay/i, /compensation/i, /\$/i, /€/i, /£/i]
    },
    type: {
      keywords: [
        'type', 'tip', 'job type', 'employment type', 'iş türü', 'çalışma türü', 
        'work type', 'contract type', 'employment'
      ],
      weight: 0.6,
      required: false,
      patterns: [/type/i, /employment/i, /contract/i, /full.*time/i, /part.*time/i]
    },
    priority: {
      keywords: [
        'priority', 'öncelik', 'importance', 'urgent', 'acil', 'level', 
        'rank', 'preference'
      ],
      weight: 0.5,
      required: false,
      patterns: [/priority/i, /importance/i, /urgent/i, /level/i, /rank/i]
    }
  } as const

  /**
   * Detect column mappings with enhanced algorithms and template-based auto-mapping
   */
  static detectColumns(csvColumns: string[], sampleData?: any[]): ColumnDetectionResult {
    // First, try template-based detection for higher accuracy
    const templateDetection = CSVTemplateSystem.detectTemplate(csvColumns)
    
    if (templateDetection.template && templateDetection.confidence > 0.7) {
      // High confidence template match - use template mapping
      const templateMapping = CSVTemplateSystem.generateMappingFromTemplate(
        templateDetection.template.id, 
        csvColumns
      )
      
      return {
        detectedMapping: templateMapping.mapping,
        confidence: templateMapping.confidence,
        suggestions: [
          `Detected ${templateDetection.template.name} format with ${Math.round(templateDetection.confidence * 100)}% confidence`
        ]
      }
    }

    // Fallback to pattern-based detection
    const detectedMapping: Record<string, string> = {}
    const confidence: Record<string, number> = {}
    const suggestions: string[] = []

    // If we have a low-confidence template match, use it as a starting point
    if (templateDetection.template && templateDetection.confidence > 0.4) {
      const templateMapping = CSVTemplateSystem.generateMappingFromTemplate(
        templateDetection.template.id, 
        csvColumns
      )
      
      // Use template mappings with high confidence
      Object.entries(templateMapping.mapping).forEach(([field, column]) => {
        const templateConfidence = templateMapping.confidence[field] || 0
        if (templateConfidence > 0.6) {
          detectedMapping[field] = column
          confidence[field] = templateConfidence
        }
      })
      
      suggestions.push(`Partially matched ${templateDetection.template.name} format. Please review mappings.`)
    }

    // Analyze each CSV column against our field mappings for unmapped fields
    Object.entries(this.FIELD_MAPPINGS).forEach(([field, config]) => {
      // Skip if already mapped by template
      if (detectedMapping[field]) return

      let bestMatch = ''
      let bestScore = 0

      csvColumns.forEach(csvColumn => {
        // Skip if column is already mapped
        if (Object.values(detectedMapping).includes(csvColumn)) return

        const score = this.calculateFieldScore(csvColumn, config, sampleData)
        if (score > bestScore && score > 0.3) { // Minimum threshold
          bestScore = score
          bestMatch = csvColumn
        }
      })

      if (bestMatch) {
        detectedMapping[field] = bestMatch
        confidence[field] = bestScore
        
        if (bestScore < 0.6) {
          suggestions.push(`Low confidence for ${field} mapping. Please verify "${bestMatch}" is correct.`)
        }
      } else if (config.required) {
        suggestions.push(`Required field "${field}" could not be auto-detected. Please map manually.`)
      }
    })

    // Add suggestions for unmapped columns
    const mappedColumns = new Set(Object.values(detectedMapping))
    const unmappedColumns = csvColumns.filter(col => !mappedColumns.has(col))
    
    if (unmappedColumns.length > 0) {
      suggestions.push(`${unmappedColumns.length} columns were not mapped: ${unmappedColumns.slice(0, 3).join(', ')}${unmappedColumns.length > 3 ? '...' : ''}`)
    }

    // Add template suggestions if no template was used
    if (!templateDetection.template || templateDetection.confidence <= 0.4) {
      const availableTemplates = CSVTemplateSystem.getAllTemplates()
      suggestions.push(`Consider using a template: ${availableTemplates.slice(0, 3).map(t => t.name).join(', ')}`)
    }

    return { detectedMapping, confidence, suggestions }
  }

  /**
   * Detect columns using a specific template
   */
  static detectColumnsWithTemplate(
    csvColumns: string[], 
    templateId: string, 
    sampleData?: any[]
  ): ColumnDetectionResult {
    const template = CSVTemplateSystem.getTemplate(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }

    const templateMapping = CSVTemplateSystem.generateMappingFromTemplate(templateId, csvColumns)
    
    // Enhance with content analysis if sample data is available
    if (sampleData && sampleData.length > 0) {
      Object.entries(templateMapping.mapping).forEach(([field, column]) => {
        const fieldConfig = this.FIELD_MAPPINGS[field as keyof typeof this.FIELD_MAPPINGS]
        if (fieldConfig) {
          const contentScore = this.analyzeColumnContent(column, sampleData, fieldConfig)
          // Adjust confidence based on content analysis
          templateMapping.confidence[field] = Math.min(1, 
            (templateMapping.confidence[field] || 0) * 0.7 + contentScore * 0.3
          )
        }
      })
    }

    return {
      detectedMapping: templateMapping.mapping,
      confidence: templateMapping.confidence,
      suggestions: [
        `Using ${template.name} template`
      ]
    }
  }

  /**
   * Calculate field matching score using multiple algorithms
   */
  private static calculateFieldScore(
    csvColumn: string, 
    config: typeof this.FIELD_MAPPINGS[keyof typeof this.FIELD_MAPPINGS],
    sampleData?: any[]
  ): number {
    const columnLower = csvColumn.toLowerCase().trim()
    let score = 0

    // 1. Exact keyword matching (highest weight)
    const exactMatch = config.keywords.find(keyword => 
      keyword.toLowerCase() === columnLower
    )
    if (exactMatch) {
      score += 0.9 * config.weight
    }

    // 2. Partial keyword matching
    const partialMatches = config.keywords.filter(keyword =>
      columnLower.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(columnLower)
    )
    if (partialMatches.length > 0) {
      score += (0.6 * partialMatches.length / config.keywords.length) * config.weight
    }

    // 3. Fuzzy string matching
    const fuzzyScores = config.keywords.map(keyword => 
      this.calculateJaroWinkler(columnLower, keyword.toLowerCase())
    )
    const bestFuzzyScore = Math.max(...fuzzyScores)
    if (bestFuzzyScore > 0.7) {
      score += (bestFuzzyScore * 0.4) * config.weight
    }

    // 4. Pattern matching
    if (config.patterns) {
      const patternMatches = config.patterns.filter(pattern => pattern.test(csvColumn))
      if (patternMatches.length > 0) {
        score += (0.3 * patternMatches.length / config.patterns.length) * config.weight
      }
    }

    // 5. Data content analysis (if sample data available)
    if (sampleData && sampleData.length > 0) {
      const contentScore = this.analyzeColumnContent(csvColumn, sampleData, config)
      score += contentScore * 0.2 * config.weight
    }

    return Math.min(1, score)
  }

  /**
   * Analyze column content to improve detection accuracy
   */
  private static analyzeColumnContent(
    csvColumn: string, 
    sampleData: any[], 
    config: typeof this.FIELD_MAPPINGS[keyof typeof this.FIELD_MAPPINGS]
  ): number {
    const values = sampleData
      .map(row => row[csvColumn])
      .filter(val => val != null && String(val).trim() !== '')
      .slice(0, 10) // Analyze first 10 non-empty values

    if (values.length === 0) return 0

    let contentScore = 0

    // Analyze based on field type
    const fieldKey = Object.keys(this.FIELD_MAPPINGS).find(key => 
      this.FIELD_MAPPINGS[key as keyof typeof this.FIELD_MAPPINGS] === config
    )

    switch (fieldKey) {
      case 'contactEmail':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const emailMatches = values.filter(val => emailPattern.test(String(val))).length
        contentScore = emailMatches / values.length
        break

      case 'appliedDate':
      case 'responseDate':
      case 'interviewDate':
        const dateMatches = values.filter(val => !isNaN(Date.parse(String(val)))).length
        contentScore = dateMatches / values.length
        break

      case 'salary':
        const salaryPattern = /[\d,]+\s*(k|K|\$|€|£|SEK|USD|EUR|GBP)/
        const salaryMatches = values.filter(val => salaryPattern.test(String(val))).length
        contentScore = salaryMatches / values.length
        break

      case 'website':
        const urlPattern = /(https?:\/\/|www\.|\.com|\.org|\.net)/
        const urlMatches = values.filter(val => urlPattern.test(String(val))).length
        contentScore = urlMatches / values.length
        break

      case 'status':
        const statusKeywords = ['pending', 'applied', 'interview', 'rejected', 'accepted', 'offered']
        const statusMatches = values.filter(val => 
          statusKeywords.some(keyword => 
            String(val).toLowerCase().includes(keyword)
          )
        ).length
        contentScore = statusMatches / values.length
        break

      default:
        // Generic content analysis - check for reasonable text length and variety
        const avgLength = values.reduce((sum, val) => sum + String(val).length, 0) / values.length
        const uniqueValues = new Set(values.map(val => String(val).toLowerCase())).size
        
        if (avgLength > 2 && uniqueValues > 1) {
          contentScore = Math.min(1, (uniqueValues / values.length) * (avgLength / 20))
        }
        break
    }

    return Math.min(1, contentScore)
  }

  /**
   * Jaro-Winkler string similarity algorithm
   */
  private static calculateJaroWinkler(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.length === 0 || str2.length === 0) return 0.0

    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1
    if (matchWindow < 0) return 0.0

    const str1Matches = new Array(str1.length).fill(false)
    const str2Matches = new Array(str2.length).fill(false)

    let matches = 0
    let transpositions = 0

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchWindow)
      const end = Math.min(i + matchWindow + 1, str2.length)

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue
        str1Matches[i] = true
        str2Matches[j] = true
        matches++
        break
      }
    }

    if (matches === 0) return 0.0

    // Count transpositions
    let k = 0
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue
      while (!str2Matches[k]) k++
      if (str1[i] !== str2[k]) transpositions++
      k++
    }

    const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3

    // Winkler modification
    let prefix = 0
    for (let i = 0; i < Math.min(4, Math.min(str1.length, str2.length)); i++) {
      if (str1[i] === str2[i]) prefix++
      else break
    }

    return jaro + 0.1 * prefix * (1 - jaro)
  }

  /**
   * Get field suggestions for manual mapping
   */
  static getFieldSuggestions(csvColumn: string): Array<{ field: keyof Application; confidence: number }> {
    const suggestions: Array<{ field: keyof Application; confidence: number }> = []

    Object.entries(this.FIELD_MAPPINGS).forEach(([field, config]) => {
      const score = this.calculateFieldScore(csvColumn, config)
      if (score > 0.2) {
        suggestions.push({ 
          field: field as keyof Application, 
          confidence: score 
        })
      }
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }
}