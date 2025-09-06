'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  EyeIcon,
  CheckIcon,

  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline'
import { DuplicateGroup, DuplicateResolution } from '@/lib/csv/duplicate-detector'
import { CSVProcessor } from '@/lib/csv/processor'

interface DuplicateResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  duplicateGroups: DuplicateGroup[]
  mapping: Record<string, string>
  onResolutionsComplete: (resolutions: DuplicateResolution[]) => void
}

export default function DuplicateResolutionModal({
  isOpen,
  onClose,
  duplicateGroups,
  mapping,
  onResolutionsComplete
}: DuplicateResolutionModalProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [resolutions, setResolutions] = useState<Record<string, DuplicateResolution>>({})
  const [showMergePreview, setShowMergePreview] = useState<string | null>(null)

  const currentGroup = duplicateGroups[currentGroupIndex]
  const totalGroups = duplicateGroups.length
  const resolvedCount = Object.keys(resolutions).length

  const handleResolution = (groupId: string, action: DuplicateResolution['action']) => {
    const group = duplicateGroups.find(g => g.id === groupId)
    if (!group) return

    const resolution: DuplicateResolution = {
      action,
      primaryIndex: group.applications[0]!.index,
      secondaryIndex: group.applications[1]!.index
    }

    if (action === 'merge') {
      resolution.mergedData = CSVProcessor.generateMergePreview(group.applications, mapping)
    }

    setResolutions(prev => ({
      ...prev,
      [groupId]: resolution
    }))

    // Auto-advance to next group
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex(prev => prev + 1)
    }
  }

  const handleComplete = () => {
    const resolutionList = Object.values(resolutions)
    onResolutionsComplete(resolutionList)
    onClose()
  }

  const generateMergePreview = (group: DuplicateGroup) => {
    return CSVProcessor.generateMergePreview(group.applications, mapping)
  }

  if (!isOpen || !currentGroup) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-6xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resolve Duplicates</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Group {currentGroupIndex + 1} of {totalGroups} • {resolvedCount} resolved
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round((resolvedCount / totalGroups) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(resolvedCount / totalGroups) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Group Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-blue-900">
                    Duplicate Group {currentGroupIndex + 1}
                  </h3>
                  <span className="text-sm text-blue-700">
                    {Math.round(currentGroup.confidence * 100)}% confidence match
                  </span>
                </div>
                <div className="space-y-1">
                  {currentGroup.matchReasons.map((reason, index) => (
                    <p key={index} className="text-sm text-blue-700">• {reason}</p>
                  ))}
                </div>
              </div>

              {/* Applications Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {currentGroup.applications.map((app, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {app.isExisting ? 'Existing Application' : `Row ${app.index + 1}`}
                      </h4>
                      {index === 0 && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <ApplicationDetails data={app.data} mapping={mapping} />
                  </div>
                ))}
              </div>

              {/* Resolution Options */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Choose Resolution</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Merge Option */}
                  <ResolutionOption
                    title="Merge Applications"
                    description="Combine data from both applications"
                    icon={<ArrowsRightLeftIcon className="w-6 h-6" />}
                    color="blue"
                    recommended={currentGroup.confidence >= 0.9}
                    onClick={() => handleResolution(currentGroup.id, 'merge')}
                    onPreview={() => setShowMergePreview(currentGroup.id)}
                    isSelected={resolutions[currentGroup.id]?.action === 'merge'}
                  />

                  {/* Skip Duplicates Option */}
                  <ResolutionOption
                    title="Skip Duplicates"
                    description="Keep primary, skip others"
                    icon={<XMarkIcon className="w-6 h-6" />}
                    color="yellow"
                    recommended={currentGroup.confidence >= 0.7 && currentGroup.confidence < 0.9}
                    onClick={() => handleResolution(currentGroup.id, 'skip')}
                    isSelected={resolutions[currentGroup.id]?.action === 'skip'}
                  />

                  {/* Update Option */}
                  <ResolutionOption
                    title="Update Primary"
                    description="Update primary with new data"
                    icon={<ArrowPathIcon className="w-6 h-6" />}
                    color="green"
                    onClick={() => handleResolution(currentGroup.id, 'update')}
                    isSelected={resolutions[currentGroup.id]?.action === 'update'}
                  />

                  {/* Keep Both Option */}
                  <ResolutionOption
                    title="Keep Both"
                    description="Import as separate applications"
                    icon={<CheckIcon className="w-6 h-6" />}
                    color="gray"
                    onClick={() => handleResolution(currentGroup.id, 'keep_both')}
                    isSelected={resolutions[currentGroup.id]?.action === 'keep_both'}
                  />
                </div>
              </div>

              {/* Merge Preview */}
              {showMergePreview === currentGroup.id && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">Merge Preview</h5>
                    <button
                      onClick={() => setShowMergePreview(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <ApplicationDetails 
                    data={generateMergePreview(currentGroup)} 
                    mapping={mapping}
                    highlight={true}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentGroupIndex(Math.max(0, currentGroupIndex - 1))}
                  disabled={currentGroupIndex === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentGroupIndex(Math.min(totalGroups - 1, currentGroupIndex + 1))}
                  disabled={currentGroupIndex === totalGroups - 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {resolvedCount} of {totalGroups} resolved
                </span>
                <button
                  onClick={handleComplete}
                  disabled={resolvedCount < totalGroups}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Resolutions
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

// Application Details Component
function ApplicationDetails({ 
  data, 
  mapping, 
  highlight = false 
}: {
  data: any
  mapping: Record<string, string>
  highlight?: boolean
}) {
  const fields = [
    { key: 'company', label: 'Company' },
    { key: 'position', label: 'Position' },
    { key: 'location', label: 'Location' },
    { key: 'appliedDate', label: 'Applied Date' },
    { key: 'status', label: 'Status' },
    { key: 'salary', label: 'Salary' },
    { key: 'contactEmail', label: 'Contact Email' },
    { key: 'jobUrl', label: 'Job URL' }
  ]

  return (
    <div className={`space-y-2 ${highlight ? 'bg-blue-50 p-3 rounded' : ''}`}>
      {fields.map(field => {
        const csvColumn = mapping[field.key]
        const value = csvColumn ? data[csvColumn] : null
        
        if (!value) return null

        return (
          <div key={field.key} className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">{field.label}:</span>
            <span className="text-gray-900 max-w-48 truncate" title={String(value)}>
              {String(value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// Resolution Option Component
function ResolutionOption({
  title,
  description,
  icon,
  color,
  recommended = false,
  onClick,
  onPreview,
  isSelected = false
}: {
  title: string
  description: string
  icon: React.ReactNode
  color: 'blue' | 'yellow' | 'green' | 'gray'
  recommended?: boolean
  onClick: () => void
  onPreview?: () => void
  isSelected?: boolean
}) {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
    yellow: 'border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50',
    green: 'border-green-200 hover:border-green-300 hover:bg-green-50',
    gray: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
  }

  const selectedClasses = {
    blue: 'border-blue-500 bg-blue-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    green: 'border-green-500 bg-green-50',
    gray: 'border-gray-500 bg-gray-50'
  }

  return (
    <div className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
      isSelected ? selectedClasses[color] : colorClasses[color]
    }`}>
      {recommended && (
        <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
          Recommended
        </div>
      )}
      
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-2 rounded-lg ${
          color === 'blue' ? 'bg-blue-100 text-blue-600' :
          color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
          color === 'green' ? 'bg-green-100 text-green-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {icon}
        </div>
        
        <div>
          <h5 className="font-medium text-gray-900 mb-1">{title}</h5>
          <p className="text-xs text-gray-600">{description}</p>
        </div>

        <div className="flex flex-col space-y-2 w-full">
          <button
            onClick={onClick}
            className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
          
          {onPreview && (
            <button
              onClick={onPreview}
              className="w-full py-1 px-3 rounded text-xs text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
            >
              <EyeIcon className="w-3 h-3" />
              <span>Preview</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}