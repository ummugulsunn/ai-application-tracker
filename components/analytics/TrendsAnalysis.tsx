'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUpIcon, 
  TrendingDownIcon,
  MinusIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { HelpTooltip } from '../ui/HelpTooltip'
import { LoadingStates } from '../ui/LoadingStates'
import { AccessibleMotion } from '../ui/AccessibilityWrapper'
import { Application } from '@/types/application'

interface TrendsAnalysisProps {
  applications: Application[]
  className?: string
}

interface TrendsData {
  timeSeriesData: any[]
  trendIndicators: any
  comparativeAnalysis: {
    current: any
    previous: any
    comparison: any
  }
  seasonalPatterns: {
    monthly: any[]
    weekly: any[]
    insights: any[]
  }
  forecasting: any
  summary: {
    overallTrend: string
    keyInsights: string[]
    recommendations: string[]
  }
}

const TIMEFRAME_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' }
]

const GRANULARITY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' }
]

const METRICS_OPTIONS = [
  { value: 'applications', label: 'Applications', color: '#2563eb' },
  { value: 'interviews', label: 'Interviews', color: '#16a34a' },
  { value: 'offers', label: 'Offers', color: '#dc2626' },
  { value: 'rejections', label: 'Rejections', color: '#ca8a04' },
  { value: 'response_time', label: 'Response Time', color: '#9333ea' }
]

export default function TrendsAnalysis({ applications, className = '' }: TrendsAnalysisProps) {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState('30d')
  const [granularity, setGranularity] = useState('day')
  const [selectedMetrics, setSelectedMetrics] = useState(['applications', 'interviews', 'offers'])

  useEffect(() => {
    fetchTrendsData()
  }, [applications, timeframe, granularity, selectedMetrics])

  const fetchTrendsData = async () => {
    if (applications.length === 0) {
      setTrendsData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applications,
          timeframe,
          granularity,
          metrics: selectedMetrics
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trends data')
      }

      const result = await response.json()
      if (result.success) {
        setTrendsData(result.data)
      } else {
        throw new Error(result.error?.message || 'Failed to calculate trends')
      }
    } catch (err) {
      console.error('Trends fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trends')
    } finally {
      setLoading(false)
    }
  }

  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    )
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUpIcon className="w-5 h-5 text-green-600" />
      case 'decreasing':
        return <TrendingDownIcon className="w-5 h-5 text-red-600" />
      default:
        return <MinusIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (applications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Trends Available
          </h3>
          <p className="text-gray-500">
            Add some job applications to see trend analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Trends Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingStates.SkeletonChart />
        </CardContent>
      </Card>
    )
  }

  if (error || !trendsData) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <TrendingUpIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Trends Error
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'Failed to load trends data'}
          </p>
          <Button onClick={fetchTrendsData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUpIcon className="w-5 h-5" />
                <span>Trends Analysis</span>
                <HelpTooltip 
                  content="Detailed trend analysis with forecasting and comparative insights"
                  size="sm"
                />
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {trendsData.summary.overallTrend === 'positive' ? '📈 Positive trend' :
                 trendsData.summary.overallTrend === 'concerning' ? '📉 Concerning trend' :
                 '📊 Stable trend'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {/* Timeframe */}
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {TIMEFRAME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Granularity */}
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4 text-gray-500" />
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {GRANULARITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Metrics:</span>
              <div className="flex flex-wrap gap-2">
                {METRICS_OPTIONS.map(metric => (
                  <button
                    key={metric.value}
                    onClick={() => toggleMetric(metric.value)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      selectedMetrics.includes(metric.value)
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Trend Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(trendsData.trendIndicators).map(([metric, indicator]: [string, any]) => {
          const metricInfo = METRICS_OPTIONS.find(m => m.value === metric)
          if (!metricInfo) return null

          return (
            <AccessibleMotion
              key={metric}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {metricInfo.label}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getTrendIcon(indicator.direction)}
                        <span className={`text-lg font-bold ${getTrendColor(indicator.direction)}`}>
                          {indicator.changePercent > 0 ? '+' : ''}{indicator.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {indicator.direction} trend
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Change</p>
                      <p className={`text-lg font-bold ${getTrendColor(indicator.direction)}`}>
                        {indicator.change > 0 ? '+' : ''}{indicator.change}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccessibleMotion>
          )
        })}
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={trendsData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map(metric => {
                const metricInfo = METRICS_OPTIONS.find(m => m.value === metric)
                return metricInfo ? (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={metricInfo.color}
                    strokeWidth={2}
                    name={metricInfo.label}
                  />
                ) : null
              })}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparative Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Period Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Current Period</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Applications:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.current.applications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interviews:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.current.interviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Offers:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.current.offers}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Previous Period</h4>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Applications:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.previous.applications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Interviews:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.previous.interviews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Offers:</span>
                      <span className="font-medium">{trendsData.comparativeAnalysis.previous.offers}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changes */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Changes</h4>
                <div className="space-y-2">
                  {Object.entries(trendsData.comparativeAnalysis.comparison).map(([key, change]: [string, any]) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <div className="flex items-center space-x-1">
                        {change.direction === 'up' ? (
                          <TrendingUpIcon className="w-4 h-4 text-green-600" />
                        ) : change.direction === 'down' ? (
                          <TrendingDownIcon className="w-4 h-4 text-red-600" />
                        ) : (
                          <MinusIcon className="w-4 h-4 text-gray-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          change.direction === 'up' ? 'text-green-600' :
                          change.direction === 'down' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {change.changePercent > 0 ? '+' : ''}{change.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seasonal Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendsData.seasonalPatterns.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Seasonal Insights</h4>
              <div className="space-y-2">
                {trendsData.seasonalPatterns.insights.map((insight, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{insight.title}:</span>
                    <span className="text-gray-600 ml-1">{insight.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Summary & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {trendsData.summary.keyInsights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="text-sm text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {trendsData.summary.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}