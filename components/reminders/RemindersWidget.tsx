'use client'

import React from 'react'
import { useReminders } from '@/lib/hooks/useReminders'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/LoadingStates'
import { formatDistanceToNow, isPast } from 'date-fns'
import { REMINDER_TYPE_ICONS } from '@/types/reminder'
import Link from 'next/link'

interface RemindersWidgetProps {
  className?: string
  maxItems?: number
}

export function RemindersWidget({ className = '', maxItems = 3 }: RemindersWidgetProps) {
  const {
    upcomingReminders,
    overdueReminders,
    loading,
    completeReminder
  } = useReminders()

  // Combine and sort reminders by due date
  const allActiveReminders = [...upcomingReminders, ...overdueReminders]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, maxItems)

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Reminders</h3>
        <LoadingStates.SkeletonCard count={2} />
      </div>
    )
  }

  if (allActiveReminders.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Reminders</h3>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-500 text-sm">You're all caught up!</p>
          <p className="text-gray-400 text-xs mt-1">No upcoming reminders</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Reminders</h3>
        <Link href="/reminders">
          <Button size="sm" variant="outline">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {allActiveReminders.map((reminder) => {
          const dueDate = new Date(reminder.dueDate)
          const isOverdue = isPast(dueDate)
          
          return (
            <div
              key={reminder.id}
              className={`p-3 rounded-lg border ${
                isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">
                      {REMINDER_TYPE_ICONS[reminder.reminderType]}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {reminder.title}
                  </h4>
                  
                  {reminder.application && (
                    <p className="text-xs text-gray-500 truncate">
                      {reminder.application.company}
                    </p>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    isOverdue ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(dueDate, { addSuffix: true })}
                  </p>
                </div>
                
                <Button
                  onClick={() => completeReminder(reminder.id)}
                  size="sm"
                  className="ml-2 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
                >
                  ✓
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {overdueReminders.length > 0 && (
              <span className="text-red-600 font-medium">
                {overdueReminders.length} overdue
              </span>
            )}
            {overdueReminders.length > 0 && upcomingReminders.length > 0 && (
              <span className="text-gray-400"> • </span>
            )}
            {upcomingReminders.length > 0 && (
              <span className="text-blue-600 font-medium">
                {upcomingReminders.length} upcoming
              </span>
            )}
          </span>
          
          <Link href="/reminders">
            <span className="text-blue-600 hover:text-blue-700 text-xs font-medium">
              Manage all →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}