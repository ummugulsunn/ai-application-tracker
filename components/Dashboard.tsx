'use client'

import { motion } from 'framer-motion'
import { 
  BriefcaseIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { useApplicationStore } from '@/store/applicationStore'
import { formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const { getStats } = useApplicationStore()
  const stats = getStats()

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Response',
      value: stats.pending + stats.applied,
      icon: ClockIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: CheckCircleIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Avg Response Time',
      value: stats.averageResponseTime > 0 ? `${stats.averageResponseTime} days` : 'N/A',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  const statusBreakdown = [
    { status: 'Pending', count: stats.pending, color: 'bg-warning-500' },
    { status: 'Applied', count: stats.applied, color: 'bg-primary-500' },
    { status: 'Interviewing', count: stats.interviewing, color: 'bg-blue-500' },
    { status: 'Offered', count: stats.offered, color: 'bg-success-500' },
    { status: 'Rejected', count: stats.rejected, color: 'bg-danger-500' },
    { status: 'Accepted', count: stats.accepted, color: 'bg-success-600' }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Breakdown and Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
          <div className="space-y-3">
            {statusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Companies and Locations */}
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Insights</h3>
          
          {/* Top Companies */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <BriefcaseIcon className="w-4 h-4 mr-2" />
              Top Companies
            </h4>
            <div className="space-y-2">
              {stats.topCompanies.map((company, index) => (
                <div key={company} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{company}</span>
                  <span className="text-gray-500">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Locations */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Top Locations
            </h4>
            <div className="space-y-2">
              {stats.topLocations.map((location, index) => (
                <div key={location} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{location}</span>
                  <span className="text-gray-500">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div 
        className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            🚀 Ready to boost your job search?
          </h3>
          <p className="text-primary-700 mb-4">
            Track your applications, analyze your success patterns, and get AI-powered insights
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn-primary">
              Add New Application
            </button>
            <button className="btn-secondary">
              View Analytics
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
