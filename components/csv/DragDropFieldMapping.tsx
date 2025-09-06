'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  ArrowsRightLeftIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Application } from '@/types/application'

interface DragDropFieldMappingProps {
  csvColumns: string[]
  currentMapping: Record<string, string>
  confidence: Record<string, number>
  onMappingChange: (mapping: Record<string, string>) => void
  onClose?: () => void
}

interface FieldConfig {
  key: string
  label: string
  required: boolean
  description: string
  examples: string[]
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    key: 'company',
    label: 'Company',
    required: true,
    description: 'Company or organization name',
    examples: ['Google', 'Microsoft', 'Spotify']
  },
  {
    key: 'position',
    label: 'Position',
    required: false,
    description: 'Job title or role',
    examples: ['Software Engineer', 'Data Scientist', 'Product Manager']
  },
  {
    key: 'location',
    label: 'Location',
    required: false,
    description: 'Job location or office',
    examples: ['Stockholm, Sweden', 'Remote', 'London, UK']
  },
  {
    key: 'type',
    label: 'Job Type',
    required: false,
    description: 'Employment type',
    examples: ['Full-time', 'Part-time', 'Internship', 'Contract']
  },
  {
    key: 'salary',
    label: 'Salary',
    required: false,
    description: 'Compensation or salary range',
    examples: ['$80,000', '45000 SEK/month', '£50k-60k']
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    description: 'Application status',
    examples: ['Applied', 'Pending', 'Interviewing', 'Rejected']
  },
  {
    key: 'appliedDate',
    label: 'Applied Date',
    required: false,
    description: 'Date when application was submitted',
    examples: ['2024-01-15', '15/01/2024', 'Jan 15, 2024']
  },
  {
    key: 'responseDate',
    label: 'Response Date',
    required: false,
    description: 'Date of response from company',
    examples: ['2024-01-20', '20/01/2024', 'Jan 20, 2024']
  },
  {
    key: 'interviewDate',
    label: 'Interview Date',
    required: false,
    description: 'Scheduled interview date',
    examples: ['2024-01-25', '25/01/2024', 'Jan 25, 2024']
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    description: 'Additional notes or comments',
    examples: ['Applied via LinkedIn', 'Referral from John', 'Follow up needed']
  },
  {
    key: 'contactPerson',
    label: 'Contact Person',
    required: false,
    description: 'Recruiter or hiring manager name',
    examples: ['Sarah Johnson', 'HR Team', 'Marcus Andersson']
  },
  {
    key: 'contactEmail',
    label: 'Contact Email',
    required: false,
    description: 'Contact email address',
    examples: ['careers@company.com', 'sarah@company.com', 'hr@company.com']
  },
  {
    key: 'website',
    label: 'Website',
    required: false,
    description: 'Company website or job posting URL',
    examples: ['https://company.com', 'www.company.com/careers', 'jobs.company.com']
  },
  {
    key: 'tags',
    label: 'Tags',
    required: false,
    description: 'Skills, technologies, or categories',
    examples: ['React, Node.js', 'Data Science, Python', 'Remote, Startup']
  },
  {
    key: 'priority',
    label: 'Priority',
    required: false,
    description: 'Application priority level',
    examples: ['High', 'Medium', 'Low']
  }
]

