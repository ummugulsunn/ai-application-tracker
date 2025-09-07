export interface CSVImportConfig {
  delimiter: ',' | ';' | '\t' | '|'
  encoding: 'utf-8' | 'iso-8859-1' | 'windows-1252' | 'windows-1254' | 'iso-8859-9'
  hasHeader: boolean
  skipEmptyLines: boolean
  trimWhitespace: boolean
}

export interface FieldMapping {
  csvColumn: string
  applicationField: keyof import('./application').Application
  confidence: number // 0-1, how confident the auto-detection is
  required: boolean
  validator?: (value: string) => boolean
  transformer?: (value: string) => any
}

export interface CSVTemplate {
  id: string
  name: string
  description: string
  source: 'linkedin' | 'indeed' | 'glassdoor' | 'custom'
  fieldMappings: FieldMapping[]
  sampleData: string[][]
  downloadUrl?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: string[]
  cleanedValue?: any
}

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
  suggestedFix?: string
}

export interface ValidationWarning {
  row: number
  column: string
  message: string
  suggestedFix?: string
}

export interface ImportProgress {
  stage: 'uploading' | 'parsing' | 'validating' | 'importing' | 'complete'
  progress: number // 0-100
  currentRow?: number
  totalRows?: number
  message: string
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ImportSummary {
  totalRows: number
  successfulImports: number
  skippedRows: number
  duplicatesFound: number
  issuesResolved: number
  suggestions: string[]
}

export interface EncodingDetectionResult {
  encoding: 'utf-8' | 'iso-8859-1' | 'windows-1252' | 'windows-1254' | 'iso-8859-9'
  confidence: number
  sample: string
}

export interface ColumnDetectionResult {
  detectedMapping: Record<string, string>
  confidence: Record<string, number>
  suggestions: string[]
}