'use client'

import React, { useState } from 'react'
import { Reminder, REMINDER_TYPE_LABELS, REMINDER_TYPE_COLORS, REMINDER_TYPE_ICONS } from '@/types/reminder'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow, isPast, format } from 'date-fns'

interface ReminderCardProps {
  reminder: Reminder
  onComplete: () => Promise<boolean>
  onSnooze: (hours: number) => Promise<boolean>
  onDelete: () => Promise<boolean>
  className?: string
}

export function ReminderCard({ 
  reminder, 
  onComplete, 
  onSnooze, 
  onDelete, 
  className = '' 
}: ReminderCardProps) {
  const [loading, setLoading] = useState(false)
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)

  const dueDate = new Date(reminder.dueDate)
  const isOverdue = isPast(dueDate) && !reminder.isCompleted
  const isCompleted = reminder.isCompleted

  const handleComplete = async () => {
    setLoading(true)
    try {
      await onComplete()
    } finally {
      setLoading(false)
    }
  }

  const handleSnooze = async (hours: number) => {
    setLoading(true)
    try {
      await onSnooze(hours)
      setShowSnoozeOptions(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setLoading(true)
      try {
        await onDelete()
      } finally {
        setLoading(false)
      }
    }
  }

  const snoozeOptions = [
    { label: '1 hour', hours: 1 },
    { label: '4 hours', hours: 4 },
    { label: '1 day', hours: 24 },
    { label: '3 days', hours: 72 },
    { label: '1 week', hours: 168 }
  ]

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-6 ${className} ${
      isCompleted ? 'opacity-60' : ''
    } ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-lg">
              {REMINDER_TYPE_ICONS[reminder.reminderType]}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              REMINDER_TYPE_COLORS[reminder.reminderType]
            }`}>
              {REMINDER_TYPE_LABELS[reminder.reminderType]}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Completed
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-lg font-semibold mb-2 ${
            isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {reminder.title}
          </h3>

          {/* Description */}
          {reminder.description && (
            <p className="text-gray-600 mb-3">
              {reminder.description}
            </p>
          )}

          {/* Application Info */}
          {reminder.application && (
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-sm text-gray-500">Application:</span>
              <span className="text-sm font-medium text-gray-900">
                {reminder.application.position} at {reminder.application.company}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                reminder.application.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                reminder.application.status === 'Interviewing' ? 'bg-yellow-100 text-yellow-800' :
                reminder.application.status === 'Offered' ? 'bg-green-100 text-green-800' :
                reminder.application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {reminder.application.status}
              </span>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Due:</span>
            <span className={`font-medium ${
              isOverdue ? 'text-red-600' : 'text-gray-900'
            }`}>
              {format(dueDate, 'MMM d, yyyy \'at\' h:mm a')}
            </span>
            <span className={`text-xs ${
              isOverdue ? 'text-red-500' : 'text-gray-500'
            }`}>
              ({formatDistanceToNow(dueDate, { addSuffix: true })})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 ml-4">
          {!isCompleted && (
            <>
              <Button
                onClick={handleComplete}
                disabled={loading}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? '...' : '✓ Complete'}
              </Button>
              
              <div className="relative">
                <Button
                  onClick={() => setShowSnoozeOptions(!showSnoozeOptions)}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  💤 Snooze
                </Button>
                
                {showSnoozeOptions && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {snoozeOptions.map((option) => (
                        <button
                          key={option.hours}
                          onClick={() => handleSnooze(option.hours)}
                          disabled={loading}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <Button
            onClick={handleDelete}
            disabled={loading}
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Click outside to close snooze options */}
      {showSnoozeOptions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowSnoozeOptions(false)}
        />
      )}
    </div>
  )
}