import { Metadata } from 'next'
import { RemindersDashboard } from '@/components/reminders/RemindersDashboard'

export const metadata: Metadata = {
  title: 'Reminders - AI Application Tracker',
  description: 'Manage your job application reminders and stay on top of follow-ups, interviews, and deadlines.',
}

export default function RemindersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RemindersDashboard />
      </div>
    </div>
  )
}