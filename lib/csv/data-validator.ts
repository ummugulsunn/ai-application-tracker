import { ValidationError, ValidationWarning } from '@/types/csv-import'

/**
 * Enhanced CSV data validator with comprehensive validation and cleaning
 */
export class CSVDataValidator {
  private static readonly REQUIRED_FIELDS = ['company']
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static readonly URL_REGEX = /^https?:\/\/.+/

  /**
   * Validate and clean a dataset
   */
  static validateDataset(
    data: any[],
    mapping: Record<string, string>
  ): {
    errors: ValidationError[]
    warnings: ValidationWarning[]
    cleanedData: any[]
  } {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const cleanedData: any[] = []

    // Track duplicates
    const seenApplications = new Set<string>()

    data.forEach((row, index) => {
      const cleanedRow = { ...row }
      const rowNumber = index + 1

      // Validate required fields
      this.validateRequiredFields(row, mapping, rowNumber, errors)

      // Clean and validate specific fields
      this.cleanDateFields(cleanedRow, mapping, rowNumber, warnings)
      this.cleanEmailFields(cleanedRow, mapping, rowNumber, warnings)
      this.cleanUrlFields(cleanedRow, mapping, rowNumber, warnings)
      this.normalizeStatusField(cleanedRow, mapping, rowNumber, warnings)

      // Check for duplicates
      this.checkDuplicates(cleanedRow, mapping, rowNumber, seenApplications, warnings)

      // Validate date chronology
      this.validateDateChronology(cleanedRow, mapping, rowNumber, warnings)

      cleanedData.push(cleanedRow)
    })

    return { errors, warnings, cleanedData }
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    errors: ValidationError[]
  ): void {
    this.REQUIRED_FIELDS.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn) return

