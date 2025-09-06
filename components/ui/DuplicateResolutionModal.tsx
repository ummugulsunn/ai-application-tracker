'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { Application } from '@/types/application'
import { DuplicateMatch, generateMergeSuggestions } from '@/lib/utils/duplicateDetection'
import { formatDate } from '@/lib/utils'

interface DuplicateResolutionModalProps {
  isOpen: boolean
  onClose: () => void
  newApplication: Partial<Application>
  duplicateMatches: DuplicateMatch[]
  onResolve: (action: 'add' | 'merge' | 'skip', targetId?: string, mergedData?: Partial<Application>) => void
}

export default function DuplicateResolutionModal({
  isOpen,
  onClose,
  newApplication,
  duplicateMatches,
  onResolve
}: DuplicateResolutionModalProps) {
  const [selectedAction, setSelectedAction] = useState<'add' | 'merge' | 'skip'>('add')
  const [selectedMatch, setSelectedMatch] = useState<DuplicateMatch | null>(null)
  const [mergedData, setMergedData] = useState<Partial<Application> | null>(null)

  // Set initial selected match when duplicateMatches changes
  useEffect(() => {
    if (duplicateMatches && duplicateMatches.length > 0 && duplicateMatches[0]) {
      setSelectedMatch(duplicateMatches[0])
    } else {
      setSelectedMatch(null)
    }
  }, [duplicateMatches])

  // Generate merge preview when a match is selected
  const handleMatchSelect = (match: DuplicateMatch) => {
    setSelectedMatch(match)
    setSelectedAction('merge')
    const merged = generateMergeSuggestions(newApplication, match.existingApplication)
    setMergedData(merged)
  }

  const handleResolve = () => {
    if (selectedAction === 'merge' && selectedMatch) {
      onResolve('merge', selectedMatch.existingApplication.id, mergedData || undefined)
    } else {
      onResolve(selectedAction)
    }
  }



  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!isOpen) return null

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
            className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Potential Duplicate Detected
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <DocumentDuplicateIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">
                      Similar Application Found
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      We found {duplicateMatches.length} existing application{duplicateMatches.length > 1 ? 's' : ''} 
                      that might be similar to the one you're adding. Please review and choose how to proceed.
                    </p>
                  </div>
                </div>
              </div>

              {/* New Application Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">New Application</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500">Company</span>
                      <p className="text-sm font-medium text-gray-900">{newApplication.company}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Position</span>
                      <p className="text-sm font-medium text-gray-900">{newApplication.position}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">Location</span>
                      <p className="text-sm text-gray-900">{newApplication.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Applications */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Similar Applications</h3>
                <div className="space-y-3">
                  {duplicateMatches.map((match, index) => (
                    <div
                      key={match.existingApplication.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMatch?.existingApplication.id === match.existingApplication.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleMatchSelect(match)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Match #{index + 1}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor('medium')}`}>
                            {Math.round(match.similarity * 100)}% similar
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Applied {formatDate(match.existingApplication.appliedDate)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <span className="text-xs font-medium text-gray-500">Company</span>
                          <p className="text-sm text-gray-900">{match.existingApplication.company}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">Position</span>
                          <p className="text-sm text-gray-900">{match.existingApplication.position}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">Status</span>
                          <p className="text-sm text-gray-900">{match.existingApplication.status}</p>
                        </div>
                      </div>
                      
                      {/* Additional details for better comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">Location:</span> {match.existingApplication.location || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">Salary:</span> {match.existingApplication.salary || 'Not specified'}
                        </div>
                        {match.existingApplication.contactEmail && (
                          <div>
                            <span className="font-medium">Contact:</span> {match.existingApplication.contactEmail}
                          </div>
                        )}
                        {match.existingApplication.jobUrl && (
                          <div>
                            <span className="font-medium">Job URL:</span> 
                            <a href={match.existingApplication.jobUrl} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 hover:text-blue-800 ml-1 truncate">
                              View Job
                            </a>
                          </div>
                        )}
                      </div>

                      {match.matchReasons.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">Match Reasons:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {match.matchReasons.map((reason, reasonIndex) => (
                              <span
                                key={reasonIndex}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Choose Action</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="add"
                      checked={selectedAction === 'add'}
                      onChange={(e) => setSelectedAction(e.target.value as 'add')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Add as New Application</div>
                      <div className="text-sm text-gray-500">
                        Add this as a separate application (they are different roles or companies)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="merge"
                      checked={selectedAction === 'merge'}
                      onChange={(e) => setSelectedAction(e.target.value as 'merge')}
                      className="mt-1"
                      disabled={!selectedMatch}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        Merge with Existing Application
                      </div>
                      <div className="text-sm text-gray-500">
                        Update the existing application with new information
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="skip"
                      checked={selectedAction === 'skip'}
                      onChange={(e) => setSelectedAction(e.target.value as 'skip')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Skip Adding</div>
                      <div className="text-sm text-gray-500">
                        Don't add this application (it's a duplicate)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Merge Preview */}
              {selectedAction === 'merge' && selectedMatch && mergedData && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>Merge Preview</span>
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Company</span>
                        <p className="text-sm text-gray-900">{mergedData.company}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Position</span>
                        <p className="text-sm text-gray-900">{mergedData.position}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Location</span>
                        <p className="text-sm text-gray-900">{mergedData.location}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Status</span>
                        <p className="text-sm text-gray-900">{mergedData.status}</p>
                      </div>
                    </div>
                    {mergedData.tags && mergedData.tags.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-gray-500">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {mergedData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleResolve}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>
                    {selectedAction === 'add' && 'Add as New'}
                    {selectedAction === 'merge' && 'Merge Applications'}
                    {selectedAction === 'skip' && 'Skip Adding'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}