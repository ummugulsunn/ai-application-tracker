import { useState, useEffect, useCallback } from 'react'
import { Reminder, ReminderStats, CreateReminderData, UpdateReminderData, ReminderFilters } from '@/types/reminder'

interface UseRemindersReturn {
  reminders: Reminder[]
  stats: ReminderStats | null
  upcomingReminders: Reminder[]
  overdueReminders: Reminder[]
  loading: boolean
  error: string | null
  createReminder: (data: CreateReminderData) => Promise<boolean>
  updateReminder: (id: string, data: UpdateReminderData) => Promise<boolean>
  deleteReminder: (id: string) => Promise<boolean>
  completeReminder: (id: string) => Promise<boolean>
  snoozeReminder: (id: string, hours: number) => Promise<boolean>
  refreshReminders: () => Promise<void>
  refreshStats: () => Promise<void>
}

export function useReminders(filters?: ReminderFilters): UseRemindersReturn {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [stats, setStats] = useState<ReminderStats | null>(null)
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [overdueReminders, setOverdueReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters?.includeCompleted) {
        params.append('includeCompleted', 'true')
      }
      if (filters?.applicationId) {
        params.append('applicationId', filters.applicationId)
      }
      if (filters?.reminderType) {
        params.append('type', filters.reminderType)
      }

      const response = await fetch(`/api/reminders?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch reminders')
      }

      setReminders(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching reminders:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchUpcomingReminders = useCallback(async (days: number = 7) => {
    try {
      const response = await fetch(`/api/reminders/upcoming?days=${days}`)
      const data = await response.json()

      if (data.success) {
        setUpcomingReminders(data.data)
      }
    } catch (err) {
      console.error('Error fetching upcoming reminders:', err)
    }
  }, [])

  const fetchOverdueReminders = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders/overdue')
      const data = await response.json()

      if (data.success) {
        setOverdueReminders(data.data)
      }
    } catch (err) {
      console.error('Error fetching overdue reminders:', err)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/reminders/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Error fetching reminder stats:', err)
    }
  }, [])

  const createReminder = useCallback(async (data: CreateReminderData): Promise<boolean> => {
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          dueDate: data.dueDate.toISOString()
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create reminder')
      }

      // Refresh reminders after creation
      await fetchReminders()
      await fetchStats()
      await fetchUpcomingReminders()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder')
      return false
    }
  }, [fetchReminders, fetchStats, fetchUpcomingReminders])

  const updateReminder = useCallback(async (id: string, data: UpdateReminderData): Promise<boolean> => {
    try {
      const updateData = { ...data }
      if (data.dueDate) {
        updateData.dueDate = data.dueDate.toISOString() as any
      }

      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update reminder')
      }

      // Refresh reminders after update
      await fetchReminders()
      await fetchStats()
      await fetchUpcomingReminders()
      await fetchOverdueReminders()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update reminder')
      return false
    }
  }, [fetchReminders, fetchStats, fetchUpcomingReminders, fetchOverdueReminders])

  const deleteReminder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete reminder')
      }

      // Refresh reminders after deletion
      await fetchReminders()
      await fetchStats()
      await fetchUpcomingReminders()
      await fetchOverdueReminders()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reminder')
      return false
    }
  }, [fetchReminders, fetchStats, fetchUpcomingReminders, fetchOverdueReminders])

  const completeReminder = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reminders/${id}/complete`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to complete reminder')
      }

      // Refresh reminders after completion
      await fetchReminders()
      await fetchStats()
      await fetchUpcomingReminders()
      await fetchOverdueReminders()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete reminder')
      return false
    }
  }, [fetchReminders, fetchStats, fetchUpcomingReminders, fetchOverdueReminders])

  const snoozeReminder = useCallback(async (id: string, hours: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/reminders/${id}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to snooze reminder')
      }

      // Refresh reminders after snoozing
      await fetchReminders()
      await fetchUpcomingReminders()
      await fetchOverdueReminders()

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to snooze reminder')
      return false
    }
  }, [fetchReminders, fetchUpcomingReminders, fetchOverdueReminders])

  const refreshReminders = useCallback(async () => {
    await fetchReminders()
  }, [fetchReminders])

  const refreshStats = useCallback(async () => {
    await fetchStats()
  }, [fetchStats])

  // Initial data fetch
  useEffect(() => {
    fetchReminders()
    fetchStats()
    fetchUpcomingReminders()
    fetchOverdueReminders()
  }, [fetchReminders, fetchStats, fetchUpcomingReminders, fetchOverdueReminders])

  return {
    reminders,
    stats,
    upcomingReminders,
    overdueReminders,
    loading,
    error,
    createReminder,
    updateReminder,
    deleteReminder,
    completeReminder,
    snoozeReminder,
    refreshReminders,
    refreshStats,
  }
}