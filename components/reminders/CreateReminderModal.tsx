'use client'

import React, { useState, useEffect } from 'react'
import { CreateReminderData, REMINDER_TYPE_LABELS } from '@/types/reminder'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Application } from '@/types/application'

interface CreateReminderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateReminderData) => Promise<boolean>
  preselectedApplicationId?: string
}

export function CreateReminderModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  preselectedApplicationId 
}: CreateReminderModalProps) {
  const [formData, setFormData] = useState<CreateReminderData>({
    reminderType: 'follow_up',
    title: '',
    description: '',
    dueDate: new Date()
  })
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch applications for the dropdown
  useEffect(() => {
    if (isOpen) {
      fetchApplications()
    }
  }, [isOpen])

  // Set preselected application
  useEffect(() => {
    if (preselectedApplicationId) {
      setFormData(prev => ({ ...prev, applicationId: preselectedApplicationId }))
    }
  }, [preselectedApplicationId])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications')
      const data = await response.json()
      
      if (data.success) {
        setApplications(data.data)
      }
    } catch (err) {
      console.error('Error fetching applications:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const success = await onSubmit(formData)
      if (success) {
        // Reset form
        setFormData({
          reminderType: 'follow_up',
          title: '',
          description: '',
          dueDate: new Date()
        })
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  const handleReminderTypeChange = (type: CreateReminderData['reminderType']) => {
    setFormData(prev => ({ 
      ...prev, 
      reminderType: type,
      title: generateDefaultTitle(type, prev.applicationId)
    }))
  }

  const generateDefaultTitle = (type: CreateReminderData['reminderType'], applicationId?: string) => {
    const application = applications.find(app => app.id === applicationId)
    const company = application ? ` - ${application.company}` : ''
    
    switch (type) {
      case 'follow_up':
        return `Follow up on application${company}`
      case 'interview_prep':
        return `Prepare for interview${company}`
      case 'deadline':
        return `Application deadline${company}`
      case 'custom':
        return ''
      default:
        return ''
    }
  }

  const handleApplicationChange = (applicationId: string) => {
    setFormData(prev => ({
      ...prev,
      applicationId: applicationId || undefined,
      title: generateDefaultTitle(prev.reminderType, applicationId)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Reminder</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reminder Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Type
              </label>
              <select
                value={formData.reminderType}
                onChange={(e) => handleReminderTypeChange(e.target.value as CreateReminderData['reminderType'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(REMINDER_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Application */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application (Optional)
              </label>
              <select
                value={formData.applicationId || ''}
                onChange={(e) => handleApplicationChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an application...</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.position} at {app.company}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter reminder title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.dueDate.toISOString().slice(0, 16)}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Reminder'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}