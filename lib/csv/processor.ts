import Papa from 'papaparse'
import { Application } from '@/types/application'
import { 
  CSVImportConfig, 
  ImportProgress, 
  ImportSummary, 
  ValidationError,
  ValidationWarning 
} from '@/types/csv-import'
import { EncodingDetector } from './encoding-detector'
import { FieldDetector } from './field-detector'
import { CSVDataValidator } from './data-validator'
import { DuplicateDetector, DuplicateGroup, DuplicateResolution } from './duplicate-detector'
import { SmartCSVFixer } from './smart-fixer'

/**
 * Enhanced CSV processor with intelligent parsing and validation
 */
export class CSVProcessor {
  private static readonly BATCH_SIZE = 1000
  private static readonly PROCESSING_DELAY = 50 // ms between batches

  /**
   * Process CSV file with automatic encoding detection and intelligent field mapping
   */
  static async processFile(
    file: File,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{
    data: any[]
    columns: string[]
    detectedMapping: Record<string, string>
    confidence: Record<string, number>
    suggestions: string[]
    encoding: string
  }> {
    // Step 1: Detect encoding
    onProgress?.({
      stage: 'uploading',
      progress: 10,
      message: 'Detecting file encoding...',
      errors: [],
      warnings: []
    })

    const encodingResult = await EncodingDetector.detectEncoding(file)
    
    // Step 2: Read file with detected encoding
    onProgress?.({
      stage: 'parsing',
      progress: 20,
      message: `Reading file with ${encodingResult.encoding.toUpperCase()} encoding...`,
      errors: [],
      warnings: []
    })

    const fileContent = await EncodingDetector.readFileWithEncoding(file, encodingResult.encoding)

    // Step 3: Parse CSV
    onProgress?.({
      stage: 'parsing',
      progress: 40,
      message: 'Parsing CSV data...',
      errors: [],
      warnings: []
    })

    const parseResult = await this.parseCSV(fileContent)
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors)
    }

    // Filter out empty rows
    const filteredData = parseResult.data.filter((row: any) => {
      return Object.values(row).some(value =>
        value !== null && value !== undefined && String(value).trim() !== ''
      )
    })

    if (filteredData.length === 0) {
      throw new Error('No valid data found in CSV file')
    }

    // Step 4: Detect columns and field mappings
    onProgress?.({
      stage: 'validating',
      progress: 60,
      message: 'Analyzing columns and detecting field mappings...',
      errors: [],
      warnings: []
    })

    const columns = Object.keys(filteredData[0] as Record<string, any>)
    const detectionResult = FieldDetector.detectColumns(columns, filteredData.slice(0, 10))

