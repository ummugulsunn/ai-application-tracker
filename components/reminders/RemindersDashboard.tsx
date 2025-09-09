'use client'

import React, { useState } from 'react'
import { useReminders } from '@/lib/hooks/useReminders'
import { ReminderCard } from './ReminderCard'
import { CreateReminderModal } from './CreateReminderModal'
import { ReminderStats } from './ReminderStats'
import { Button } from '@/components/ui/Button'
import { PageLoading } from '@/components/ui/LoadingStates'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorNotification } from '@/components/ui/ErrorNotification'
import { Reminder, ReminderFilters } from '@/types/reminder'

interface RemindersDashboardProps {
  className?: string
}

export function RemindersDashboard({ className = '' }: RemindersDashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState<ReminderFilters>({
    includeCompleted: false
  })
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue'>('all')

  const {
    reminders,
    stats,
    upcomingReminders,
    overdueReminders,
    loading,
    error,
    createReminder,
    completeReminder,
    snoozeReminder,
    deleteReminder,
    refreshReminders
  } = useReminders(filters)

  const handleCreateReminder = async (data: any) => {
    const success = await createReminder(data)
    if (success) {
      setShowCreateModal(false)
    }
    return success
  }

  const getDisplayedReminders = (): Reminder[] => {
    switch (activeTab) {
      case 'upcoming':
        return upcomingReminders
      case 'overdue':
        return overdueReminders
      default:
        return reminders
    }
  }

  const displayedReminders = getDisplayedReminders()

  if (loading && reminders.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
        </div>
        <LoadingStates.SkeletonCard count={3} />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <span className="mr-2">+</span>
          Add Reminder
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorNotification
          message={error}
          onRetry={refreshReminders}
          onDismiss={() => {}}
        />
      )}

      {/* Stats */}
      {stats && <ReminderStats stats={stats} />}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Reminders
            {reminders.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {reminders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming
            {upcomingReminders.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-900 py-0.5 px-2.5 rounded-full text-xs">
                {upcomingReminders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overdue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overdue
            {overdueReminders.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-900 py-0.5 px-2.5 rounded-full text-xs">
                {overdueReminders.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.includeCompleted}
            onChange={(e) => setFilters(prev => ({ ...prev, includeCompleted: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Show completed</span>
        </label>
      </div>

      {/* Reminders List */}
      {displayedReminders.length === 0 ? (
        <EmptyState
          icon="📅"
          title={
            activeTab === 'overdue' 
              ? "No overdue reminders" 
              : activeTab === 'upcoming'
              ? "No upcoming reminders"
              : "No reminders yet"
          }
          description={
            activeTab === 'all'
              ? "Create your first reminder to stay on top of your job applications."
              : activeTab === 'upcoming'
              ? "You're all caught up! No reminders due in the next 7 days."
              : "Great job! You don't have any overdue reminders."
          }
          action={
            activeTab === 'all' ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create First Reminder
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {displayedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={() => completeReminder(reminder.id)}
              onSnooze={(hours) => snoozeReminder(reminder.id, hours)}
              onDelete={() => deleteReminder(reminder.id)}
            />
          ))}
        </div>
      )}

      {/* Create Reminder Modal */}
      {showCreateModal && (
        <CreateReminderModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReminder}
        />
      )}
    </div>
  )
}