'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { Application } from '@/types/application'
import { toast } from 'react-hot-toast'

interface EditApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
}

export default function EditApplicationModal({ isOpen, onClose, application }: EditApplicationModalProps) {
  const { updateApplication } = useApplicationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    type: 'Full-time' as Application['type'],
    salary: '',
    status: 'Pending' as Application['status'],
    appliedDate: '',
    responseDate: '',
    interviewDate: '',
    notes: '',
    contactPerson: '',
    contactEmail: '',
    website: '',
    tags: '',
    priority: 'Medium' as Application['priority'],
    jobUrl: '',
    jobDescription: '',
    companyWebsite: ''
  })

  // Initialize form data when application changes
  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company || '',
        position: application.position || '',
        location: application.location || '',
        type: application.type || 'Full-time',
        salary: application.salary || '',
        status: application.status || 'Pending',
        appliedDate: application.appliedDate || '',
        responseDate: application.responseDate || '',
        interviewDate: application.interviewDate || '',
        notes: application.notes || '',
        contactPerson: application.contactPerson || '',
        contactEmail: application.contactEmail || '',
        website: application.website || '',
        tags: Array.isArray(application.tags) ? application.tags.join(', ') : '',
        priority: application.priority || 'Medium',
        jobUrl: application.jobUrl || '',
        jobDescription: application.jobDescription || '',
        companyWebsite: application.companyWebsite || ''
      })
    }
  }, [application])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!application || !formData.company || !formData.position) {
      toast.error('Company and Position are required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const updatedApplication: Partial<Application> = {
        company: formData.company.trim(),
        position: formData.position.trim(),
        location: formData.location.trim(),
        type: formData.type,
        salary: formData.salary.trim(),
        status: formData.status,
        appliedDate: formData.appliedDate || new Date().toISOString().split('T')[0],
        responseDate: formData.responseDate || null,
        interviewDate: formData.interviewDate || null,
        notes: formData.notes.trim(),
        contactPerson: formData.contactPerson.trim(),
        contactEmail: formData.contactEmail.trim(),
        website: formData.website.trim(),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        priority: formData.priority,
        jobUrl: formData.jobUrl.trim(),
        jobDescription: formData.jobDescription.trim(),
        companyWebsite: formData.companyWebsite.trim(),
        requirements: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      }

      updateApplication(application.id, updatedApplication)
      toast.success('Application updated successfully!')
      onClose()
    } catch (error) {
      toast.error('Failed to update application. Please try again.')
      console.error('Error updating application:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!application) return null

  return (
    <AnimatePresence>
      {isOpen && (
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
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Edit Application</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {application.company} - {application.position}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Company Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Spotify, Google, Microsoft"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Software Engineer, Data Scientist"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Stockholm, Sweden or Remote"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employment Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="input-field"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary/Compensation
                      </label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        className="input-field"
                        placeholder="e.g., 50,000 EUR/year, 15,000 SEK/month"
                      />
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                      Application Details
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="input-field"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offered">Offered</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Applied Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.appliedDate}
                        onChange={(e) => handleInputChange('appliedDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Response Date
                      </label>
                      <input
                        type="date"
                        value={formData.responseDate}
                        onChange={(e) => handleInputChange('responseDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interview Date
                      </label>
                      <input
                        type="date"
                        value={formData.interviewDate}
                        onChange={(e) => handleInputChange('interviewDate', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="input-field"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className="input-field"
                        placeholder="e.g., Sarah Johnson, HR Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="input-field"
                        placeholder="e.g., careers@company.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job URL
                      </label>
                      <input
                        type="url"
                        value={formData.jobUrl}
                        onChange={(e) => handleInputChange('jobUrl', e.target.value)}
                        className="input-field"
                        placeholder="e.g., https://linkedin.com/jobs/view/123456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Website
                      </label>
                      <input
                        type="url"
                        value={formData.companyWebsite}
                        onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                        className="input-field"
                        placeholder="e.g., https://company.com/careers"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        className="input-field"
                        placeholder="e.g., React, Python, Remote, Sweden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate tags with commas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Job Description and Notes */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={formData.jobDescription}
                      onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                      rows={3}
                      className="input-field"
                      placeholder="Brief job description or key requirements..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="input-field"
                      placeholder="Additional notes about the application, requirements, or your thoughts..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200 space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>Update Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}