    // Step 5: Process in batches for large files
    if (filteredData.length > this.BATCH_SIZE) {
      onProgress?.({
        stage: 'validating',
        progress: 80,
        message: 'Processing large dataset...',
        errors: [],
        warnings: []
      })

      for (let i = 0; i < filteredData.length; i += this.BATCH_SIZE) {
        const progress = 80 + (i / filteredData.length) * 15
        onProgress?.({
          stage: 'validating',
          progress,
          message: `Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}...`,
          currentRow: i,
          totalRows: filteredData.length,
          errors: [],
          warnings: []
        })

        await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY))
      }
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Processing complete!',
      errors: [],
      warnings: []
    })

    return {
      data: filteredData,
      columns,
      detectedMapping: detectionResult.detectedMapping,
      confidence: detectionResult.confidence,
      suggestions: detectionResult.suggestions,
      encoding: encodingResult.encoding
    }
  }

  /**
   * Parse CSV content with Papa Parse
   */
  private static parseCSV(content: string): Promise<Papa.ParseResult<any>> {
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim(),
        dynamicTyping: false, // Keep everything as strings for better control
        complete: resolve,
        error: reject
      })
    })
  }

  /**
   * Validate CSV data against field mappings with comprehensive validation
   */
  static validateData(
    data: any[], 
    mapping: Record<string, string>,
    existingApplications?: Application[]
  ): { 
    errors: ValidationError[]; 
    warnings: ValidationWarning[]; 
    cleanedData: any[];
    duplicateGroups: DuplicateGroup[];
    validationSummary: any;
    autoFixes?: string[];
  } {
    // Step 1: Pre-process data
    const preprocessedData = SmartCSVFixer.preprocessData(data)
    
    // Step 2: Apply smart fixes
    const { fixedData, fixes } = SmartCSVFixer.autoFixData(preprocessedData, mapping)
    
    // Step 3: Use the enhanced validator on fixed data
    const validationResult = CSVDataValidator.validateDataset(fixedData, mapping)
    
    // Step 4: Detect duplicates
    const duplicateGroups = DuplicateDetector.detectDuplicates(
      validationResult.cleanedData, 
      mapping, 
      existingApplications
    )

    // Step 5: Generate validation summary
    const validationSummary = CSVDataValidator.generateValidationSummary(
      validationResult.errors,
      validationResult.warnings
    )

    return {
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      cleanedData: validationResult.cleanedData,
      duplicateGroups,
      validationSummary,
      autoFixes: fixes
    }
  }

  /**
   * Convert CSV data to Application objects
   */
  static async convertToApplications(
    data: any[],
    mapping: Record<string, string>,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ applications: Application[]; summary: ImportSummary }> {
    const applications: Application[] = []
    const summary: ImportSummary = {
      totalRows: data.length,
      successfulImports: 0,
      skippedRows: 0,
      duplicatesFound: 0,
      issuesResolved: 0,
      suggestions: []
    }

    // Process in batches
    for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
      const endIndex = Math.min(i + this.BATCH_SIZE, data.length)
      const batch = data.slice(i, endIndex)

      onProgress?.({
        stage: 'importing',
        progress: (i / data.length) * 90,
        message: `Converting batch ${Math.floor(i / this.BATCH_SIZE) + 1}...`,
        currentRow: i,
        totalRows: data.length,
        errors: [],
        warnings: []
      })

      const batchApplications = batch.map((row, batchIndex) => {
        const rowData = row as Record<string, any>
        const globalIndex = i + batchIndex

        try {
          const app = this.convertRowToApplication(rowData, mapping, globalIndex)
          summary.successfulImports++
          return app
        } catch (error) {
          console.warn(`Skipping row ${globalIndex + 1}:`, error)
          summary.skippedRows++
          return null
        }
      }).filter((app): app is Application => app !== null)

      applications.push(...batchApplications)

      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, this.PROCESSING_DELAY))
    }

    // Generate summary suggestions
    if (summary.skippedRows > 0) {
      summary.suggestions.push(`${summary.skippedRows} rows were skipped due to missing required data`)
    }
    if (summary.successfulImports > 0) {
      summary.suggestions.push(`Successfully imported ${summary.successfulImports} applications`)
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Import complete!',
      errors: [],
      warnings: []
    })

    return { applications, summary }
  }

  /**
   * Convert a single CSV row to Application object
   */
  private static convertRowToApplication(
    rowData: Record<string, any>,
    mapping: Record<string, string>,
    index: number
  ): Application {
    // Helper function to get mapped field value
    const getMappedField = (fieldKey: string): string => {
      const csvColumn = mapping[fieldKey]
      if (!csvColumn) return ''
      const value = rowData[csvColumn]
      return value !== null && value !== undefined ? String(value).trim() : ''
    }

    // Helper functions for data transformation
    const parseDate = (dateString: string): string | null => {
      if (!dateString) return null
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]!
    }

    const parseArray = (arrayString: string): string[] => {
      if (!arrayString) return []
      return arrayString.split(/[;,|]/).map(item => item.trim()).filter(item => item.length > 0)
    }

    const parseNumber = (numberString: string): number | undefined => {
      if (!numberString) return undefined
      const num = parseFloat(numberString)
      return isNaN(num) ? undefined : Math.max(0, Math.min(100, num))
    }

    const normalizeStatus = (status: string): Application['status'] => {
      const statusLower = status.toLowerCase()
      
      // English status mappings
      if (statusLower.includes('applied')) return 'Applied'
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
      if (statusLower.includes('cevap bekleniyor') || statusLower.includes('beklemede')) return 'Pending'
      if (statusLower.includes('başvuru planlanıyor') || statusLower.includes('planlanan')) return 'Pending'
      
      return 'Pending'
    }

    const normalizeJobType = (type: string): Application['type'] => {
      const typeLower = type.toLowerCase()
      if (typeLower.includes('part')) return 'Part-time'
      if (typeLower.includes('intern')) return 'Internship'
      if (typeLower.includes('contract')) return 'Contract'
      if (typeLower.includes('freelance')) return 'Freelance'
      return 'Full-time'
    }

    const normalizePriority = (priority: string): Application['priority'] => {
      const priorityLower = priority.toLowerCase()
      if (priorityLower.includes('high')) return 'High'
      if (priorityLower.includes('low')) return 'Low'
      return 'Medium'
    }

    // Validate required fields
    const company = getMappedField('company')
    if (!company) {
      throw new Error('Company field is required')
    }

    // Generate default position based on sector/tags if not provided
    const position = getMappedField('position') || this.generateDefaultPosition(getMappedField('tags') || getMappedField('sektör') || '')

    // Create Application object
    const app: Application = {
      id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`,
      company,
      position,
      location: getMappedField('location'),
      type: normalizeJobType(getMappedField('type') || 'Full-time'),
      salary: getMappedField('salary'),
      status: normalizeStatus(getMappedField('status') || 'Pending'),
      appliedDate: parseDate(getMappedField('appliedDate')) ?? new Date().toISOString().split('T')[0]!,
      responseDate: parseDate(getMappedField('responseDate')),
      interviewDate: parseDate(getMappedField('interviewDate')),
      notes: getMappedField('notes'),
      contactPerson: getMappedField('contactPerson'),
      contactEmail: getMappedField('contactEmail'),
      website: getMappedField('website'),
      tags: parseArray(getMappedField('tags')),
      priority: normalizePriority(getMappedField('priority') || 'Medium'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Enhanced fields
      jobDescription: getMappedField('jobDescription'),
      requirements: parseArray(getMappedField('requirements')),
      aiMatchScore: parseNumber(getMappedField('aiMatchScore')),
      followUpDate: parseDate(getMappedField('followUpDate')) || undefined,
      offerDate: parseDate(getMappedField('offerDate')),
      rejectionDate: parseDate(getMappedField('rejectionDate')),
      jobUrl: getMappedField('jobUrl'),
      companyWebsite: getMappedField('companyWebsite'),
      contactPhone: getMappedField('contactPhone')
    }

    return app
  }

  /**
   * Apply duplicate resolutions to dataset
   */
  static applyDuplicateResolutions(
    data: any[],
    resolutions: DuplicateResolution[]
  ): { processedData: any[]; summary: { merged: number; skipped: number; updated: number } } {
    return DuplicateDetector.applyResolutions(data, resolutions)
  }

  /**
   * Generate merge preview for duplicate applications
   */
  static generateMergePreview(
    applications: Array<{ index: number; data: any; isExisting?: boolean }>,
    mapping: Record<string, string>
  ): any {
    return DuplicateDetector.generateMergePreview(applications, mapping)
  }

  /**
   * Enhanced import with validation and duplicate handling
   */
  static async importWithValidation(
    data: any[],
    mapping: Record<string, string>,
    options: {
      existingApplications?: Application[]
      duplicateResolutions?: DuplicateResolution[]
      skipValidation?: boolean
    } = {},
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{
    applications: Application[]
    summary: ImportSummary & {
      validationSummary: any
      duplicateSummary: any
    }
    errors: ValidationError[]
    warnings: ValidationWarning[]
  }> {
    const { existingApplications, duplicateResolutions, skipValidation } = options

    // Step 1: Validate data if not skipped
    let validationResult
    if (!skipValidation) {
      onProgress?.({
        stage: 'validating',
        progress: 10,
        message: 'Validating data and detecting duplicates...',
        errors: [],
        warnings: []
      })

      validationResult = this.validateData(data, mapping, existingApplications)
      
      if (validationResult.errors.length > 0) {
        throw new Error(`Validation failed with ${validationResult.errors.length} critical errors`)
      }
    } else {
      validationResult = {
        errors: [],
        warnings: [],
        cleanedData: data,
        duplicateGroups: [],
        validationSummary: { canProceed: true, totalIssues: 0 }
      }
    }

    // Step 2: Apply duplicate resolutions if provided
    let processedData = validationResult.cleanedData
    let duplicateResolutionSummary = { merged: 0, skipped: 0, updated: 0 }

    if (duplicateResolutions && duplicateResolutions.length > 0) {
      onProgress?.({
        stage: 'validating',
        progress: 30,
        message: 'Applying duplicate resolutions...',
        errors: [],
        warnings: []
      })

      const resolutionResult = this.applyDuplicateResolutions(processedData, duplicateResolutions)
      processedData = resolutionResult.processedData
      duplicateResolutionSummary = resolutionResult.summary
    }

    // Step 3: Convert to applications
    onProgress?.({
      stage: 'importing',
      progress: 50,
      message: 'Converting data to applications...',
      errors: [],
      warnings: []
    })

    const conversionResult = await this.convertToApplications(
      processedData,
      mapping,
      onProgress
    )

    // Generate comprehensive summary
    const duplicateSummary = DuplicateDetector.generateSummary(validationResult.duplicateGroups)
    
    const enhancedSummary = {
      ...conversionResult.summary,
      validationSummary: validationResult.validationSummary,
      duplicateSummary: {
        ...duplicateSummary,
        resolutionsApplied: duplicateResolutionSummary
      }
    }

    return {
      applications: conversionResult.applications,
      summary: enhancedSummary,
      errors: validationResult.errors,
      warnings: validationResult.warnings
    }
  }

  /**
   * Generate default position based on sector/tags
   */
  private static generateDefaultPosition(sectorOrTags: string): string {
    const sector = sectorOrTags.toLowerCase()
    
    // Technology sectors
    if (sector.includes('technology') || sector.includes('tech') || sector.includes('software')) {
      return 'Software Developer Intern'
    }
    if (sector.includes('fintech') || sector.includes('finance')) {
      return 'Finance Intern'
    }
    if (sector.includes('music') || sector.includes('media')) {
      return 'Media Intern'
    }
    if (sector.includes('telecommunications') || sector.includes('telecom')) {
      return 'Engineering Intern'
    }
    if (sector.includes('automotive') || sector.includes('engineering')) {
      return 'Engineering Intern'
    }
    if (sector.includes('retail') || sector.includes('design')) {
      return 'Design Intern'
    }
    if (sector.includes('gaming') || sector.includes('game')) {
      return 'Game Developer Intern'
    }
    if (sector.includes('energy') || sector.includes('renewable')) {
      return 'Energy Intern'
    }
    if (sector.includes('maritime') || sector.includes('logistics')) {
      return 'Logistics Intern'
    }
    if (sector.includes('pharmaceuticals') || sector.includes('medical')) {
      return 'Medical Intern'
    }
    if (sector.includes('cybersecurity') || sector.includes('security')) {
      return 'Security Intern'
    }
    
    // Default fallback
    return 'Intern'
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Generate CSV templates for different platforms (deprecated - use CSVTemplateSystem)
   * @deprecated Use CSVTemplateSystem.generateTemplateCSV() instead
   */
  static generateTemplate(platform: 'linkedin' | 'indeed' | 'glassdoor' | 'custom' = 'custom'): string {
    console.warn('CSVProcessor.generateTemplate is deprecated. Use CSVTemplateSystem.generateTemplateCSV() instead.')
    
    try {
      const { CSVTemplateSystem } = require('./templates')
      return CSVTemplateSystem.generateTemplateCSV(platform, true)
    } catch (error) {
      // Fallback to legacy templates if new system fails
      const templates = {
        linkedin: [
          'Company,Position,Location,Applied Date,Status,Notes',
          'Google,Software Engineer,Mountain View CA,2024-01-15,Applied,Applied via LinkedIn',
          'Microsoft,Product Manager,Seattle WA,2024-01-20,Interviewing,Phone screen completed'
        ],
        indeed: [
          'Company Name,Job Title,Location,Date Applied,Application Status,Salary,Job Type',
          'Apple,iOS Developer,Cupertino CA,2024-01-15,Applied,$120000,Full-time',
          'Netflix,Data Scientist,Los Gatos CA,2024-01-20,Pending,$140000,Full-time'
        ],
        glassdoor: [
          'Employer,Job Title,Location,Date Applied,Status,Salary Estimate,Company Rating',
          'Tesla,Software Engineer,Palo Alto CA,2024-01-15,Applied,$110000-130000,4.2',
          'Spotify,Backend Engineer,Stockholm Sweden,2024-01-20,Interviewing,45000 SEK/month,4.5'
        ],
        custom: [
          'Company,Position,Location,Type,Salary,Status,Applied Date,Response Date,Interview Date,Notes,Contact Person,Contact Email,Website,Tags,Priority',
          'Spotify,Software Engineer Intern,Stockholm Sweden,Internship,15000 SEK/month,Applied,2024-01-15,,,Applied through LinkedIn,Sarah Johnson,careers@spotify.com,https://spotify.com/careers,"Backend; Music; Sweden",High',
          'Klarna,Data Scientist,Stockholm Sweden,Full-time,45000 SEK/month,Pending,2024-01-20,,,Waiting for response,Marcus Andersson,careers@klarna.com,https://klarna.com/careers,"Data Science; Fintech; Sweden",Medium'
        ]
      }

      return templates[platform].join('\n')
    }
  }
}