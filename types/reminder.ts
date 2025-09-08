export interface Reminder {
  id: string
  userId: string
  applicationId: string | null
  reminderType: 'follow_up' | 'interview_prep' | 'deadline' | 'custom'
  title: string
  description: string | null
  dueDate: string
  isCompleted: boolean
  createdAt: string
  application?: {
    id: string
    company: string
    position: string
    status: string
  } | null
}

export interface ReminderStats {
  total: number
  completed: number
  overdue: number
  upcoming: number
  completionRate: number
}

export interface CreateReminderData {
  applicationId?: string
  reminderType: 'follow_up' | 'interview_prep' | 'deadline' | 'custom'
  title: string
  description?: string
  dueDate: Date
}

export interface UpdateReminderData {
  applicationId?: string
  reminderType?: 'follow_up' | 'interview_prep' | 'deadline' | 'custom'
  title?: string
  description?: string
  dueDate?: Date
  isCompleted?: boolean
}

export interface ReminderFilters {
  includeCompleted: boolean
  applicationId?: string
  reminderType?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export const REMINDER_TYPE_LABELS = {
  follow_up: 'Follow Up',
  interview_prep: 'Interview Prep',
  deadline: 'Deadline',
  custom: 'Custom'
} as const

export const REMINDER_TYPE_COLORS = {
  follow_up: 'bg-blue-100 text-blue-800',
  interview_prep: 'bg-green-100 text-green-800',
  deadline: 'bg-red-100 text-red-800',
  custom: 'bg-gray-100 text-gray-800'
} as const

export const REMINDER_TYPE_ICONS = {
  follow_up: '📧',
  interview_prep: '🎯',
  deadline: '⏰',
  custom: '📝'
} as const