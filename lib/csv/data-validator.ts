import { Application } from '@/types/application'
import { 
  ValidationError, 
  ValidationWarning, 
  ValidationResult,
  FieldMapping 
} from '@/types/csv-import'

/**
 * Comprehensive CSV data validation and cleaning system
 */
export class CSVDataValidator {
  private static readonly DATE_FORMATS = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // M-D-YYYY
    /^\d{2}\/\d{2}\/\d{2}$/, // MM/DD/YY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // M/D/YY
  ]

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static readonly PHONE_REGEX = /^[\+]?[1-9][\d\s\-\(\)\.]{7,15}$/
  private static readonly URL_REGEX = /^https?:\/\/.+/

  private static readonly VALID_STATUSES = [
    'pending', 'applied', 'interviewing', 'offered', 'rejected', 'accepted', 'withdrawn'
  ]

  private static readonly VALID_JOB_TYPES = [
    'full-time', 'part-time', 'internship', 'contract', 'freelance'
  ]

  private static readonly VALID_PRIORITIES = ['low', 'medium', 'high']

  /**
   * Validate entire CSV dataset
   */
  static validateDataset(
    data: any[], 
    mapping: Record<string, string>
  ): { errors: ValidationError[]; warnings: ValidationWarning[]; cleanedData: any[] } {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const cleanedData: any[] = []

    // Track for duplicate detection
    const seenApplications = new Map<string, number>()

    data.forEach((row, index) => {
      const rowNumber = index + 1
      const rowData = row as Record<string, any>
      const cleanedRow = { ...rowData }

      // Validate required fields
      this.validateRequiredFields(rowData, mapping, rowNumber, errors)

      // Validate and clean individual fields
      this.validateAndCleanFields(rowData, cleanedRow, mapping, rowNumber, errors, warnings)

      // Check for duplicates
      this.checkForDuplicates(rowData, mapping, rowNumber, seenApplications, warnings)

      // Validate business logic
      this.validateBusinessLogic(cleanedRow, mapping, rowNumber, errors, warnings)

      cleanedData.push(cleanedRow)
    })

    return { errors, warnings, cleanedData }
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(
    rowData: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    errors: ValidationError[]
  ): void {
    // Company is always required
    const companyField = mapping.company
    if (!companyField || !rowData[companyField] || String(rowData[companyField]).trim() === '') {
      errors.push({
        row: rowNumber,
        column: 'Company',
        message: 'Company field is required and cannot be empty',
        severity: 'error',
        suggestedFix: 'Add a company name or remove this row'
      })
    }

    // Position is highly recommended
    const positionField = mapping.position
    if (!positionField || !rowData[positionField] || String(rowData[positionField]).trim() === '') {
      errors.push({
        row: rowNumber,
        column: 'Position',
        message: 'Position field is required for meaningful tracking',
        severity: 'error',
        suggestedFix: 'Add a job title/position or use "Not Specified"'
      })
    }
  }

  /**
   * Validate and clean individual fields
   */
  private static validateAndCleanFields(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate and clean dates
    this.validateAndCleanDates(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean email
    this.validateAndCleanEmail(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean phone numbers
    this.validateAndCleanPhone(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean URLs
    this.validateAndCleanUrls(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean status
    this.validateAndCleanStatus(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean job type
    this.validateAndCleanJobType(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean priority
    this.validateAndCleanPriority(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Validate and clean salary
    this.validateAndCleanSalary(rowData, cleanedRow, mapping, rowNumber, warnings)

    // Clean text fields
    this.cleanTextFields(rowData, cleanedRow, mapping)
  }

  /**
   * Validate and clean date fields
   */
  private static validateAndCleanDates(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const dateFields = [
      'appliedDate', 'responseDate', 'interviewDate', 
      'offerDate', 'rejectionDate', 'followUpDate'
    ]

    dateFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !rowData[csvColumn]) return

      const dateValue = String(rowData[csvColumn]).trim()
      if (!dateValue) return

      const cleanedDate = this.parseAndCleanDate(dateValue)
      
      if (cleanedDate.isValid) {
        cleanedRow[csvColumn] = cleanedDate.value
        if (cleanedDate.wasModified) {
          warnings.push({
            row: rowNumber,
            column: field,
            message: `Date format standardized from "${dateValue}" to "${cleanedDate.value}"`,
            suggestedFix: 'Date has been automatically formatted to YYYY-MM-DD'
          })
        }
      } else {
        warnings.push({
          row: rowNumber,
          column: field,
          message: `Invalid date format: "${dateValue}"`,
          suggestedFix: 'Use format: YYYY-MM-DD, MM/DD/YYYY, or DD/MM/YYYY'
        })
      }
    })
  }

  /**
   * Parse and clean date values
   */
  private static parseAndCleanDate(dateString: string): { 
    isValid: boolean; 
    value?: string; 
    wasModified: boolean 
  } {
    if (!dateString) return { isValid: false, wasModified: false }

    const originalValue = dateString
    let cleanedValue = dateString.trim()

    // Try parsing as-is first
    let date = new Date(cleanedValue)
    if (!isNaN(date.getTime())) {
      const isoString = date.toISOString().split('T')[0]!
      return { 
        isValid: true, 
        value: isoString, 
        wasModified: originalValue !== isoString 
      }
    }

    // Try different date formats
    for (const format of this.DATE_FORMATS) {
      if (format.test(cleanedValue)) {
        // Handle MM/DD/YYYY format
        if (cleanedValue.includes('/')) {
          const parts = cleanedValue.split('/')
          if (parts.length === 3) {
            // Assume MM/DD/YYYY or M/D/YYYY
            const month = parts[0]!.padStart(2, '0')
            const day = parts[1]!.padStart(2, '0')
            let year = parts[2]!
            
            // Handle 2-digit years
            if (year.length === 2) {
              const currentYear = new Date().getFullYear()
              const century = Math.floor(currentYear / 100) * 100
              year = String(century + parseInt(year))
            }
            
            cleanedValue = `${year}-${month}-${day}`
          }
        }
        // Handle MM-DD-YYYY format
        else if (cleanedValue.includes('-') && !cleanedValue.startsWith('20')) {
          const parts = cleanedValue.split('-')
          if (parts.length === 3) {
            const month = parts[0]!.padStart(2, '0')
            const day = parts[1]!.padStart(2, '0')
            const year = parts[2]!
            cleanedValue = `${year}-${month}-${day}`
          }
        }

        date = new Date(cleanedValue)
        if (!isNaN(date.getTime())) {
          const isoString = date.toISOString().split('T')[0]!
          return { 
            isValid: true, 
            value: isoString, 
            wasModified: true 
          }
        }
      }
    }

    return { isValid: false, wasModified: false }
  }

  /**
   * Validate and clean email addresses
   */
  private static validateAndCleanEmail(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const emailField = mapping.contactEmail
    if (!emailField || !rowData[emailField]) return

    const email = String(rowData[emailField]).trim().toLowerCase()
    if (!email) return

    if (this.EMAIL_REGEX.test(email)) {
      cleanedRow[emailField] = email
    } else {
      warnings.push({
        row: rowNumber,
        column: 'Contact Email',
        message: `Invalid email format: "${rowData[emailField]}"`,
        suggestedFix: 'Use format: user@domain.com'
      })
    }
  }

  /**
   * Validate and clean phone numbers
   */
  private static validateAndCleanPhone(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const phoneField = mapping.contactPhone
    if (!phoneField || !rowData[phoneField]) return

    const phone = String(rowData[phoneField]).trim()
    if (!phone) return

    // Clean phone number (remove extra spaces, format consistently)
    const cleanedPhone = phone.replace(/[^\d\+\-\(\)\s]/g, '')
    
    if (this.PHONE_REGEX.test(cleanedPhone)) {
      cleanedRow[phoneField] = cleanedPhone
    } else {
      warnings.push({
        row: rowNumber,
        column: 'Contact Phone',
        message: `Invalid phone format: "${phone}"`,
        suggestedFix: 'Use format: +1-555-123-4567 or (555) 123-4567'
      })
    }
  }

  /**
   * Validate and clean URLs
   */
  private static validateAndCleanUrls(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const urlFields = ['website', 'jobUrl', 'companyWebsite']
    
    urlFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !rowData[csvColumn]) return

      let url = String(rowData[csvColumn]).trim()
      if (!url) return

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`
      }

      try {
        new URL(url)
        cleanedRow[csvColumn] = url
        
        if (url !== rowData[csvColumn]) {
          warnings.push({
            row: rowNumber,
            column: field,
            message: `URL format corrected: "${rowData[csvColumn]}" → "${url}"`,
            suggestedFix: 'URL has been automatically formatted with https://'
          })
        }
      } catch {
        warnings.push({
          row: rowNumber,
          column: field,
          message: `Invalid URL format: "${rowData[csvColumn]}"`,
          suggestedFix: 'Include protocol (https://) and valid domain'
        })
      }
    })
  }

  /**
   * Validate and clean status values
   */
  private static validateAndCleanStatus(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const statusField = mapping.status
    if (!statusField || !rowData[statusField]) return

    const status = String(rowData[statusField]).trim().toLowerCase()
    if (!status) return

    const normalizedStatus = this.normalizeStatus(status)
    
    if (normalizedStatus) {
      cleanedRow[statusField] = normalizedStatus
      
      if (normalizedStatus.toLowerCase() !== status) {
        warnings.push({
          row: rowNumber,
          column: 'Status',
          message: `Status standardized: "${rowData[statusField]}" → "${normalizedStatus}"`,
          suggestedFix: 'Status has been automatically standardized'
        })
      }
    } else {
      warnings.push({
        row: rowNumber,
        column: 'Status',
        message: `Unknown status: "${rowData[statusField]}"`,
        suggestedFix: `Use one of: ${this.VALID_STATUSES.join(', ')}`
      })
    }
  }

  /**
   * Normalize status values
   */
  private static normalizeStatus(status: string): string | null {
    const statusLower = status.toLowerCase()
    
    if (statusLower.includes('applied') || statusLower.includes('submit')) return 'Applied'
    if (statusLower.includes('interview') || statusLower.includes('screen')) return 'Interviewing'
    if (statusLower.includes('offer') || statusLower.includes('accept')) return 'Offered'
    if (statusLower.includes('reject') || statusLower.includes('decline') || statusLower.includes('denied')) return 'Rejected'
    if (statusLower.includes('hired') || statusLower.includes('accepted')) return 'Accepted'
    if (statusLower.includes('withdraw') || statusLower.includes('cancel')) return 'Withdrawn'
    if (statusLower.includes('pending') || statusLower.includes('waiting') || statusLower.includes('review')) return 'Pending'
    
    return null
  }

  /**
   * Validate and clean job type
   */
  private static validateAndCleanJobType(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const typeField = mapping.type || mapping.jobType
    if (!typeField || !rowData[typeField]) return

    const type = String(rowData[typeField]).trim().toLowerCase()
    if (!type) return

    const normalizedType = this.normalizeJobType(type)
    
    if (normalizedType) {
      cleanedRow[typeField] = normalizedType
      
      if (normalizedType.toLowerCase() !== type) {
        warnings.push({
          row: rowNumber,
          column: 'Job Type',
          message: `Job type standardized: "${rowData[typeField]}" → "${normalizedType}"`,
          suggestedFix: 'Job type has been automatically standardized'
        })
      }
    } else {
      warnings.push({
        row: rowNumber,
        column: 'Job Type',
        message: `Unknown job type: "${rowData[typeField]}"`,
        suggestedFix: `Use one of: ${this.VALID_JOB_TYPES.join(', ')}`
      })
    }
  }

  /**
   * Normalize job type values
   */
  private static normalizeJobType(type: string): string | null {
    const typeLower = type.toLowerCase()
    
    if (typeLower.includes('part') || typeLower.includes('pt')) return 'Part-time'
    if (typeLower.includes('intern') || typeLower.includes('trainee')) return 'Internship'
    if (typeLower.includes('contract') || typeLower.includes('temp') || typeLower.includes('consultant')) return 'Contract'
    if (typeLower.includes('freelance') || typeLower.includes('gig')) return 'Freelance'
    if (typeLower.includes('full') || typeLower.includes('ft') || typeLower.includes('permanent')) return 'Full-time'
    
    return null
  }

  /**
   * Validate and clean priority
   */
  private static validateAndCleanPriority(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const priorityField = mapping.priority
    if (!priorityField || !rowData[priorityField]) return

    const priority = String(rowData[priorityField]).trim().toLowerCase()
    if (!priority) return

    const normalizedPriority = this.normalizePriority(priority)
    
    if (normalizedPriority) {
      cleanedRow[priorityField] = normalizedPriority
    } else {
      warnings.push({
        row: rowNumber,
        column: 'Priority',
        message: `Unknown priority: "${rowData[priorityField]}"`,
        suggestedFix: `Use one of: ${this.VALID_PRIORITIES.join(', ')}`
      })
    }
  }

  /**
   * Normalize priority values
   */
  private static normalizePriority(priority: string): string | null {
    const priorityLower = priority.toLowerCase()
    
    if (priorityLower.includes('high') || priorityLower.includes('urgent') || priorityLower.includes('important')) return 'High'
    if (priorityLower.includes('low') || priorityLower.includes('minor')) return 'Low'
    if (priorityLower.includes('medium') || priorityLower.includes('normal') || priorityLower.includes('standard')) return 'Medium'
    
    return null
  }

  /**
   * Validate and clean salary information
   */
  private static validateAndCleanSalary(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const salaryField = mapping.salary || mapping.salaryRange
    if (!salaryField || !rowData[salaryField]) return

    const salary = String(rowData[salaryField]).trim()
    if (!salary) return

    // Clean salary format (remove extra spaces, standardize currency symbols)
    const cleanedSalary = salary
      .replace(/\s+/g, ' ')
      .replace(/\$\s+/g, '$')
      .replace(/\s+k\b/gi, 'k')
      .replace(/\s+per\s+/gi, ' per ')

    if (cleanedSalary !== salary) {
      cleanedRow[salaryField] = cleanedSalary
      warnings.push({
        row: rowNumber,
        column: 'Salary',
        message: `Salary format cleaned: "${salary}" → "${cleanedSalary}"`,
        suggestedFix: 'Salary format has been standardized'
      })
    }
  }

  /**
   * Clean text fields (trim, normalize whitespace)
   */
  private static cleanTextFields(
    rowData: Record<string, any>,
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>
  ): void {
    const textFields = [
      'company', 'position', 'location', 'notes', 'jobDescription',
      'contactPerson', 'requirements', 'tags'
    ]

    textFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !rowData[csvColumn]) return

      const value = String(rowData[csvColumn])
      const cleaned = value.trim().replace(/\s+/g, ' ')
      
      if (cleaned !== value) {
        cleanedRow[csvColumn] = cleaned
      }
    })
  }

  /**
   * Check for duplicate applications
   */
  private static checkForDuplicates(
    rowData: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    seenApplications: Map<string, number>,
    warnings: ValidationWarning[]
  ): void {
    const company = mapping.company ? String(rowData[mapping.company] || '').trim().toLowerCase() : ''
    const position = mapping.position ? String(rowData[mapping.position] || '').trim().toLowerCase() : ''
    
    if (!company) return

    const key = `${company}|${position}`
    
    if (seenApplications.has(key)) {
      const originalRow = seenApplications.get(key)!
      warnings.push({
        row: rowNumber,
        column: 'Duplicate',
        message: `Potential duplicate of row ${originalRow}: ${company} - ${position}`,
        suggestedFix: 'Review if this is the same application or update company/position to differentiate'
      })
    } else {
      seenApplications.set(key, rowNumber)
    }
  }

  /**
   * Validate business logic and relationships
   */
  private static validateBusinessLogic(
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate date chronology
    this.validateDateChronology(cleanedRow, mapping, rowNumber, warnings)

    // Validate status consistency
    this.validateStatusConsistency(cleanedRow, mapping, rowNumber, warnings)

    // Validate required fields based on status
    this.validateStatusRequiredFields(cleanedRow, mapping, rowNumber, warnings)
  }

  /**
   * Validate date chronology
   */
  private static validateDateChronology(
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const dates: { field: string; date: Date; name: string }[] = []

    const dateFields = [
      { field: 'appliedDate', name: 'Applied' },
      { field: 'responseDate', name: 'Response' },
      { field: 'interviewDate', name: 'Interview' },
      { field: 'offerDate', name: 'Offer' },
      { field: 'rejectionDate', name: 'Rejection' }
    ]

    dateFields.forEach(({ field, name }) => {
      const csvColumn = mapping[field]
      if (csvColumn && cleanedRow[csvColumn]) {
        const date = new Date(cleanedRow[csvColumn])
        if (!isNaN(date.getTime())) {
          dates.push({ field, date, name })
        }
      }
    })

    // Check chronological order
    for (let i = 0; i < dates.length - 1; i++) {
      for (let j = i + 1; j < dates.length; j++) {
        if (dates[i]!.date > dates[j]!.date) {
          warnings.push({
            row: rowNumber,
            column: 'Date Logic',
            message: `${dates[i]!.name} date (${dates[i]!.date.toISOString().split('T')[0]}) is after ${dates[j]!.name} date (${dates[j]!.date.toISOString().split('T')[0]})`,
            suggestedFix: 'Check date order - events should be chronological'
          })
        }
      }
    }
  }

  /**
   * Validate status consistency with dates
   */
  private static validateStatusConsistency(
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const statusField = mapping.status
    if (!statusField || !cleanedRow[statusField]) return

    const status = String(cleanedRow[statusField]).toLowerCase()
    
    // Check if status matches available dates
    if (status === 'interviewing' && mapping.interviewDate && !cleanedRow[mapping.interviewDate]) {
      warnings.push({
        row: rowNumber,
        column: 'Status Consistency',
        message: 'Status is "Interviewing" but no interview date provided',
        suggestedFix: 'Add interview date or update status'
      })
    }

    if (status === 'offered' && mapping.offerDate && !cleanedRow[mapping.offerDate]) {
      warnings.push({
        row: rowNumber,
        column: 'Status Consistency',
        message: 'Status is "Offered" but no offer date provided',
        suggestedFix: 'Add offer date or update status'
      })
    }

    if (status === 'rejected' && mapping.rejectionDate && !cleanedRow[mapping.rejectionDate]) {
      warnings.push({
        row: rowNumber,
        column: 'Status Consistency',
        message: 'Status is "Rejected" but no rejection date provided',
        suggestedFix: 'Add rejection date or update status'
      })
    }
  }

  /**
   * Validate required fields based on status
   */
  private static validateStatusRequiredFields(
    cleanedRow: Record<string, any>,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const statusField = mapping.status
    if (!statusField || !cleanedRow[statusField]) return

    const status = String(cleanedRow[statusField]).toLowerCase()
    
    // Applied status should have applied date
    if (status !== 'pending' && mapping.appliedDate && !cleanedRow[mapping.appliedDate]) {
      warnings.push({
        row: rowNumber,
        column: 'Required Field',
        message: `Status "${cleanedRow[statusField]}" requires an applied date`,
        suggestedFix: 'Add applied date or change status to "Pending"'
      })
    }
  }

  /**
   * Generate validation summary
   */
  static generateValidationSummary(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): {
    totalIssues: number
    criticalErrors: number
    warnings: number
    canProceed: boolean
    summary: string
    recommendations: string[]
  } {
    const criticalErrors = errors.length
    const warningCount = warnings.length
    const totalIssues = criticalErrors + warningCount
    const canProceed = criticalErrors === 0

    let summary = ''
    const recommendations: string[] = []

    if (totalIssues === 0) {
      summary = 'All data validated successfully! Ready to import.'
    } else if (criticalErrors === 0) {
      summary = `Found ${warningCount} warnings that will be auto-corrected during import.`
      recommendations.push('Review warnings to ensure data accuracy')
    } else {
      summary = `Found ${criticalErrors} critical errors and ${warningCount} warnings.`
      recommendations.push('Fix critical errors before importing')
      if (warningCount > 0) {
        recommendations.push('Warnings will be auto-corrected during import')
      }
    }

    // Add specific recommendations based on error patterns
    const errorTypes = new Set(errors.map(e => e.column))
    const warningTypes = new Set(warnings.map(w => w.column))

    if (errorTypes.has('Company') || errorTypes.has('Position')) {
      recommendations.push('Ensure all rows have company and position information')
    }

    if (warningTypes.has('Status') || warningTypes.has('Job Type')) {
      recommendations.push('Consider using standardized values for better consistency')
    }

    if (warningTypes.has('Duplicate')) {
      recommendations.push('Review potential duplicates to avoid importing the same application twice')
    }

    return {
      totalIssues,
      criticalErrors,
      warnings: warningCount,
      canProceed,
      summary,
      recommendations
    }
  }
}