      const value = row[csvColumn]
      if (!value || String(value).trim() === '') {
        errors.push({
          row: rowNumber,
          column: csvColumn,
          message: `Required field '${field}' is missing or empty`,
          severity: 'error',
          suggestedFix: `Add ${field} value`
        })
      }
    })
  }

  /**
   * Clean and validate date fields
   */
  private static cleanDateFields(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const dateFields = ['appliedDate', 'responseDate', 'interviewDate', 'followUpDate', 'offerDate', 'rejectionDate']
    
    dateFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !row[csvColumn]) return

      const originalValue = String(row[csvColumn]).trim()
      if (!originalValue) return

      const cleanedDate = this.parseAndCleanDate(originalValue)
      if (cleanedDate && cleanedDate !== originalValue) {
        row[csvColumn] = cleanedDate
        warnings.push({
          row: rowNumber,
          column: csvColumn,
          message: `Date format standardized from '${originalValue}' to '${cleanedDate}'`,
          suggestedFix: 'Auto-corrected'
        })
      }
    })
  }

  /**
   * Parse and clean date string
   */
  private static parseAndCleanDate(dateString: string): string | null {
    if (!dateString) return null

    // Try parsing various date formats
    const formats = [
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // YYYY-MM-DD (already correct)
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // DD.MM.YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
    ]

    // If already in YYYY-MM-DD format, validate and return
    if (formats[2]?.test(dateString)) {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? null : dateString
    }

    // Try MM/DD/YYYY format first (common in US)
    const mmddMatch = dateString.match(formats[0]!)
    if (mmddMatch) {
      const [, month, day, year] = mmddMatch
      const date = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!))
      if (!isNaN(date.getTime())) {
        return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
      }
    }

    // Try DD.MM.YYYY format (common in Europe)
    const ddmmMatch = dateString.match(formats[3]!)
    if (ddmmMatch) {
      const [, day, month, year] = ddmmMatch
      const date = new Date(parseInt(year!), parseInt(month!) - 1, parseInt(day!))
      if (!isNaN(date.getTime())) {
        return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`
      }
    }

    // Try native Date parsing as fallback
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]!
    }

    return null
  }

  /**
   * Clean and validate email fields
   */
  private static cleanEmailFields(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const emailFields = ['contactEmail']
    
    emailFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !row[csvColumn]) return

      const originalEmail = String(row[csvColumn]).trim()
      if (!originalEmail) return

      // Clean email (lowercase, trim)
      const cleanedEmail = originalEmail.toLowerCase().trim()
      
      // Validate email format
      if (!this.EMAIL_REGEX.test(cleanedEmail)) {
        warnings.push({
          row: rowNumber,
          column: this.getDisplayColumnName(field),
          message: `Invalid email format: '${originalEmail}'`,
          suggestedFix: 'Correct email format'
        })
      } else if (cleanedEmail !== originalEmail) {
        row[csvColumn] = cleanedEmail
        warnings.push({
          row: rowNumber,
          column: csvColumn,
          message: `Email standardized from '${originalEmail}' to '${cleanedEmail}'`,
          suggestedFix: 'Auto-corrected'
        })
      }
    })
  }

  /**
   * Clean and validate URL fields
   */
  private static cleanUrlFields(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const urlFields = ['jobUrl', 'website', 'companyWebsite']
    
    urlFields.forEach(field => {
      const csvColumn = mapping[field]
      if (!csvColumn || !row[csvColumn]) return

      const originalUrl = String(row[csvColumn]).trim()
      if (!originalUrl) return

      let cleanedUrl = originalUrl

      // Add protocol if missing
      if (!this.URL_REGEX.test(cleanedUrl)) {
        cleanedUrl = `https://${cleanedUrl}`
        row[csvColumn] = cleanedUrl
        warnings.push({
          row: rowNumber,
          column: csvColumn,
          message: `URL protocol added: '${originalUrl}' → '${cleanedUrl}'`,
          suggestedFix: 'Auto-corrected'
        })
      }
    })
  }

  /**
   * Normalize status field
   */
  private static normalizeStatusField(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const statusColumn = mapping.status
    if (!statusColumn || !row[statusColumn]) return

    const originalStatus = String(row[statusColumn]).trim()
    if (!originalStatus) return

    const normalizedStatus = this.normalizeStatus(originalStatus)
    
    if (normalizedStatus !== originalStatus) {
      row[statusColumn] = normalizedStatus
      warnings.push({
        row: rowNumber,
        column: statusColumn,
        message: `Status standardized from '${originalStatus}' to '${normalizedStatus}'`,
        suggestedFix: 'Auto-corrected'
      })
    }
  }

  /**
   * Normalize status value
   */
  private static normalizeStatus(status: string): string {
    const statusLower = status.toLowerCase()
    
    // English status mappings
    if (statusLower.includes('applied') || statusLower.includes('submitted')) return 'Applied'
    if (statusLower.includes('interview')) return 'Interviewing'
    if (statusLower.includes('offer')) return 'Offered'
    if (statusLower.includes('reject')) return 'Rejected'
    if (statusLower.includes('accept')) return 'Accepted'
    if (statusLower.includes('withdraw')) return 'Withdrawn'
    
    // Turkish status mappings
    if (statusLower.includes('başvuru yapıldı') || statusLower.includes('başvuruldu')) return 'Applied'
    if (statusLower.includes('mülakat') || statusLower.includes('görüşme')) return 'Interviewing'
    if (statusLower.includes('teklif') || statusLower.includes('kabul edildi')) return 'Offered'
    if (statusLower.includes('reddedildi') || statusLower.includes('red')) return 'Rejected'
    if (statusLower.includes('kabul ettim') || statusLower.includes('onayladım')) return 'Accepted'
    if (statusLower.includes('geri çektim') || statusLower.includes('iptal')) return 'Withdrawn'
    
    return 'Pending'
  }

  /**
   * Check for duplicate applications
   */
  private static checkDuplicates(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    seenApplications: Set<string>,
    warnings: ValidationWarning[]
  ): void {
    const companyColumn = mapping.company
    const positionColumn = mapping.position
    
    if (!companyColumn || !row[companyColumn]) return

    const company = String(row[companyColumn]).trim().toLowerCase()
    const position = positionColumn && row[positionColumn] 
      ? String(row[positionColumn]).trim().toLowerCase() 
      : ''
    
    const key = `${company}|${position}`
    
    if (seenApplications.has(key)) {
      warnings.push({
        row: rowNumber,
        column: 'Duplicate',
        message: `Potential duplicate application: ${company}${position ? ` - ${position}` : ''}`,
        suggestedFix: 'Review for duplicates'
      })
    } else {
      seenApplications.add(key)
    }
  }

  /**
   * Validate date chronology
   */
  private static validateDateChronology(
    row: any,
    mapping: Record<string, string>,
    rowNumber: number,
    warnings: ValidationWarning[]
  ): void {
    const appliedDateColumn = mapping.appliedDate
    const responseDateColumn = mapping.responseDate
    
    if (!appliedDateColumn || !responseDateColumn) return
    if (!row[appliedDateColumn] || !row[responseDateColumn]) return

    const appliedDate = new Date(row[appliedDateColumn])
    const responseDate = new Date(row[responseDateColumn])
    
    if (!isNaN(appliedDate.getTime()) && !isNaN(responseDate.getTime())) {
      if (responseDate < appliedDate) {
        warnings.push({
          row: rowNumber,
          column: 'Date Logic',
          message: 'Response date is before application date',
          suggestedFix: 'Check date accuracy'
        })
      }
    }
  }

  /**
   * Get display column name for field
   */
  private static getDisplayColumnName(field: string): string {
    const displayNames: Record<string, string> = {
      contactEmail: 'Contact Email',
      jobUrl: 'Job URL',
      website: 'Website',
      companyWebsite: 'Company Website'
    }
    return displayNames[field] || field
  }

  /**
   * Generate validation summary
   */
  static generateValidationSummary(
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): {
    canProceed: boolean
    totalIssues: number
    criticalErrors: number
    warnings: number
    summary: string
    recommendations: string[]
  } {
    const criticalErrors = errors.length
    const warningCount = warnings.length
    const totalIssues = criticalErrors + warningCount
    const canProceed = criticalErrors === 0

    let summary: string
    const recommendations: string[] = []

    if (totalIssues === 0) {
      summary = 'Data validation completed successfully. All records are ready for import.'
      recommendations.push('Proceed with import')
    } else if (criticalErrors > 0) {
      summary = `Found ${criticalErrors} critical error${criticalErrors > 1 ? 's' : ''} and ${warningCount} warning${warningCount > 1 ? 's' : ''}. Import cannot proceed until errors are fixed.`
      recommendations.push('Fix critical errors before importing')
      if (warningCount > 0) {
        recommendations.push('Review warnings for data quality improvements')
      }
    } else {
      summary = `Found ${warningCount} warning${warningCount > 1 ? 's' : ''} that have been auto-corrected. Data is ready for import.`
      recommendations.push('Review auto-corrections and proceed with import')
    }

    return {
      canProceed,
      totalIssues,
      criticalErrors,
      warnings: warningCount,
      summary,
      recommendations
    }
  }
}