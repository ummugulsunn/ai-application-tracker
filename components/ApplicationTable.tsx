'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChevronUpDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { Application, SortOptions } from '@/types/application'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

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

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Company</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Position</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('appliedDate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Applied</span>
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {applications.map((application, index) => (
                  <motion.tr
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.company}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.type}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.position}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.salary}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.location}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(application.appliedDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true })}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(application.priority)}`}>
                        {application.priority}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application)
                            setIsViewModalOpen(true)
                          }}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                          title="View details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedApplication(application)
                            setIsEditModalOpen(true)
                          }}
                          className="text-warning-600 hover:text-warning-900 transition-colors"
                          title="Edit application"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(application.id)}
                          className="text-danger-600 hover:text-danger-900 transition-colors"
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
                      {new Date(selectedApplication.appliedDate).toLocaleDateString()}
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
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
