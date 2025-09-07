'use client'

import { useMemo, useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'
import { toast } from 'react-hot-toast'
import { detectBulkDuplicates } from '@/lib/utils/duplicateDetection'
import { formatDateForSSR, useProgressiveDateDisplay } from '@/lib/utils/dateFormatting'
import {
  useHydrationSafeAnimations,
  getTableRowClasses,
  getButtonClasses,
  getCardClasses,
  conditionalAnimationClass
} from '@/lib/utils/animationUtils'
import { HydrationErrorBoundary, useHydrationErrorHandler } from './HydrationErrorBoundary'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useDashboardPreferences } from '@/lib/hooks/useUserPreferences'
import EditApplicationModal from './EditApplicationModal'

// Component for hydration-safe date display with progressive enhancement
function DateDisplay({ date, showRelative = false }: { date: string | Date; showRelative?: boolean }) {
  const dateDisplay = useProgressiveDateDisplay(date, {
    showRelativeTime: showRelative,
    enableClientEnhancements: true
  })

  return (
    <div className="text-xs sm:text-sm text-gray-900">
      {dateDisplay.absolute}
      {showRelative && dateDisplay.isEnhanced && (
        <div className="text-[11px] sm:text-sm text-gray-500">
          {dateDisplay.relative}
        </div>
      )}
    </div>
  )
}

