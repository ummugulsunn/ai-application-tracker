'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  HydrationSafeMotion, 
  HydrationSafeAnimatePresence, 
  HydrationSafeSpinner,
  HydrationSafeProgressBar,
  hydrationSafeVariants 
} from '@/lib/utils/hydrationSafeAnimation'
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  InformationCircleIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { Application } from '@/types/application'
import { ImportProgress, ImportSummary, ValidationError, ValidationWarning } from '@/types/csv-import'
import { CSVProcessor } from '@/lib/csv/processor'
import { DuplicateGroup, DuplicateResolution } from '@/lib/csv/duplicate-detector'
import DragDropFieldMapping from '@/components/csv/DragDropFieldMapping'
import ImportPreview from '@/components/csv/ImportPreview'
import ValidationReport from '@/components/csv/ValidationReport'
import DuplicateResolutionModal from '@/components/csv/DuplicateResolutionModal'
import TemplateGallery from '@/components/csv/TemplateGallery'
import { toast } from 'react-hot-toast'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportSuccess: (applications: Application[]) => void
  existingApplications?: Application[]
}

export default function ImportModal({ isOpen, onClose, onImportSuccess, existingApplications }: ImportModalProps) {
  // File upload state
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [canCancel, setCanCancel] = useState(true)
  
  // Data state
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvColumns, setCsvColumns] = useState<string[]>([])
  const [detectedMapping, setDetectedMapping] = useState<Record<string, string>>({})
  const [currentMapping, setCurrentMapping] = useState<Record<string, string>>({})
  const [confidence, setConfidence] = useState<Record<string, number>>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [detectedEncoding, setDetectedEncoding] = useState<string>('')
  
  // UI state
  const [showFieldMapping, setShowFieldMapping] = useState(false)
  const [showAdvancedMapping, setShowAdvancedMapping] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([])
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [validationSummary, setValidationSummary] = useState<any>(null)
  const [showValidationReport, setShowValidationReport] = useState(false)
  const [showImportPreview, setShowImportPreview] = useState(false)
  const [showDuplicateResolution, setShowDuplicateResolution] = useState(false)
  const [duplicateResolutions, setDuplicateResolutions] = useState<DuplicateResolution[]>([])
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset all state
  const resetState = useCallback(() => {
    setSelectedFile(null)
    setIsProcessing(false)
    setProgress(null)
    setCsvData([])
    setCsvColumns([])
    setDetectedMapping({})
    setCurrentMapping({})
    setConfidence({})
    setSuggestions([])
    setDetectedEncoding('')
    setShowFieldMapping(false)
    setShowAdvancedMapping(false)
    setValidationErrors([])
    setValidationWarnings([])
    setDuplicateGroups([])
    setValidationSummary(null)
    setShowValidationReport(false)
    setShowImportPreview(false)
    setShowDuplicateResolution(false)
    setDuplicateResolutions([])
    setImportSummary(null)
    setCanCancel(true)
  }, [])

  // Handle file processing
  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    // Check file size (warn if > 10MB)
    if (file.size > 10 * 1024 * 1024) {
      const proceed = window.confirm(
        'This file is larger than 10MB. Processing may take a while. Continue?'
      )
      if (!proceed) return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setCanCancel(true)
    
    // Create abort controller
    abortControllerRef.current = new AbortController()

    try {
      const result = await CSVProcessor.processFile(file, (progressUpdate) => {
        setProgress(progressUpdate)
      })

      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      // Set processed data
      setCsvData(result.data)
      setCsvColumns(result.columns)
      setDetectedMapping(result.detectedMapping)
      setCurrentMapping(result.detectedMapping)
      setConfidence(result.confidence)
      setSuggestions(result.suggestions)
      setDetectedEncoding(result.encoding)

      // Check if we can auto-import or need manual mapping
      const hasRequiredFields = result.detectedMapping.company && result.confidence.company && result.confidence.company > 0.6
      const highConfidenceFields = Object.values(result.confidence).filter(conf => conf > 0.8).length
      const totalDetectedFields = Object.keys(result.detectedMapping).length
      const overallConfidence = totalDetectedFields > 0 ? highConfidenceFields / totalDetectedFields : 0

      if (hasRequiredFields && overallConfidence >= 0.6) {
        // High confidence - proceed to validation
        await validateAndImport(result.data, result.detectedMapping)
      } else {
        // Show field mapping interface
        setShowFieldMapping(true)
        toast.success(
          `Parsed ${result.data.length.toLocaleString()} rows. Please review the column mapping.`
        )
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast('File processing was cancelled')
      } else {
        toast.error(`Error processing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
        console.error('CSV processing error:', error)
      }
    } finally {
      setIsProcessing(false)
      setCanCancel(false)
    }
  }, [])

  // Validate data and import if no critical errors
  const validateAndImport = useCallback(async (data: any[], mapping: Record<string, string>) => {
    setProgress({
      stage: 'validating',
      progress: 0,
      message: 'Validating data and detecting duplicates...',
      errors: [],
      warnings: []
    })

    // Enhanced validation with duplicate detection
    const validation = CSVProcessor.validateData(data, mapping, existingApplications)
    setValidationErrors(validation.errors)
    setValidationWarnings(validation.warnings)
    setDuplicateGroups(validation.duplicateGroups)
    setValidationSummary(validation.validationSummary)

    setProgress(null)

    if (validation.errors.length > 0) {
      setShowValidationReport(true)
      return
    }

    // Show import preview with validation results
    setShowImportPreview(true)

    // If duplicates found, show resolution modal
    if (validation.duplicateGroups.length > 0) {
      setShowDuplicateResolution(true)
    }
  }, [existingApplications])

  // Perform the actual import with enhanced validation
  const performImport = useCallback(async (data: any[], mapping: Record<string, string>) => {
    try {
      setCanCancel(false)
      setShowImportPreview(false)
      
      const result = await CSVProcessor.importWithValidation(
        data,
        mapping,
        {
          existingApplications,
          duplicateResolutions,
          skipValidation: true // Already validated
        },
        (progressUpdate) => {
          setProgress(progressUpdate)
        }
      )

      setImportSummary(result.summary)
      
      // Success
      onImportSuccess(result.applications)
      toast.success(`Successfully imported ${result.applications.length.toLocaleString()} applications!`)
      
      // Reset and close after a short delay
      setTimeout(() => {
        resetState()
        onClose()
      }, 2000)

    } catch (error) {
      toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setProgress(null)
    }
  }, [onImportSuccess, onClose, resetState, existingApplications, duplicateResolutions])

  // Handle manual import after field mapping
  const handleManualImport = useCallback(async () => {
    if (!currentMapping.company) {
      toast.error('Please map the Company field - it is required')
      return
    }

    await validateAndImport(csvData, currentMapping)
  }, [csvData, currentMapping, validateAndImport])

  // Handle duplicate resolutions
  const handleDuplicateResolutions = useCallback((resolutions: DuplicateResolution[]) => {
    setDuplicateResolutions(resolutions)
    setShowDuplicateResolution(false)
    
    // Proceed with import if no critical errors
    if (validationErrors.length === 0) {
      performImport(csvData, currentMapping)
    }
  }, [validationErrors, csvData, currentMapping, performImport])

  // Handle proceeding from validation report
  const handleProceedFromValidation = useCallback(() => {
    setShowValidationReport(false)
    
    if (duplicateGroups.length > 0) {
      setShowDuplicateResolution(true)
    } else {
      performImport(csvData, currentMapping)
    }
  }, [duplicateGroups, csvData, currentMapping, performImport])

  // Handle proceeding from import preview
  const handleProceedFromPreview = useCallback(() => {
    if (duplicateGroups.length > 0) {
      setShowDuplicateResolution(true)
    } else {
      performImport(csvData, currentMapping)
    }
  }, [duplicateGroups, csvData, currentMapping, performImport])

  // Cancel processing
  const handleCancelProcessing = useCallback(() => {
    if (abortControllerRef.current && canCancel) {
      abortControllerRef.current.abort()
      setIsProcessing(false)
      setProgress(null)
      toast('Processing cancelled')
    }
  }, [canCancel])

  // File drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0]) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      processFile(files[0])
    }
  }



  // Close handler
  const handleClose = useCallback(() => {
    if (isProcessing && canCancel) {
      const shouldClose = window.confirm('Import is in progress. Are you sure you want to cancel?')
      if (!shouldClose) return
      handleCancelProcessing()
    }
    resetState()
    onClose()
  }, [isProcessing, canCancel, handleCancelProcessing, resetState, onClose])

  return (
    <>
    <HydrationSafeAnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <HydrationSafeMotion
              className="fixed inset-0 bg-black bg-opacity-25"
              {...hydrationSafeVariants.fadeIn}
              onClick={handleClose}
            />

            {/* Modal */}
            <HydrationSafeMotion
              className="relative w-full max-w-6xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden"
              {...hydrationSafeVariants.scaleIn}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Import Applications</h2>
                  {detectedEncoding && (
                    <p className="text-sm text-gray-600 mt-1">
                      Detected encoding: {detectedEncoding.toUpperCase()}
                      {selectedFile && ` • File: ${selectedFile.name}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                {!selectedFile && !showFieldMapping && (
                  <div className="p-6">
                    {/* Instructions */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">How to import:</h3>
                      <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                        <li>Drag & drop or select your CSV file</li>
                        <li>Our AI automatically detects encoding and maps columns</li>
                        <li>Review the mapping (adjust if needed)</li>
                        <li>Import your applications</li>
                      </ol>
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          <strong>Smart Detection:</strong> Supports UTF-8, ISO-8859-1, and Windows-1252 encoding.
                          Recognizes columns in multiple languages. Only Company field is required!
                        </p>
                      </div>
                    </div>

                    {/* Template Gallery */}
                    <div className="mb-6">
                      <TemplateGallery
                        onTemplateDownload={(templateId) => {
                          // Template download is handled by the gallery component
                          console.log(`Downloaded template: ${templateId}`)
                        }}
                        showPreview={true}
                      />
                    </div>

                    {/* File Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragging
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">
                          {isDragging ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                        </p>
                        <p className="mt-1">or</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn-primary mt-2"
                        >
                          Browse Files
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Processing State */}
                {isProcessing && progress && (
                  <div className="p-6">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center space-x-3 text-primary-600">
                        <HydrationSafeSpinner className="w-6 h-6" color="text-primary-600" />
                        <span className="font-medium">{progress.message}</span>
                      </div>

                      {/* Progress Bar */}
                      <HydrationSafeProgressBar 
                        progress={progress.progress}
                        className="w-full bg-gray-200 rounded-full h-3"
                        barClassName="bg-primary-600 h-3 rounded-full"
                      />
                      
                      <div className="text-sm text-gray-600">
                        <p>{Math.round(progress.progress)}% complete</p>
                        {progress.currentRow && progress.totalRows && (
                          <p>Processing row {progress.currentRow.toLocaleString()} of {progress.totalRows.toLocaleString()}</p>
                        )}
                      </div>

                      {/* Cancel Button */}
                      {canCancel && (
                        <button
                          onClick={handleCancelProcessing}
                          className="btn-secondary text-sm px-4 py-2"
                        >
                          Cancel Processing
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Field Mapping Interface */}
                {showFieldMapping && !isProcessing && (
                  <div className="p-6">
                    <DragDropFieldMapping
                      csvColumns={csvColumns}
                      currentMapping={currentMapping}
                      confidence={confidence}
                      onMappingChange={setCurrentMapping}
                    />

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800 mb-2">Suggestions</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                              {suggestions.map((suggestion, index) => (
                                <li key={index}>• {suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Report */}
                {showValidationReport && validationSummary && (
                  <div className="p-6">
                    <ValidationReport
                      totalRows={csvData.length}
                      errors={validationErrors}
                      warnings={validationWarnings}
                      duplicateGroups={duplicateGroups}
                      validationSummary={validationSummary}
                      onProceed={handleProceedFromValidation}
                      onShowDetails={() => setShowImportPreview(true)}
                    />
                  </div>
                )}

                {/* Import Preview */}
                {showImportPreview && (
                  <div className="p-6">
                    <ImportPreview
                      data={csvData}
                      mapping={currentMapping}
                      errors={validationErrors}
                      warnings={validationWarnings}
                      duplicateGroups={duplicateGroups}
                    />
                  </div>
                )}

                {/* Import Summary */}
                {importSummary && (
                  <div className="p-6">
                    <div className="text-center space-y-4">
                      <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Import Complete!</h3>
                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                          <p>Successfully imported {importSummary.successfulImports.toLocaleString()} applications</p>
                          {importSummary.skippedRows > 0 && (
                            <p>Skipped {importSummary.skippedRows} rows due to errors</p>
                          )}
                          {importSummary.duplicatesFound > 0 && (
                            <p>Found {importSummary.duplicatesFound} potential duplicates</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Data */}
                {csvData.length > 0 && !showFieldMapping && !isProcessing && !importSummary && (
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Preview ({csvData.length} rows)
                    </h3>
                    <div className="max-h-40 overflow-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {csvColumns.map((header) => (
                              <th
                                key={header}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvData.slice(0, 5).map((row, index) => (
                            <tr key={index}>
                              {csvColumns.map((column) => (
                                <td
                                  key={column}
                                  className="px-3 py-2 text-xs text-gray-900 max-w-xs truncate"
                                  title={String(row[column] || '')}
                                >
                                  {String(row[column] || '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 5 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing first 5 rows of {csvData.length} total
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  {showFieldMapping && (
                    <button
                      onClick={() => setShowAdvancedMapping(!showAdvancedMapping)}
                      className="btn-secondary text-sm flex items-center space-x-2"
                    >
                      <CogIcon className="w-4 h-4" />
                      <span>{showAdvancedMapping ? 'Simple' : 'Advanced'} Mapping</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleClose}
                    className="btn-secondary"
                    disabled={isProcessing && canCancel}
                  >
                    {isProcessing ? 'Cancel' : 'Close'}
                  </button>
                  
                  {showFieldMapping && !isProcessing && (
                    <button
                      onClick={handleManualImport}
                      disabled={!currentMapping.company}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>Import {csvData.length > 0 ? `(${csvData.length})` : ''}</span>
                    </button>
                  )}
                  
                  {showImportPreview && validationErrors.length === 0 && (
                    <button
                      onClick={handleProceedFromPreview}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <PlayIcon className="w-4 h-4" />
                      <span>
                        {duplicateGroups.length > 0 ? 'Resolve Duplicates' : 'Import Applications'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </HydrationSafeMotion>
          </div>
        </div>
      )}
    </HydrationSafeAnimatePresence>

    {/* Duplicate Resolution Modal */}
    <DuplicateResolutionModal
      isOpen={showDuplicateResolution}
      onClose={() => setShowDuplicateResolution(false)}
      duplicateGroups={duplicateGroups}
      mapping={currentMapping}
      onResolutionsComplete={handleDuplicateResolutions}
    />
    </>
  )
}