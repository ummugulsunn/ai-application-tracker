'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { ValidationError, ValidationWarning } from '@/types/csv-import'
import { DuplicateGroup } from '@/lib/csv/duplicate-detector'

interface ImportPreviewProps {
  data: any[]
  mapping: Record<string, string>
  errors: ValidationError[]
  warnings: ValidationWarning[]
  duplicateGroups: DuplicateGroup[]
  onFixIssue?: (rowIndex: number, field: string, newValue: string) => void
  onResolveDuplicate?: (groupId: string, resolution: 'merge' | 'skip' | 'keep_all') => void
}

export default function ImportPreview({
  data,
  mapping,
  errors,
  warnings,
  duplicateGroups,
  onFixIssue,
  onResolveDuplicate
}: ImportPreviewProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'preview' | 'errors' | 'warnings' | 'duplicates'>('preview')
  const [previewRows, setPreviewRows] = useState(10)

  const totalIssues = errors.length + warnings.length + duplicateGroups.length
  const canProceed = errors.length === 0

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {data.length.toLocaleString()} rows ready to import
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              {showDetails ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            {canProceed ? (
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {canProceed ? 'Ready to Import' : 'Issues Found'}
              </p>
              <p className="text-xs text-gray-600">
                {canProceed ? 'All validations passed' : `${errors.length} critical errors`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-red-600">{errors.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Errors</p>
              <p className="text-xs text-gray-600">Must be fixed</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-yellow-600">{warnings.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Warnings</p>
              <p className="text-xs text-gray-600">Auto-corrected</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">{duplicateGroups.length}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Duplicates</p>
              <p className="text-xs text-gray-600">Need review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {showDetails && (
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'preview', label: 'Data Preview', count: data.length },
                { key: 'errors', label: 'Errors', count: errors.length },
                { key: 'warnings', label: 'Warnings', count: warnings.length },
                { key: 'duplicates', label: 'Duplicates', count: duplicateGroups.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      selectedTab === tab.key
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {selectedTab === 'preview' && (
              <PreviewTab 
                data={data} 
                mapping={mapping} 
                previewRows={previewRows}
                onPreviewRowsChange={setPreviewRows}
              />
            )}
            {selectedTab === 'errors' && (
              <ErrorsTab errors={errors} onFixIssue={onFixIssue} />
            )}
            {selectedTab === 'warnings' && (
              <WarningsTab warnings={warnings} />
            )}
            {selectedTab === 'duplicates' && (
              <DuplicatesTab 
                duplicateGroups={duplicateGroups} 
                onResolveDuplicate={onResolveDuplicate}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Preview Tab Component
function PreviewTab({ 
  data, 
  mapping, 
  previewRows, 
  onPreviewRowsChange 
}: {
  data: any[]
  mapping: Record<string, string>
  previewRows: number
  onPreviewRowsChange: (rows: number) => void
}) {
  const columns = Object.keys(data[0] || {})
  const displayData = data.slice(0, previewRows)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Data Preview ({data.length.toLocaleString()} total rows)
        </h4>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={previewRows}
            onChange={(e) => onPreviewRowsChange(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Row
              </th>
              {columns.map(column => (
                <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  <div>
                    <div className="truncate max-w-32" title={column}>{column}</div>
                    {Object.entries(mapping).find(([_, csvCol]) => csvCol === column) && (
                      <div className="text-xs text-primary-600 font-normal">
                        → {Object.entries(mapping).find(([_, csvCol]) => csvCol === column)?.[0]}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs text-gray-500 font-medium">
                  {index + 1}
                </td>
                {columns.map(column => (
                  <td key={column} className="px-3 py-2 text-xs text-gray-900">
                    <div className="max-w-32 truncate" title={String(row[column] || '')}>
                      {String(row[column] || '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Errors Tab Component
function ErrorsTab({ 
  errors, 
  onFixIssue 
}: {
  errors: ValidationError[]
  onFixIssue?: (rowIndex: number, field: string, newValue: string) => void
}) {
  if (errors.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Errors Found</h4>
        <p className="text-gray-600">All data passed validation checks!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">
        Critical Errors ({errors.length})
      </h4>
      <p className="text-sm text-gray-600">
        These errors must be fixed before importing. Fix them in your CSV file and re-upload.
      </p>
      
      <div className="space-y-3">
        {errors.map((error, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-red-800">Row {error.row}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    {error.column}
                  </span>
                </div>
                <p className="text-sm text-red-700 mb-2">{error.message}</p>
                {error.suggestedFix && (
                  <div className="bg-white border border-red-200 rounded p-2">
                    <p className="text-xs text-red-600">
                      <strong>Suggested fix:</strong> {error.suggestedFix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Warnings Tab Component
function WarningsTab({ warnings }: { warnings: ValidationWarning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Warnings</h4>
        <p className="text-gray-600">All data looks good!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">
        Warnings ({warnings.length})
      </h4>
      <p className="text-sm text-gray-600">
        These issues will be automatically corrected during import.
      </p>
      
      <div className="space-y-3">
        {warnings.map((warning, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-yellow-800">Row {warning.row}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {warning.column}
                  </span>
                </div>
                <p className="text-sm text-yellow-700 mb-2">{warning.message}</p>
                {warning.suggestedFix && (
                  <div className="bg-white border border-yellow-200 rounded p-2">
                    <p className="text-xs text-yellow-600">
                      <strong>Auto-fix:</strong> {warning.suggestedFix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Duplicates Tab Component
function DuplicatesTab({ 
  duplicateGroups, 
  onResolveDuplicate 
}: {
  duplicateGroups: DuplicateGroup[]
  onResolveDuplicate?: (groupId: string, resolution: 'merge' | 'skip' | 'keep_all') => void
}) {
  if (duplicateGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No Duplicates Found</h4>
        <p className="text-gray-600">All applications appear to be unique!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-900">
        Potential Duplicates ({duplicateGroups.length} groups)
      </h4>
      <p className="text-sm text-gray-600">
        Review these potential duplicates and choose how to handle them.
      </p>
      
      <div className="space-y-4">
        {duplicateGroups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="text-sm font-medium text-blue-900">
                  Duplicate Group {index + 1}
                </h5>
                <p className="text-xs text-blue-700">
                  {Math.round(group.confidence * 100)}% confidence • {group.applications.length} applications
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onResolveDuplicate?.(group.id, 'merge')}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Merge
                </button>
                <button
                  onClick={() => onResolveDuplicate?.(group.id, 'skip')}
                  className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                >
                  Skip Duplicates
                </button>
                <button
                  onClick={() => onResolveDuplicate?.(group.id, 'keep_all')}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Keep All
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              {group.matchReasons.map((reason, reasonIndex) => (
                <p key={reasonIndex} className="text-xs text-blue-700">
                  • {reason}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.applications.map((app, appIndex) => (
                <div key={appIndex} className="bg-white border border-blue-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-900">
                      {app.isExisting ? 'Existing Application' : `Row ${app.index + 1}`}
                    </span>
                    {appIndex === 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p><strong>Company:</strong> {app.data.company || 'N/A'}</p>
                    <p><strong>Position:</strong> {app.data.position || 'N/A'}</p>
                    <p><strong>Location:</strong> {app.data.location || 'N/A'}</p>
                    <p><strong>Applied:</strong> {app.data.appliedDate || 'N/A'}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}