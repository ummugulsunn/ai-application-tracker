'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/Button'
import { ErrorHandler } from '@/lib/errorHandling'

interface ErrorStats {
  total: number
  bySeverity: Record<string, number>
  byCategory: Record<string, number>
  byCode: Record<string, number>
  timeline: Array<{ time: string; count: number }>
}

interface ErrorReport {
  error: {
    id: string
    category: string
    severity: string
    code: string
    message: string
    userMessage: string
    timestamp: string
    context?: string
  }
  userAgent: string
  url: string
  userId?: string
  sessionId?: string
  receivedAt: string
}

export function ErrorMonitor() {
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [recentErrors, setRecentErrors] = useState<ErrorReport[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('24h')
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null)
  const [localStats, setLocalStats] = useState<any>(null)

  useEffect(() => {
    loadErrorData()
    loadLocalStats()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadErrorData, 30000)
    return () => clearInterval(interval)
  }, [timeframe, selectedSeverity])

  const loadErrorData = async () => {
    try {
      const params = new URLSearchParams({
        timeframe,
        ...(selectedSeverity && { severity: selectedSeverity }),
      })
      
      const response = await fetch(`/api/errors?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentErrors(data.recentErrors || [])
      }
    } catch (error) {
      console.error('Failed to load error data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalStats = () => {
    const errorHandler = ErrorHandler.getInstance()
    const localErrorStats = errorHandler.getErrorStatistics()
    setLocalStats(localErrorStats)
  }

  const exportErrorData = () => {
    const exportData = {
      serverStats: stats,
      recentServerErrors: recentErrors,
      localStats,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-monitor-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading error data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Error Monitor</h2>
          <p className="text-gray-600">Monitor and analyze application errors</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button onClick={exportErrorData} variant="outline" size="sm">
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          
          <Button onClick={loadErrorData} variant="outline" size="sm">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Critical Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.bySeverity?.critical || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Recent Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {localStats?.recent || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Local Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {localStats?.total || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Severity */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">By Severity</h3>
          <div className="space-y-3">
            {Object.entries(stats?.bySeverity || {}).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
                    {severity}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(stats?.byCategory || {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{category}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Timeline */}
      {stats?.timeline && stats.timeline.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Error Timeline</h3>
          <div className="h-32 flex items-end space-x-1">
            {stats.timeline.map((point, index) => {
              const maxCount = Math.max(...stats.timeline.map(p => p.count))
              const height = maxCount > 0 ? (point.count / maxCount) * 100 : 0
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-blue-200 rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${point.count} errors at ${new Date(point.time).toLocaleTimeString()}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Errors */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Errors</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentErrors.length > 0 ? (
            recentErrors.map((report) => (
              <motion.div
                key={report.error.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.error.severity)}`}>
                        {report.error.severity}
                      </span>
                      <span className="text-sm text-gray-500">{report.error.code}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{report.error.category}</span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {report.error.userMessage}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {report.error.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {formatTimeAgo(report.receivedAt)}
                      </span>
                      
                      {report.userId && (
                        <span className="flex items-center">
                          <UserIcon className="w-3 h-3 mr-1" />
                          User: {report.userId}
                        </span>
                      )}
                      
                      <span className="flex items-center">
                        <ComputerDesktopIcon className="w-3 h-3 mr-1" />
                        {new URL(report.url).pathname}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No recent errors found
            </div>
          )}
        </div>
      </div>

      {/* Local Error Statistics */}
      {localStats && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Local Client Errors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{localStats.total}</p>
            </div>
            <div>
              <p className="text-gray-600">Recent (1h)</p>
              <p className="text-xl font-bold text-gray-900">{localStats.recent}</p>
            </div>
            <div>
              <p className="text-gray-600">Critical</p>
              <p className="text-xl font-bold text-red-600">{localStats.bySeverity.critical || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Network</p>
              <p className="text-xl font-bold text-blue-600">{localStats.byCategory.network || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}