export default function DragDropFieldMapping({
  csvColumns,
  currentMapping,
  confidence,
  onMappingChange,
  onClose
}: DragDropFieldMappingProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [draggedOverField, setDraggedOverField] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  // Get unmapped CSV columns
  const mappedColumns = new Set(Object.values(currentMapping))
  const unmappedColumns = csvColumns.filter(col => !mappedColumns.has(col))

  const handleDragStart = useCallback((column: string) => {
    setDraggedColumn(column)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null)
    setDraggedOverField(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, fieldKey: string) => {
    e.preventDefault()
    setDraggedOverField(fieldKey)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDraggedOverField(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, fieldKey: string) => {
    e.preventDefault()
    
    if (draggedColumn) {
      // Remove the column from any existing mapping
      const newMapping = { ...currentMapping }
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === draggedColumn) {
          delete newMapping[key]
        }
      })
      
      // Add new mapping
      newMapping[fieldKey] = draggedColumn
      onMappingChange(newMapping)
    }
    
    setDraggedColumn(null)
    setDraggedOverField(null)
  }, [draggedColumn, currentMapping, onMappingChange])

  const handleRemoveMapping = useCallback((fieldKey: string) => {
    const newMapping = { ...currentMapping }
    delete newMapping[fieldKey]
    onMappingChange(newMapping)
  }, [currentMapping, onMappingChange])

  const handleDirectMapping = useCallback((fieldKey: string, csvColumn: string) => {
    // Remove the column from any existing mapping
    const newMapping = { ...currentMapping }
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === csvColumn) {
        delete newMapping[key]
      }
    })
    
    // Add new mapping
    if (csvColumn) {
      newMapping[fieldKey] = csvColumn
    }
    
    onMappingChange(newMapping)
  }, [currentMapping, onMappingChange])

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (conf >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 0.8) return <CheckCircleIcon className="w-4 h-4" />
    if (conf >= 0.6) return <ExclamationTriangleIcon className="w-4 h-4" />
    return <XMarkIcon className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Map Your CSV Columns</h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag CSV columns to the corresponding fields, or use the dropdown menus
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to map fields:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Drag & Drop:</strong> Drag CSV columns from the right panel to field boxes</li>
              <li>• <strong>Dropdown:</strong> Use the dropdown menu in each field box</li>
              <li>• <strong>Auto-detected:</strong> Green fields were automatically detected with high confidence</li>
              <li>• <strong>Required:</strong> Only "Company" field is required for import</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Mapping Area */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Application Fields</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELD_CONFIGS.map((field) => {
              const mappedColumn = currentMapping[field.key]
              const conf = confidence[field.key] || 0
              const isAutoDetected = conf > 0.5
              const isDraggedOver = draggedOverField === field.key

              return (
                <motion.div
                  key={field.key}
                  className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                    isDraggedOver
                      ? 'border-primary-400 bg-primary-50'
                      : mappedColumn
                      ? isAutoDetected
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                      : field.required
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onDragOver={(e) => handleDragOver(e, field.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, field.key)}
                  whileHover={{ scale: 1.02 }}
                  animate={{ scale: isDraggedOver ? 1.05 : 1 }}
                >
                  {/* Field Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        field.required ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      
                      {/* Confidence indicator */}
                      {mappedColumn && isAutoDetected && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(conf)}`}>
                          {getConfidenceIcon(conf)}
                          <span>{Math.round(conf * 100)}%</span>
                        </div>
                      )}
                    </div>

                    {/* Info tooltip */}
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowTooltip(field.key)}
                        onMouseLeave={() => setShowTooltip(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <InformationCircleIcon className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {showTooltip === field.key && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-6 z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg"
                          >
                            <p className="font-medium mb-1">{field.description}</p>
                            <p className="text-gray-300">Examples: {field.examples.join(', ')}</p>
                            <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Mapped Column Display */}
                  {mappedColumn ? (
                    <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded">
                      <span className="text-sm text-gray-900 font-medium">{mappedColumn}</span>
                      <button
                        onClick={() => handleRemoveMapping(field.key)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <ArrowsRightLeftIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">
                        {isDraggedOver ? 'Drop here' : 'Drag column here or select below'}
                      </p>
                    </div>
                  )}

                  {/* Dropdown Selection */}
                  <select
                    value={mappedColumn || ''}
                    onChange={(e) => handleDirectMapping(field.key, e.target.value)}
                    className="w-full mt-2 text-xs border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">-- Select Column --</option>
                    {csvColumns.map(column => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* CSV Columns Panel */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            CSV Columns ({csvColumns.length})
          </h4>
          
          {/* Unmapped Columns */}
          {unmappedColumns.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                Unmapped ({unmappedColumns.length})
              </h5>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unmappedColumns.map((column) => (
                  <motion.div
                    key={column}
                    draggable
                    onDragStart={() => handleDragStart(column)}
                    onDragEnd={handleDragEnd}
                    className={`p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all ${
                      draggedColumn === column ? 'opacity-50 scale-95' : ''
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileDrag={{ scale: 1.05, rotate: 2 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{column}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Mapped Columns */}
          {mappedColumns.size > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Mapped ({mappedColumns.size})
              </h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Array.from(mappedColumns).map((column) => (
                  <div
                    key={column}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>{column}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mapping Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h5 className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
              Mapping Summary
            </h5>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Total columns:</span>
                <span className="font-medium">{csvColumns.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Mapped:</span>
                <span className="font-medium text-green-600">{mappedColumns.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Unmapped:</span>
                <span className="font-medium text-gray-600">{unmappedColumns.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Required mapped:</span>
                <span className={`font-medium ${currentMapping.company ? 'text-green-600' : 'text-red-600'}`}>
                  {currentMapping.company ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}