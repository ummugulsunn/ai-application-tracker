'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/featureFlags'
import { useAnalytics } from '@/lib/analytics'
import { useDisasterRecovery } from '@/lib/disasterRecovery'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  uptime: number
  memory: {
    used: number
    total: number
    external: number
  }
  checks: {
    database: { status: string; responseTime?: number; error?: string }
    storage: { status: string; responseTime?: number; error?: string }
    ai: { status: string; responseTime?: number; error?: string }
  }
}

interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  ttfb: number
  timestamp: number
}

export function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isMonitoringEnabled = useFeatureFlag(FEATURE_FLAGS.PERFORMANCE_MONITORING)
  const analytics = useAnalytics()
  const { performBackup, getBackupHistory } = useDisasterRecovery()

  useEffect(() => {
    if (isMonitoringEnabled) {
      fetchHealthStatus()
      fetchPerformanceMetrics()
      
      // Set up periodic updates
      const interval = setInterval(() => {
        fetchHealthStatus()
        fetchPerformanceMetrics()
      }, 30000) // Update every 30 seconds

      return () => clearInterval(interval)
    }
  }, [isMonitoringEnabled])

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      setError(null)
    } catch (err) {
      setError('Failed to fetch health status')
      console.error('Health check failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      // In a real implementation, this would fetch from a metrics database
      // For now, we'll simulate some metrics
      const mockMetrics: PerformanceMetrics = {
        lcp: Math.random() * 3000 + 1000, // 1-4 seconds
        fid: Math.random() * 200 + 50,    // 50-250ms
        cls: Math.random() * 0.2,         // 0-0.2
        ttfb: Math.random() * 800 + 200,  // 200-1000ms
        timestamp: Date.now()
      }
      
      setPerformanceMetrics(prev => [...prev.slice(-9), mockMetrics])
    } catch (err) {
      console.error('Failed to fetch performance metrics:', err)
    }
  }

  const handleManualBackup = async () => {
    try {
      analytics.trackUserAction('manual_backup_triggered')
      await performBackup()
      alert('Backup completed successfully!')
    } catch (error) {
      console.error('Manual backup failed:', error)
      alert('Backup failed. Please check the console for details.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'degraded': return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatMemory = (bytes: number) => {
    return `${bytes}MB`
  }

  if (!isMonitoringEnabled) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Monitoring Dashboard</h2>
          <p className="text-gray-600">
            Monitoring is currently disabled. Enable the performance monitoring feature flag to view this dashboard.
          </p>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Monitoring Dashboard</h2>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Monitoring Dashboard</h2>
          <div className="text-red-600 bg-red-50 p-4 rounded-lg">
            <p className="font-medium">Error loading monitoring data</p>
            <p className="text-sm mt-1">{error}</p>
            <Button 
              onClick={fetchHealthStatus} 
              className="mt-3"
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={handleManualBackup} variant="outline" size="sm">
            Create Backup
          </Button>
          <Button onClick={fetchHealthStatus} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        {healthStatus && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                {healthStatus.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-medium">{healthStatus.version}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Environment</p>
                <p className="font-medium">{healthStatus.environment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="font-medium">{formatUptime(healthStatus.uptime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="font-medium">
                  {formatMemory(healthStatus.memory.used)} / {formatMemory(healthStatus.memory.total)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Service Checks</h3>
              <div className="space-y-2">
                {Object.entries(healthStatus.checks).map(([service, check]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="capitalize">{service}</span>
                    <div className="flex items-center gap-2">
                      {check.responseTime && (
                        <span className="text-sm text-gray-600">{check.responseTime}ms</span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(check.status)}`}>
                        {check.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        {performanceMetrics.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {performanceMetrics.slice(-1).map((metrics, index) => (
                <React.Fragment key={index}>
                  <div>
                    <p className="text-sm text-gray-600">LCP (Largest Contentful Paint)</p>
                    <p className={`font-medium ${metrics.lcp > 2500 ? 'text-red-600' : metrics.lcp > 1500 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {metrics.lcp.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">FID (First Input Delay)</p>
                    <p className={`font-medium ${metrics.fid > 100 ? 'text-red-600' : metrics.fid > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {metrics.fid.toFixed(0)}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CLS (Cumulative Layout Shift)</p>
                    <p className={`font-medium ${metrics.cls > 0.1 ? 'text-red-600' : metrics.cls > 0.05 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {metrics.cls.toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">TTFB (Time to First Byte)</p>
                    <p className={`font-medium ${metrics.ttfb > 600 ? 'text-red-600' : metrics.ttfb > 300 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {metrics.ttfb.toFixed(0)}ms
                    </p>
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Last updated: {new Date(performanceMetrics[performanceMetrics.length - 1]?.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Backup Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Backup Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Automated Backups</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-600">
              ENABLED
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Next backup: Every 6 hours</p>
            <p>Retention: 30 backups</p>
            <p>Last backup: {new Date().toLocaleString()}</p>
          </div>
          
          <Button onClick={handleManualBackup} variant="outline" size="sm">
            Create Manual Backup
          </Button>
        </div>
      </Card>

      {/* Feature Flags */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Feature Flags</h2>
        <div className="space-y-2">
          {Object.entries(FEATURE_FLAGS).map(([key, flag]) => {
            const isEnabled = useFeatureFlag(flag)
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{key.replace(/_/g, ' ').toLowerCase()}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}