// Internal ApplicationTable component without error boundary
function ApplicationTableInternal() {
  const {
    getFilteredApplications,
    deleteApplication,
    deleteApplications,
    setSearchQuery,
    setSortOptions,
    sortOptions,
    searchQuery
  } = useApplicationStore()

  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Enable animations only after hydration to prevent mismatches
  const animationsEnabled = useHydrationSafeAnimations()

  // Hook for handling hydration errors within the component
  const { handleHydrationError } = useHydrationErrorHandler()

  // Language and preferences
  const { t } = useLanguage()
  const dashboardPrefs = useDashboardPreferences()

  const applications = getFilteredApplications()
  const allIds = useMemo(() => applications.map(a => a.id), [applications])
  const isAllSelected = selectedIds.size > 0 && selectedIds.size === allIds.length
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < allIds.length

  const handleSort = (field: keyof Application) => {
    const newDirection = sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc'
    setSortOptions({ field, direction: newDirection })
  }

  const handleDelete = (id: string) => {
    try {
      if (confirm(t('message.confirmDelete'))) {
        deleteApplication(id)
        toast.success(t('message.success'))
      }
    } catch (error) {
      handleHydrationError(error as Error, 'ApplicationTable.handleDelete')
      toast.error(t('message.error'))
    }
  }

  const toggleSelectAll = () => {
    if (isAllSelected || isIndeterminate) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allIds))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    try {
      if (selectedIds.size === 0) return
      if (!confirm(`Delete ${selectedIds.size} selected item(s)?`)) return
      deleteApplications(Array.from(selectedIds))
      setSelectedIds(new Set())
      toast.success('Selected applications deleted')
    } catch (error) {
      handleHydrationError(error as Error, 'ApplicationTable.handleBulkDelete')
      toast.error('Failed to delete selected applications')
    }
  }

  const handleBulkDuplicateCheck = () => {
    try {
      if (selectedIds.size < 2) return

      const selectedApps = applications.filter(app => selectedIds.has(app.id))
      const duplicateResult = detectBulkDuplicates(selectedApps)

      if (duplicateResult.duplicateGroups.length > 0) {
        toast.success(`Found ${duplicateResult.duplicateGroups.length} duplicate groups in selected applications`)
        // You could open a mini duplicate manager here or show results
      } else {
        toast('No duplicates found in selected applications', { icon: '✅' })
      }
    } catch (error) {
      handleHydrationError(error as Error, 'ApplicationTable.handleBulkDuplicateCheck')
      toast.error('Failed to check for duplicates')
    }
  }

  const getStatusColor = (status: Application['status']) => {
    const colors = {
      'Pending': 'bg-warning-100 text-warning-800',
      'Applied': 'bg-primary-100 text-primary-800',
      'Interviewing': 'bg-blue-100 text-blue-800',
      'Offered': 'bg-success-100 text-success-800',
      'Rejected': 'bg-danger-100 text-danger-800',
      'Accepted': 'bg-success-100 text-success-800',
      'Withdrawn': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors['Pending']
  }

  const getPriorityColor = (priority: Application['priority']) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-warning-100 text-warning-800',
      'High': 'bg-danger-100 text-danger-800'
    }
    return colors[priority] || colors['Medium']
  }

  // Extract table row rendering to avoid duplication between animated and non-animated versions
  const renderTableRow = (application: Application) => (
    <>
      <td key={`checkbox-${application.id}`} className="px-2 py-2">
        <input
          type="checkbox"
          aria-label="Select row"
          checked={selectedIds.has(application.id)}
          onChange={() => toggleSelectOne(application.id)}
        />
      </td>
      <td key={`company-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <div className="truncate">
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[168px]">
            {application.company}
          </div>
          <div className="text-[11px] sm:text-sm text-gray-500 truncate max-w-[168px]">
            {application.type}
          </div>
        </div>
      </td>

      <td key={`position-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[224px]">
          {application.position}
        </div>
        <div className="text-[11px] sm:text-sm text-gray-500 truncate max-w-[224px]">
          {application.salary}
        </div>
      </td>

      <td key={`location-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[160px]">
          {application.location}
        </div>
      </td>

      <td key={`status-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
          {application.status}
        </span>
      </td>

      <td key={`date-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <DateDisplay date={application.appliedDate} showRelative={true} />
      </td>

      <td key={`priority-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
          {application.priority}
        </span>
      </td>

      <td key={`actions-${application.id}`} className="px-3 sm:px-4 py-2 whitespace-nowrap text-xs sm:text-sm font-medium">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            key={`view-${application.id}`}
            onClick={() => {
              setSelectedApplication(application)
              setIsViewModalOpen(true)
            }}
            className={`text-primary-600 hover:text-primary-900 ${conditionalAnimationClass(animationsEnabled, 'transition-colors duration-200')}`}
            title="View details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>

          <button
            key={`edit-${application.id}`}
            onClick={() => {
              setSelectedApplication(application)
              setIsEditModalOpen(true)
            }}
            className={`text-warning-600 hover:text-warning-900 ${conditionalAnimationClass(animationsEnabled, 'transition-colors duration-200')}`}
            title="Edit application"
          >
            <PencilIcon className="w-4 h-4" />
          </button>

          <button
            key={`delete-${application.id}`}
            onClick={() => handleDelete(application.id)}
            className={`text-danger-600 hover:text-danger-900 ${conditionalAnimationClass(animationsEnabled, 'transition-colors duration-200')}`}
            title="Delete application"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  )

  return (
    <div className="space-y-6" data-tour="application-table">
      {/* Filters and Search */}
      <div className={getCardClasses(animationsEnabled)}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('applications.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button className={`${getButtonClasses(animationsEnabled, 'secondary')} flex items-center space-x-2`}>
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>

            <button className={`${getButtonClasses(animationsEnabled, 'secondary')} flex items-center space-x-2`}>
              <ChevronUpDownIcon className="w-4 h-4" />
              <span>Sort</span>
            </button>

            <button
              className={`${getButtonClasses(animationsEnabled, 'secondary')} flex items-center space-x-2 ${selectedIds.size < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleBulkDuplicateCheck}
              disabled={selectedIds.size < 2}
              title={selectedIds.size < 2 ? 'Select at least 2 rows to check for duplicates' : 'Check selected for duplicates'}
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              <span>Check Duplicates{selectedIds.size > 1 ? ` (${selectedIds.size})` : ''}</span>
            </button>

            <button
              className={`${getButtonClasses(animationsEnabled, 'danger')} flex items-center space-x-2 ${selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
              title={selectedIds.size === 0 ? 'Select rows to enable' : 'Delete selected rows'}
            >
              <TrashIcon className="w-4 h-4" />
              <span>Delete selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className={`${getCardClasses(animationsEnabled)} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-max table-fixed divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th
                  className={`px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-40 ${conditionalAnimationClass(animationsEnabled, 'hover:bg-gray-100 transition-colors duration-200')}`}
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Company</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th
                  className={`px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-52 ${conditionalAnimationClass(animationsEnabled, 'hover:bg-gray-100 transition-colors duration-200')}`}
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Position</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Location
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Status
                </th>
                <th
                  className={`px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-32 ${conditionalAnimationClass(animationsEnabled, 'hover:bg-gray-100 transition-colors duration-200')}`}
                  onClick={() => handleSort('appliedDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Applied</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Priority
                </th>
                <th className="px-2 sm:px-3 py-2 text-left text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application, index) => (
                <tr
                  key={application.id || `fallback-${index}`}
                  className={getTableRowClasses(animationsEnabled)}
                >
                  {renderTableRow(application)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk actions */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`${getButtonClasses(animationsEnabled, 'danger')} text-xs`}
              disabled={selectedIds.size === 0}
              onClick={handleBulkDelete}
            >
              Delete selected
            </button>
          </div>
        </div>

        {/* Empty State */}
        {applications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Get started by adding your first application'}
            </p>
            {!searchQuery && (
              <button className={getButtonClasses(animationsEnabled, 'primary')}>
                Add Application
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsViewModalOpen(false)} />
            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedApplication.company} - {selectedApplication.position}
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{selectedApplication.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-900">{selectedApplication.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Salary:</span>
                    <span className="ml-2 text-gray-900">{selectedApplication.salary}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedApplication.status)}`}>
                      {selectedApplication.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedApplication.priority)}`}>
                      {selectedApplication.priority}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Applied:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDateForSSR(selectedApplication.appliedDate)}
                    </span>
                  </div>
                </div>
                {selectedApplication.notes && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <p className="mt-1 text-gray-900">{selectedApplication.notes}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className={getButtonClasses(animationsEnabled, 'secondary')}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditApplicationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedApplication(null)
        }}
        application={selectedApplication}
      />
    </div>
  )
}

// Hydration-safe fallback UI for the ApplicationTable
function ApplicationTableFallback() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Applications</h3>
          <p className="text-gray-500 mb-4">
            Please wait while we load your job applications...
          </p>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export with hydration error boundary - this replaces the default export
export default function ApplicationTable() {
  const handleHydrationError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Hydration error in ApplicationTable:', error, errorInfo)

    // Additional logging for ApplicationTable specific context
    console.group('ApplicationTable Hydration Error Context')
    console.log('Component: ApplicationTable')
    console.log('Error occurred during table rendering or interaction')
    console.log('Possible causes:')
    console.log('- Date formatting differences between server and client')
    console.log('- Animation state mismatches')
    console.log('- Store state hydration issues')
    console.log('- Dynamic content rendering differences')
    console.groupEnd()
  }

  return (
    <HydrationErrorBoundary
      fallback={<ApplicationTableFallback />}
      onHydrationError={handleHydrationError}
    >
      <ApplicationTableInternal />
    </HydrationErrorBoundary>
  )
}
