'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ArrowTrendingDownIcon as TrendingDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { HelpTooltip } from '../ui/HelpTooltip'
import { PageLoading } from '../ui/LoadingStates'
import { AccessibleMotion } from '../ui/AccessibilityWrapper'
import { Application } from '@/types/application'

interface AdvancedAnalyticsDashboardProps {
  applications: Application[]
  className?: string
}

interface AnalyticsData {
  overview: {
    totalApplications: number
    interviewCount: number
    offerCount: number
    rejectionCount: number
    interviewRate: number
    offerRate: number
    rejectionRate: number
    avgResponseTime: number
  }
  trends: {
    timeSeriesData: any[]
    monthlyStats: any[]
    weeklyActivity: any[]
  }
  distributions: {
    statusDistribution: any[]
    companyPerformance: any[]
    locationAnalysis: any[]
  }
  benchmarks: {
    averageInterviewRate: number
    averageOfferRate: number
    averageResponseTime: number
    topPerformingIndustries: string[]
    marketTrends: {
      hiring: string
      competition: string
      salaryTrends: string
    }
  }
  insights: any[]
  recommendations: any[]
}

interface FilterState {
  dateRange: {
    start: string
    end: string
  }
  status: string[]
  companies: string[]
  locations: string[]
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea', '#c2410c', '#0891b2']

export default function AdvancedAnalyticsDashboard({ applications, className = '' }: AdvancedAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'performance' | 'insights'>('overview')
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: '', end: '' },
    status: [],
    companies: [],
    locations: []
  })
  const [showFilters, setShowFilters] = useState(false)

  // Calculate date range defaults
  const dateRange = useMemo(() => {
    if (applications.length === 0) return { start: '', end: '' }
    
    const dates = applications.map(app => new Date(app.appliedDate))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    
    return {
      start: minDate.toISOString().split('T')[0],
      end: maxDate.toISOString().split('T')[0]
    }
  }, [applications])

  // Initialize filters with defaults
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: dateRange
    }))
  }, [dateRange])

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData()
  }, [applications, filters])

  const fetchAnalyticsData = async () => {
    if (applications.length === 0) {
      setAnalyticsData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applications,
          dateRange: filters.dateRange.start || filters.dateRange.end ? filters.dateRange : undefined,
          filters: {
            status: filters.status.length > 0 ? filters.status : undefined,
            companies: filters.companies.length > 0 ? filters.companies : undefined,
            locations: filters.locations.length > 0 ? filters.locations : undefined
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        throw new Error(result.error?.message || 'Failed to calculate analytics')
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExportAnalytics = async (format: 'json' | 'csv' | 'pdf') => {
    if (!analyticsData) return

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          applications,
          analyticsData,
          includeCharts: format === 'json',
          sections: ['overview', 'trends', 'distributions', 'insights', 'recommendations'],
          customFilename: `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to export analytics')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      // You could show a toast notification here
    }
  }

  const resetFilters = () => {
    setFilters({
      dateRange: dateRange,
      status: [],
      companies: [],
      locations: []
    })
  }

  if (applications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Analytics Available
          </h3>
          <p className="text-gray-500">
            Add some job applications to see detailed analytics and insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingStates.SkeletonChart />
        </CardContent>
      </Card>
    )
  }

  if (error || !analyticsData) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <InformationCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analytics Error
          </h3>
          <p className="text-gray-500 mb-4">
            {error || 'Failed to load analytics data'}
          </p>
          <Button onClick={fetchAnalyticsData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
    { id: 'performance', label: 'Performance', icon: TrendingDownIcon },
    { id: 'insights', label: 'Insights', icon: InformationCircleIcon }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with tabs and controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <ChartBarIcon className="w-5 h-5" />
                <span>Advanced Analytics</span>
                <HelpTooltip 
                  content="Comprehensive analytics and insights about your job search performance"
                  size="sm"
                />
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Analyzing {analyticsData.overview.totalApplications} applications
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Filters
              </Button>
              
              <div className="flex items-center space-x-1">
                <Button
                  onClick={() => handleExportAnalytics('json')}
                  variant="outline"
                  size="sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  JSON
                </Button>
                <Button
                  onClick={() => handleExportAnalytics('csv')}
                  variant="outline"
                  size="sm"
                >
                  CSV
                </Button>
                <Button
                  onClick={() => handleExportAnalytics('pdf')}
                  variant="outline"
                  size="sm"
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <AccessibleMotion
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
                <div className="md:col-span-2 flex items-end space-x-2">
                  <Button onClick={resetFilters} variant="outline" size="sm">
                    Reset Filters
                  </Button>
                </div>
              </div>
            </AccessibleMotion>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Tab Content */}
      <AccessibleMotion
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <OverviewTab analyticsData={analyticsData} />
        )}
        {activeTab === 'trends' && (
          <TrendsTab analyticsData={analyticsData} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab analyticsData={analyticsData} />
        )}
        {activeTab === 'insights' && (
          <InsightsTab analyticsData={analyticsData} />
        )}
      </AccessibleMotion>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  const { overview, benchmarks } = analyticsData

  const metricCards = [
    {
      title: 'Interview Rate',
      value: `${overview.interviewRate.toFixed(1)}%`,
      benchmark: `${benchmarks.averageInterviewRate}%`,
      trend: overview.interviewRate > benchmarks.averageInterviewRate ? 'up' : 'down',
      color: overview.interviewRate > benchmarks.averageInterviewRate ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Offer Rate',
      value: `${overview.offerRate.toFixed(1)}%`,
      benchmark: `${benchmarks.averageOfferRate}%`,
      trend: overview.offerRate > benchmarks.averageOfferRate ? 'up' : 'down',
      color: overview.offerRate > benchmarks.averageOfferRate ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Response Time',
      value: `${overview.avgResponseTime.toFixed(1)} days`,
      benchmark: `${benchmarks.averageResponseTime} days`,
      trend: overview.avgResponseTime < benchmarks.averageResponseTime ? 'up' : 'down',
      color: overview.avgResponseTime < benchmarks.averageResponseTime ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Success Rate',
      value: `${((overview.interviewCount / overview.totalApplications) * 100).toFixed(1)}%`,
      benchmark: 'Industry Avg',
      trend: 'up',
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <AccessibleMotion
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </p>
                    <p className={`text-2xl font-bold ${metric.color} mt-1`}>
                      {metric.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      vs {metric.benchmark} industry avg
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${
                    metric.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUpIcon className={`w-5 h-5 ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    ) : (
                      <TrendingDownIcon className={`w-5 h-5 ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AccessibleMotion>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.distributions.statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.distributions.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Application Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.trends.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="applications" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Trends Tab Component
function TrendsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Application Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData.trends.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="applications" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="interviews" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="offers" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.trends.monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="applications" stackId="1" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
              <Area type="monotone" dataKey="interviews" stackId="1" stroke="#16a34a" fill="#16a34a" fillOpacity={0.6} />
              <Area type="monotone" dataKey="offers" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Performance Tab Component
function PerformanceTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Company Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Company Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Company</th>
                  <th className="text-right py-2">Applications</th>
                  <th className="text-right py-2">Interviews</th>
                  <th className="text-right py-2">Offers</th>
                  <th className="text-right py-2">Interview Rate</th>
                  <th className="text-right py-2">Offer Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.distributions.companyPerformance.slice(0, 10).map((company, index) => (
                  <tr key={company.company} className="border-b">
                    <td className="py-2 font-medium">{company.company}</td>
                    <td className="text-right py-2">{company.applications}</td>
                    <td className="text-right py-2">{company.interviews}</td>
                    <td className="text-right py-2">{company.offers}</td>
                    <td className="text-right py-2">{company.interviewRate.toFixed(1)}%</td>
                    <td className="text-right py-2">{company.offerRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Location Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Location Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.distributions.locationAnalysis.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="applications" fill="#2563eb" />
              <Bar dataKey="interviews" fill="#16a34a" />
              <Bar dataKey="offers" fill="#dc2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Insights Tab Component
function InsightsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  insight.type === 'info' ? 'bg-blue-50 border-blue-400' :
                  'bg-gray-50 border-gray-400'
                }`}
              >
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                  insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                  insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.impact} impact
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">Category: {rec.category}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    {rec.actions && (
                      <ul className="mt-3 space-y-1">
                        {rec.actions.map((action: string, actionIndex: number) => (
                          <li key={actionIndex} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}