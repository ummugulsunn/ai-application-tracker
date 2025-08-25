'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChevronUpDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { Application, SortOptions } from '@/types/application'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import EditApplicationModal from './EditApplicationModal'

export default function ApplicationTable() {
  const { 
    getFilteredApplications, 
    deleteApplication, 
    setSearchQuery, 
    setSortOptions,
    sortOptions,
    searchQuery 
  } = useApplicationStore()
  
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const applications = getFilteredApplications()

  const handleSort = (field: keyof Application) => {
    const newDirection = sortOptions.field === field && sortOptions.direction === 'asc' ? 'desc' : 'asc'
    setSortOptions({ field, direction: newDirection })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      deleteApplication(id)
      toast.success('Application deleted successfully')
    }
  }

  const handleEdit = (application: Application) => {
    setSelectedApplication(application)
    setIsEditModalOpen(true)
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(applications.map(app => app.id))
      setSelectedIds(allIds)
      setSelectAll(true)
    }
  }

  const handleSelectOne = (id: string) => {
    const newSelectedIds = new Set(selectedIds)
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id)
    } else {
      newSelectedIds.add(id)
    }
    setSelectedIds(newSelectedIds)
    setSelectAll(newSelectedIds.size === applications.length)
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    
    const count = selectedIds.size
    if (confirm(`Are you sure you want to delete ${count} application${count > 1 ? 's' : ''}?`)) {
      selectedIds.forEach(id => deleteApplication(id))
      setSelectedIds(new Set())
      setSelectAll(false)
      toast.success(`${count} application${count > 1 ? 's' : ''} deleted successfully`)
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setSelectAll(false)
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

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="btn-secondary flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
            <button className="btn-secondary flex items-center space-x-2">
              <ChevronUpDownIcon className="w-4 h-4" />
              <span>Sort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <motion.div 
          className="card bg-gradient-to-r from-warning-50 to-orange-50 border-warning-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <CheckIcon className="w-5 h-5 text-warning-600" />
                <span className="font-medium text-warning-800">
                  {selectedIds.size} application{selectedIds.size > 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={clearSelection}
                className="btn-secondary text-sm px-4 py-2"
              >
                Clear Selection
              </button>
              <button 
                onClick={handleBulkDelete}
                className="btn-danger text-sm px-4 py-2 flex items-center space-x-2"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Applications Table */}
      <div className="card overflow-hidden">
        {/* Table Container with Better Horizontal Scroll */}
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40px]">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[160px]">
                    <div className="flex items-center space-x-1">
                      <span>Company</span>
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[140px]">
                    <div className="flex items-center space-x-1">
                      <span>Position</span>
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Location
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-[120px]">
                    <div className="flex items-center space-x-1">
                      <span>Applied</span>
                      <ChevronUpDownIcon className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                    Priority
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {applications.map((application) => (
                    <motion.tr
                      key={application.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-gray-50 transition-colors duration-150 ${
                        selectedIds.has(application.id) ? 'bg-warning-50 border-l-4 border-l-warning-400' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(application.id)}
                            onChange={() => handleSelectOne(application.id)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {application.company.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{application.company}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">{application.website || 'No website'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-900 truncate max-w-[120px]">{application.position}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[120px]">{application.contactPerson || 'No contact'}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center">
                          <MapPinIcon className="w-3 h-3 text-gray-400 mr-1 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate max-w-[100px]">{application.location}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                          {application.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-gray-900">
                          {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {application.appliedDate ? formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true }) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
                          {application.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="text-primary-600 hover:text-primary-900 transition-colors duration-150 p-1"
                            title="View details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(application)}
                            className="text-warning-600 hover:text-warning-900 transition-colors duration-150 p-1"
                            title="Edit application"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(application.id)}
                            className="text-danger-600 hover:text-danger-900 transition-colors duration-150 p-1"
                            title="Delete application"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Scroll Indicator */}
          <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span className="font-medium">Total: {applications.length} applications</span>
              <div className="flex items-center space-x-3">
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                <span className="font-medium">Scroll horizontally to see all columns</span>
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
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
              <button className="btn-primary">
                Add Application
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Application Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Application Details</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.company}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.position}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.location}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.priority}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Applied Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedApplication.appliedDate ? new Date(selectedApplication.appliedDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.contactEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplication.website || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Interview Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedApplication.interviewDate ? new Date(selectedApplication.interviewDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleEdit(selectedApplication)}
                className="btn-primary"
              >
                Edit Application
              </button>
              <button
                onClick={() => setSelectedApplication(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {isEditModalOpen && selectedApplication && (
        <EditApplicationModal
          application={selectedApplication}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedApplication(null)
          }}
        />
      )}
    </div>
  )
}
