'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Application } from '@/types/application'
import { 
  detectBulkDuplicates, 
  applyBulkResolutions,
  BulkDuplicateResult,
  DuplicateGroup,
  BulkResolutionAction
} from '@/lib/utils/duplicateDetection'
import { useApplicationStore } from '@/store/applicationStore'
import { toast } from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface BulkDuplicateManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkDuplicateManager({ isOpen, onClose }: BulkDuplicateManagerProps) {
  const { applications, updateApplication, deleteApplications } = useApplicationStore()
  const [bulkResult, setBulkResult] = useState<BulkDuplicateResult | null>(null)
  const [selectedActions, setSelectedActions] = useState<Map<string, BulkResolutionAction>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState<string | null>(null)

  // Analyze duplicates when modal opens
  useEffect(() => {
    if (isOpen && applications.length > 0) {
      const result = detectBulkDuplicates(applications)
      setBulkResult(result)
      
      // Auto-select recommended actions
      const autoActions = new Map<string, BulkResolutionAction>()
      result.duplicateGroups.forEach(group => {
        autoActions.set(group.id, {
          groupId: group.id,
          action: group.recommendedAction === 'merge' ? 'merge' : 
                  group.recommendedAction === 'keep_newest' ? 'keep_newest' :
                  group.recommendedAction === 'keep_oldest' ? 'keep_oldest' : 'keep_all',
          mergedData: group.mergePreview
        })
      })
      setSelectedActions(autoActions)
    }
  }, [isOpen, applications])

  const handleActionChange = (groupId: string, action: BulkResolutionAction['action']) => {
    const group = bulkResult?.duplicateGroups.find(g => g.id === groupId)
    if (!group) return

    setSelectedActions(prev => new Map(prev.set(groupId, {
      groupId,
      action,
      mergedData: action === 'merge' ? group.mergePreview : undefined
    })))
  }

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const handleApplyResolutions = async () => {
    if (!bulkResult || selectedActions.size === 0) return

    setIsProcessing(true)
    try {
      const actions = Array.from(selectedActions.values())
      const result = applyBulkResolutions(applications, actions)

      // Apply changes to store
      if (result.deletedApplicationIds.length > 0) {
        deleteApplications(result.deletedApplicationIds)
      }

      result.mergedApplications.forEach(app => {
        updateApplication(app.id, app)
      })

      toast.success(
        `Successfully processed duplicates: ${result.summary.merged} merged, ${result.summary.deleted} deleted, ${result.summary.kept} kept`
      )

      onClose()
    } catch (error) {
      toast.error('Failed to process duplicates')
      console.error('Error processing duplicates:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getActionIcon = (action: BulkResolutionAction['action']) => {
    switch (action) {
      case 'merge': return <ArrowPathIcon className="w-4 h-4" />
      case 'keep_newest': return <ClockIcon className="w-4 h-4" />
      case 'keep_oldest': return <ClockIcon className="w-4 h-4" />
      case 'delete_duplicates': return <TrashIcon className="w-4 h-4" />
      default: return <CheckCircleIcon className="w-4 h-4" />
    }
  }

  const getActionColor = (action: BulkResolutionAction['action']) => {
    switch (action) {
      case 'merge': return 'text-blue-600 bg-blue-100'
      case 'keep_newest': return 'text-green-600 bg-green-100'
      case 'keep_oldest': return 'text-yellow-600 bg-yellow-100'
      case 'delete_duplicates': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.9) return 'text-red-600 bg-red-100'
    if (confidence > 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-blue-600 bg-blue-100'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.9) return 'High'
    if (confidence > 0.7) return 'Medium'
    return 'Low'
  }

  if (!isOpen || !bulkResult) return null

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
              <div className="flex items-center space-x-3">
                <DocumentDuplicateIcon className="w-6 h-6 text-blue-500" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Bulk Duplicate Manager</h2>
                  <p className="text-sm text-gray-600">
                    Found {bulkResult.duplicateGroups.length} duplicate groups affecting {bulkResult.totalDuplicates} applications
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{bulkResult.highConfidenceCount}</div>
                  <div className="text-sm text-gray-600">High Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{bulkResult.mediumConfidenceCount}</div>
                  <div className="text-sm text-gray-600">Medium Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{bulkResult.lowConfidenceCount}</div>
                  <div className="text-sm text-gray-600">Low Confidence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{bulkResult.totalDuplicates}</div>
                  <div className="text-sm text-gray-600">Total Duplicates</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {bulkResult.recommendations.length > 0 && (
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {bulkResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <ExclamationTriangleIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700">{rec.description}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        rec.confidence === 'high' ? 'bg-red-100 text-red-700' :
                        rec.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {rec.confidence} confidence
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate Groups */}
            <div className="flex-1 overflow-y-auto max-h-[50vh]">
              <div className="p-6 space-y-4">
                {bulkResult.duplicateGroups.map((group) => (
                  <DuplicateGroupCard
                    key={group.id}
                    group={group}
                    selectedAction={selectedActions.get(group.id)?.action || 'keep_all'}
                    onActionChange={(action) => handleActionChange(group.id, action)}
                    isExpanded={expandedGroups.has(group.id)}
                    onToggleExpansion={() => toggleGroupExpansion(group.id)}
                    showPreview={showPreview === group.id}
                    onTogglePreview={() => setShowPreview(showPreview === group.id ? null : group.id)}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedActions.size} of {bulkResult.duplicateGroups.length} groups configured
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleApplyResolutions}
                  disabled={isProcessing || selectedActions.size === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Apply Resolutions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}

// Duplicate Group Card Component
function DuplicateGroupCard({
  group,
  selectedAction,
  onActionChange,
  isExpanded,
  onToggleExpansion,
  showPreview,
  onTogglePreview
}: {
  group: DuplicateGroup
  selectedAction: BulkResolutionAction['action']
  onActionChange: (action: BulkResolutionAction['action']) => void
  isExpanded: boolean
  onToggleExpansion: () => void
  showPreview: boolean
  onTogglePreview: () => void
}) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.9) return 'text-red-600 bg-red-100'
    if (confidence > 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-blue-600 bg-blue-100'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.9) return 'High'
    if (confidence > 0.7) return 'Medium'
    return 'Low'
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Group Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onToggleExpansion}
              className="text-gray-500 hover:text-gray-700"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                ▶
              </motion.div>
            </button>
            
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  {group.applications.length} Similar Applications
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(group.confidence)}`}>
                  {getConfidenceLabel(group.confidence)} ({Math.round(group.confidence * 100)}%)
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {group.applications[0]?.company} • {group.applications[0]?.position}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {group.mergePreview && (
              <button
                onClick={onTogglePreview}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <EyeIcon className="w-4 h-4" />
                <span>Preview</span>
              </button>
            )}
            
            <select
              value={selectedAction}
              onChange={(e) => onActionChange(e.target.value as BulkResolutionAction['action'])}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="merge">Merge All</option>
              <option value="keep_newest">Keep Newest</option>
              <option value="keep_oldest">Keep Oldest</option>
              <option value="delete_duplicates">Delete Duplicates</option>
              <option value="keep_all">Keep All</option>
            </select>
          </div>
        </div>

        {/* Match Reasons */}
        <div className="mt-2 flex flex-wrap gap-1">
          {group.matchReasons.slice(0, 3).map((reason, index) => (
            <span
              key={index}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
            >
              {reason}
            </span>
          ))}
          {group.matchReasons.length > 3 && (
            <span className="text-xs text-gray-500">
              +{group.matchReasons.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {group.applications.map((app, index) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{app.company}</div>
                    <div className="text-sm text-gray-600">{app.position}</div>
                    <div className="text-xs text-gray-500">
                      Applied: {formatDate(app.appliedDate)} • Status: {app.status}
                    </div>
                  </div>
                  {index === 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merge Preview */}
      <AnimatePresence>
        {showPreview && group.mergePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 bg-green-50 p-4"
          >
            <h5 className="font-medium text-gray-900 mb-2">Merge Preview</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Company:</span>
                <span className="ml-2 text-gray-900">{group.mergePreview.company}</span>
              </div>
              <div>
                <span className="text-gray-600">Position:</span>
                <span className="ml-2 text-gray-900">{group.mergePreview.position}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 text-gray-900">{group.mergePreview.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Applied:</span>
                <span className="ml-2 text-gray-900">
                  {group.mergePreview.appliedDate ? formatDate(group.mergePreview.appliedDate) : 'N/A'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}