'use client'

import { Card } from '@/components/ui/Card'
import { Users, Building, AlertCircle, Calendar } from 'lucide-react'
import type { ContactStats as ContactStatsType } from '@/types/contact'

interface ContactStatsProps {
  stats: ContactStatsType
}

export function ContactStats({ stats }: ContactStatsProps) {
  const relationshipTypeColors = {
    recruiter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    colleague: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    mentor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    friend: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const connectionStrengthColors = {
    strong: 'bg-green-500',
    medium: 'bg-yellow-500',
    weak: 'bg-red-500'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Contacts */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Contacts
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalContacts}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      {/* Recent Contacts */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Recent Activity
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.recentContacts}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last 30 days
            </p>
          </div>
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      {/* Overdue Follow-ups */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Overdue Follow-ups
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.overdueFollowUps}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              90+ days ago
            </p>
          </div>
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </Card>

      {/* Top Companies */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Top Companies
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(stats.byCompany).length}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      {/* Relationship Types Breakdown */}
      <Card className="p-4 md:col-span-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Relationship Types
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.byRelationshipType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${relationshipTypeColors[type as keyof typeof relationshipTypeColors] || relationshipTypeColors.other}`}>
                  {type}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {count}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Connection Strength Breakdown */}
      <Card className="p-4 md:col-span-2">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
          Connection Strength
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.byConnectionStrength).map(([strength, count]) => {
            const percentage = stats.totalContacts > 0 ? (count / stats.totalContacts) * 100 : 0
            return (
              <div key={strength} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${connectionStrengthColors[strength as keyof typeof connectionStrengthColors] || 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {strength}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${connectionStrengthColors[strength as keyof typeof connectionStrengthColors] || 'bg-gray-400'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Top Companies List */}
      {Object.keys(stats.byCompany).length > 0 && (
        <Card className="p-4 lg:col-span-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Companies in Your Network
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(stats.byCompany)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 12)
              .map(([company, count]) => (
                <div key={company} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {company}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}