'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
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
import { toast } from 'react-hot-toast'

export default function Dashboard() {
  const { getStats, isInitialized, applications } = useApplicationStore()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    applied: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    accepted: 0,
    successRate: 0,
    averageResponseTime: 0,
    topCompanies: [] as string[],
    topLocations: [] as string[]
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Function to refresh stats
  const refreshStats = () => {
    const newStats = getStats()
    setStats(newStats)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    if (isInitialized) {
      refreshStats()
      setIsLoading(false)
    }
  }, [isInitialized, getStats])

  // Update stats when applications change
  useEffect(() => {
    if (isInitialized && applications.length > 0) {
      refreshStats()
    }
  }, [applications, isInitialized, getStats])

  // Don't render until store is initialized to prevent hydration mismatch
  if (isLoading || !isInitialized) {
    return (
      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="card animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="p-3 rounded-full bg-gray-200">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      subtitle: 'All time',
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.total > 0 ? 'active' : 'neutral'
    },
    {
      title: 'Active Applications',
      value: stats.pending + stats.applied + stats.interviewing,
      subtitle: 'In progress',
      icon: ClockIcon,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
      trend: (stats.pending + stats.applied + stats.interviewing) > 0 ? 'active' : 'neutral'
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      subtitle: 'Applications accepted',
      icon: CheckCircleIcon,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
      trend: stats.successRate > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Avg Response Time',
      value: stats.averageResponseTime > 0 ? `${stats.averageResponseTime} days` : 'N/A',
      subtitle: 'Company response time',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: stats.averageResponseTime > 0 ? 'active' : 'neutral'
    }
  ]

  const statusBreakdown = [
    { status: 'Pending', count: stats.pending, color: 'bg-warning-500', percentage: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0 },
    { status: 'Applied', count: stats.applied, color: 'bg-primary-500', percentage: stats.total > 0 ? Math.round((stats.applied / stats.total) * 100) : 0 },
    { status: 'Interviewing', count: stats.interviewing, color: 'bg-blue-500', percentage: stats.total > 0 ? Math.round((stats.interviewing / stats.total) * 100) : 0 },
    { status: 'Offered', count: stats.offered, color: 'bg-success-500', percentage: stats.total > 0 ? Math.round((stats.offered / stats.total) * 100) : 0 },
    { status: 'Rejected', count: stats.rejected, color: 'bg-danger-500', percentage: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0 },
    { status: 'Accepted', count: stats.accepted, color: 'bg-success-600', percentage: stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0 }
  ]

  return (
    <div className="space-y-6 mb-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshStats}
            className="btn-secondary flex items-center space-x-2 text-sm"
            title="Refresh dashboard data"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Applications</div>
            <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
              <div className={`p-4 rounded-full ${stat.bgColor} relative`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                {stat.trend === 'positive' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Breakdown</h3>
          <div className="space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
                {item.count > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color.replace('bg-', 'bg-').replace('-500', '-400')}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                )}
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
            <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
              <BriefcaseIcon className="w-4 h-4 mr-2" />
              Top Companies
            </h4>
            <div className="space-y-3">
              {stats.topCompanies.length > 0 ? (
                stats.topCompanies.map((company, index) => {
                  const companyApps = applications.filter(app => app.company === company)
                  const companyCount = companyApps.length
                  const companyStatuses = companyApps.reduce((acc, app) => {
                    acc[app.status] = (acc[app.status] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  return (
                    <div key={company} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{company}</p>
                          <p className="text-xs text-gray-500">{companyCount} application{companyCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{companyCount}</div>
                        {companyStatuses['Accepted'] && (
                          <div className="text-xs text-green-600">✓ {companyStatuses['Accepted']} accepted</div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No company data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Locations */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              Top Locations
            </h4>
            <div className="space-y-3">
              {stats.topLocations.length > 0 ? (
                stats.topLocations.map((location, index) => {
                  const locationApps = applications.filter(app => app.location === location)
                  const locationCount = locationApps.length
                  const locationStatuses = locationApps.reduce((acc, app) => {
                    acc[app.status] = (acc[app.status] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  return (
                    <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{location}</p>
                          <p className="text-xs text-gray-500">{locationCount} application{locationCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{locationCount}</div>
                        {locationStatuses['Accepted'] && (
                          <div className="text-xs text-green-600">✓ {locationStatuses['Accepted']} accepted</div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No location data yet</p>
                </div>
              )}
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

      {/* Debug Information - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div 
          className="card bg-gray-50 border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <details className="text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
              🔍 Debug: Raw Stats Data
            </summary>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Total: {stats.total}</div>
              <div>Pending: {stats.pending}</div>
              <div>Applied: {stats.applied}</div>
              <div>Interviewing: {stats.interviewing}</div>
              <div>Offered: {stats.offered}</div>
              <div>Rejected: {stats.rejected}</div>
              <div>Accepted: {stats.accepted}</div>
              <div>Success Rate: {stats.successRate}%</div>
              <div>Avg Response Time: {stats.averageResponseTime} days</div>
              <div>Applications with Response: {stats.applied + stats.interviewing + stats.offered + stats.rejected + stats.accepted}</div>
            </div>
          </details>
        </motion.div>
      )}
    </div>
  )
}
