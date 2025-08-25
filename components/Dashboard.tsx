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
  const { getStats, isInitialized, applications, forceReinitialize } = useApplicationStore()
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

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Debug:', { isInitialized, applicationsLength: applications.length, isLoading })
  }, [isInitialized, applications.length, isLoading])

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
    <div className="space-y-8 mb-8">
      {/* Dashboard Header - More prominent and organized */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">
              Track your job applications and analyze your success patterns
            </p>
            <div className="flex items-center mt-3 text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={refreshStats}
              className="btn-secondary flex items-center space-x-2 px-4 py-2"
              title="Refresh dashboard data"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Data</span>
            </button>
            
            <button
              onClick={forceReinitialize}
              className="btn-secondary flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              title="Force reinitialize data"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Force Reinit</span>
            </button>
            
            <div className="text-center bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
              <div className="text-sm text-primary-600 font-medium">Total Applications</div>
              <div className="text-4xl font-bold text-primary-700">{stats.total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Cards - Better organized grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subtitle}</p>
              </div>
              <div className={`p-4 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-200 relative`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                {stat.trend === 'positive' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586l5.293-5.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add subtle progress indicator for active metrics */}
            {stat.title === 'Active Applications' && stats.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((stats.pending + stats.applied + stats.interviewing) / stats.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-warning-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.pending + stats.applied + stats.interviewing) / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Status Breakdown and Insights - Side by side for better visibility */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown - Left Column */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Application Status</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-gray-900">{item.count}</span>
                    <span className="text-sm text-gray-500 ml-2">({item.percentage}%)</span>
                  </div>
                </div>
                {item.count > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${item.color.replace('bg-', 'bg-').replace('-500', '-400')}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Insights - Right Column */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Top Insights</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Top Companies */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-2" />
                Top Companies
              </h4>
              <div className="space-y-2">
                {stats.topCompanies.length > 0 ? (
                  stats.topCompanies.slice(0, 3).map((company, index) => {
                    const companyApps = applications.filter(app => app.company === company)
                    const companyCount = companyApps.length
                    const companyStatuses = companyApps.reduce((acc, app) => {
                      acc[app.status] = (acc[app.status] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    return (
                      <div key={company} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            #{index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{company}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900">{companyCount}</span>
                          {companyStatuses['Accepted'] && (
                            <div className="text-xs text-green-600 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {companyStatuses['Accepted']}
                            </div>
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
              <div className="space-y-2">
                {stats.topLocations.length > 0 ? (
                  stats.topLocations.slice(0, 3).map((location, index) => {
                    const locationApps = applications.filter(app => app.location === location)
                    const locationCount = locationApps.length
                    const locationStatuses = locationApps.reduce((acc, app) => {
                      acc[app.status] = (acc[app.status] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    return (
                      <div key={location} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            #{index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-gray-900">{locationCount}</span>
                          {locationStatuses['Accepted'] && (
                            <div className="text-xs text-green-600 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {locationStatuses['Accepted']}
                            </div>
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
          </div>
        </motion.div>
      </div>

      {/* Quick Actions - More prominent and engaging */}
      <motion.div 
        className="bg-gradient-to-r from-primary-50 via-blue-50 to-indigo-50 rounded-xl border border-primary-200 p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-primary-900 mb-3">
            Ready to boost your job search?
          </h3>
          <p className="text-primary-700 mb-6 text-lg">
            Track your applications, analyze your success patterns, and get AI-powered insights
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-primary px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Application
            </button>
            <button className="btn-secondary px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </button>
          </div>
        </div>
      </motion.div>

      {/* Debug Information - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div 
          className="bg-gray-50 rounded-xl border border-gray-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <details className="text-left">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Debug: Raw Stats Data
            </summary>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs text-gray-600">
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Total: {stats.total}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Pending: {stats.pending}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Applied: {stats.applied}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Interviewing: {stats.interviewing}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Offered: {stats.offered}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Rejected: {stats.rejected}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Accepted: {stats.accepted}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Success Rate: {stats.successRate}%</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">Avg Response: {stats.averageResponseTime} days</div>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <div className="font-medium text-gray-800">With Response: {stats.applied + stats.interviewing + stats.offered + stats.rejected + stats.accepted}</div>
              </div>
            </div>
          </details>
        </motion.div>
      )}
    </div>
  )
}
