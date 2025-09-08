'use client'

import React from 'react'
import { ReminderStats as ReminderStatsType } from '@/types/reminder'

interface ReminderStatsProps {
  stats: ReminderStatsType
  className?: string
}

export function ReminderStats({ stats, className = '' }: ReminderStatsProps) {
  const statItems = [
    {
      label: 'Total Reminders',
      value: stats.total,
      icon: '📅',
      color: 'text-gray-600'
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: '✅',
      color: 'text-green-600'
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: '⚠️',
      color: 'text-red-600'
    },
    {
      label: 'Upcoming',
      value: stats.upcoming,
      icon: '⏰',
      color: 'text-blue-600'
    }
  ]

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminder Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completion Rate</span>
          <span className="text-sm font-bold text-gray-900">{stats.completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              stats.completionRate >= 80 ? 'bg-green-500' :
              stats.completionRate >= 60 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {stats.completionRate >= 80 ? 'Excellent job staying on track!' :
           stats.completionRate >= 60 ? 'Good progress, keep it up!' :
           'Consider setting fewer reminders or adjusting your schedule.'}
        </div>
      </div>
    </div>
  )
}