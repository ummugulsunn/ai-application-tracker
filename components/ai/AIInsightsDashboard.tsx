'use client';

import { useState, useEffect } from 'react';
import { useAI } from '@/lib/hooks/useAI';
import { Application } from '@/types/application';
import { useProgressiveDateDisplay } from '@/lib/utils/dateFormatting';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ArrowTrendingDownIcon as TrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
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
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// Component for hydration-safe time display
function LastAnalyzedTime({ date }: { date: Date }) {
  const timeDisplay = useProgressiveDateDisplay(date, { 
    showRelativeTime: false,
    enableClientEnhancements: true 
  })
  
  return (
    <span className="text-xs text-gray-500">
      Last analyzed: {timeDisplay.relative}
    </span>
  )
}

interface AIInsightsDashboardProps {
  applications: Application[];
  className?: string;
}

// Color schemes for charts
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  neutral: '#6B7280'
};

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

export default function AIInsightsDashboard({ applications, className = '' }: AIInsightsDashboardProps) {
  const { analyzeApplicationPatterns, isLoading, error, clearError } = useAI();
  const [insights, setInsights] = useState<any>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'trends' | 'recommendations'>('overview');

  const runAnalysis = async () => {
    if (applications.length === 0) return;
    
    clearError();
    const result = await analyzeApplicationPatterns(applications);
    
    if (result) {
      setInsights(result.insights);
      setLastAnalyzed(new Date());
    }
  };

  useEffect(() => {
    // Auto-run analysis when applications change (debounced)
    const timer = setTimeout(() => {
      if (applications.length > 0 && !insights) {
        runAnalysis();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [applications.length]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!insights) return null;

    // Monthly trends data
    const monthlyData = insights.trends?.map((trend: any) => ({
      month: new Date(trend.period + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      applications: trend.applicationCount,
      successRate: trend.successRate,
      responseRate: trend.responseRate,
      trend: trend.trend
    })) || [];

    // Status distribution data
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: ((count / applications.length) * 100).toFixed(1)
    }));

    // Company performance data
    const companyData = insights.bestPerformingCompanies?.slice(0, 8).map((company: any) => ({
      name: typeof company === 'string' ? company : company.name,
      successRate: typeof company === 'object' ? company.successRate : 0,
      applications: typeof company === 'object' ? company.applicationCount : 1
    })) || [];

    return {
      monthlyData,
      statusData,
      companyData
    };
  };

  const chartData = prepareChartData();

  // Generate industry benchmarks when insufficient data
  const getIndustryBenchmarks = () => {
    return {
      averageSuccessRate: 15,
      averageResponseRate: 25,
      averageInterviewRate: 8,
      averageResponseTime: 12,
      bestPractices: [
        'Apply to 5-10 positions per week for optimal results',
        'Tuesday-Thursday are the best days to apply',
        'Follow up after 1-2 weeks if no response',
        'Customize your resume for each application',
        'Research the company before applying'
      ],
      industryInsights: [
        'Tech companies typically respond within 1-2 weeks',
        'Startups have higher response rates but lower success rates',
        'Remote positions are 30% more competitive',
        'Applications submitted in the morning get 20% more responses'
      ]
    };
  };

  const benchmarks = getIndustryBenchmarks();

  if (applications.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some applications to get AI-powered insights about your job search patterns.
          </p>
          
          {/* Show industry benchmarks even with no data */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Industry Benchmarks</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Average Success Rate:</span>
                <span className="font-medium text-blue-900 ml-1">{benchmarks.averageSuccessRate}%</span>
              </div>
              <div>
                <span className="text-blue-700">Average Response Rate:</span>
                <span className="font-medium text-blue-900 ml-1">{benchmarks.averageResponseRate}%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs text-blue-600">Start tracking applications to compare your performance!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">AI Insights Dashboard</h3>
          </div>
          <div className="flex items-center space-x-2">
            {lastAnalyzed && <LastAnalyzedTime date={lastAnalyzed} />}
            <button
              onClick={runAnalysis}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarIcon },
              { id: 'patterns', name: 'Patterns', icon: TrendingUpIcon },
              { id: 'trends', name: 'Trends', icon: ArrowTrendingUpIcon },
              { id: 'recommendations', name: 'Recommendations', icon: LightBulbIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-1" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                <p className="mt-1 text-sm text-red-700">{error.message}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && !insights && (
          <div className="text-center py-8">
            <ArrowPathIcon className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Analyzing your applications...</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Success Rate</p>
                    <p className="text-2xl font-semibold text-blue-900">
                      {insights?.successRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="text-blue-600">
                    {(insights?.successRate || 0) >= benchmarks.averageSuccessRate ? (
                      <TrendingUpIcon className="h-6 w-6" />
                    ) : (
                      <TrendingDownIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Industry avg: {benchmarks.averageSuccessRate}%
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Response Rate</p>
                    <p className="text-2xl font-semibold text-green-900">
                      {insights?.responseRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="text-green-600">
                    {(insights?.responseRate || 0) >= benchmarks.averageResponseRate ? (
                      <TrendingUpIcon className="h-6 w-6" />
                    ) : (
                      <TrendingDownIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Industry avg: {benchmarks.averageResponseRate}%
                </p>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Interview Rate</p>
                    <p className="text-2xl font-semibold text-indigo-900">
                      {insights?.interviewRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="text-indigo-600">
                    {(insights?.interviewRate || 0) >= benchmarks.averageInterviewRate ? (
                      <TrendingUpIcon className="h-6 w-6" />
                    ) : (
                      <TrendingDownIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-indigo-600 mt-1">
                  Industry avg: {benchmarks.averageInterviewRate}%
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-900">Avg Response Time</p>
                    <p className="text-2xl font-semibold text-purple-900">
                      {insights?.averageResponseTime?.toFixed(0) || 0} days
                    </p>
                  </div>
                  <div className="text-purple-600">
                    {(insights?.averageResponseTime || 0) <= benchmarks.averageResponseTime ? (
                      <TrendingUpIcon className="h-6 w-6" />
                    ) : (
                      <TrendingDownIcon className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Industry avg: {benchmarks.averageResponseTime} days
                </p>
              </div>
            </div>

            {/* Application Status Distribution */}
            {chartData?.statusData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Application Status Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Best Performing Companies */}
            {chartData?.companyData && chartData.companyData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Company Performance Analysis</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.companyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}${name === 'successRate' ? '%' : ''}`, 
                          name === 'successRate' ? 'Success Rate' : 'Applications'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="successRate" fill={CHART_COLORS.success} name="Success Rate %" />
                      <Bar dataKey="applications" fill={CHART_COLORS.info} name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Position Type Analysis */}
            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Optimal Application Timing</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Best Day:</span>
                      <span className="text-sm font-medium text-blue-900">
                        {insights.optimalApplicationTiming?.dayOfWeek || 'Tuesday'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Best Time:</span>
                      <span className="text-sm font-medium text-blue-900">
                        {insights.optimalApplicationTiming?.timeOfDay || 'Morning'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-blue-700">Confidence:</span>
                      <span className="text-sm font-medium text-blue-900">
                        {insights.optimalApplicationTiming?.confidence || 60}%
                      </span>
                    </div>
                  </div>
                  {insights.optimalApplicationTiming?.reasoning && (
                    <p className="text-xs text-blue-600 mt-2">
                      {insights.optimalApplicationTiming.reasoning}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">Application Frequency</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Recommended:</span>
                      <span className="text-sm font-medium text-green-900">
                        {insights.applicationFrequency?.recommended || 5} per week
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700">Current:</span>
                      <span className="text-sm font-medium text-green-900">
                        {insights.applicationFrequency?.current?.toFixed(1) || 0} per week
                      </span>
                    </div>
                  </div>
                  {insights.applicationFrequency?.reasoning && (
                    <p className="text-xs text-green-600 mt-2">
                      {insights.applicationFrequency.reasoning}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Position Success Analysis */}
            {applications.length >= 5 && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-3">Position Type Success Rates</h4>
                <div className="space-y-2">
                  {(() => {
                    const positionTypes = applications.reduce((acc, app) => {
                      const type = app.type || 'Unknown';
                      if (!acc[type]) {
                        acc[type] = { total: 0, successful: 0 };
                      }
                      acc[type].total++;
                      if (['Offered', 'Accepted'].includes(app.status)) {
                        acc[type].successful++;
                      }
                      return acc;
                    }, {} as Record<string, { total: number; successful: number }>);

                    return Object.entries(positionTypes)
                      .map(([type, stats]) => ({
                        type,
                        successRate: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
                        total: stats.total
                      }))
                      .sort((a, b) => b.successRate - a.successRate)
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                          <span className="text-sm font-medium text-yellow-900">{item.type}</span>
                          <div className="text-right">
                            <span className="text-sm text-yellow-700">
                              {item.successRate.toFixed(1)}% success
                            </span>
                            <span className="ml-2 text-xs text-yellow-600">
                              ({item.total} apps)
                            </span>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Monthly Trends Chart */}
            {chartData?.monthlyData && chartData.monthlyData.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Application Trends Over Time</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="applications" 
                        stackId="1" 
                        stroke={CHART_COLORS.primary} 
                        fill={CHART_COLORS.primary}
                        name="Applications"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="successRate" 
                        stackId="2" 
                        stroke={CHART_COLORS.success} 
                        fill={CHART_COLORS.success}
                        name="Success Rate %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Progress Indicators */}
            {insights?.trends && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.trends.slice(-3).map((trend: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{trend.period}</span>
                      <div className="flex items-center">
                        {trend.trend === 'improving' && <TrendingUpIcon className="h-4 w-4 text-green-500" />}
                        {trend.trend === 'declining' && <TrendingDownIcon className="h-4 w-4 text-red-500" />}
                        {trend.trend === 'stable' && <MinusIcon className="h-4 w-4 text-gray-500" />}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Applications:</span>
                        <span className="font-medium">{trend.applicationCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">{trend.successRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Actionable Recommendations */}
            {insights?.actionableRecommendations && insights.actionableRecommendations.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Personalized Recommendations</h4>
                <div className="space-y-3">
                  {insights.actionableRecommendations.map((rec: any, index: number) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.priority} priority
                            </span>
                            {rec.priority === 'high' && <ExclamationCircleIcon className="h-4 w-4 text-red-500 ml-2" />}
                            {rec.priority === 'medium' && <InformationCircleIcon className="h-4 w-4 text-yellow-500 ml-2" />}
                            {rec.priority === 'low' && <CheckCircleIcon className="h-4 w-4 text-blue-500 ml-2" />}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{rec.action}</p>
                          <p className="text-xs text-gray-600 mb-2">{rec.reasoning}</p>
                          {rec.expectedImpact && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Expected impact:</span> {rec.expectedImpact}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Industry Best Practices when no personalized recommendations */
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Industry Best Practices</h4>
                <div className="space-y-3">
                  {benchmarks.bestPractices.map((practice, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-blue-900">{practice}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights?.keyInsights && insights.keyInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Key Insights</h4>
                <div className="space-y-2">
                  {insights.keyInsights.map((insight: string, index: number) => (
                    <div key={index} className="flex items-start py-2 px-3 bg-gray-50 rounded">
                      <LightBulbIcon className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Industry Insights */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Industry Insights</h4>
              <div className="space-y-2">
                {benchmarks.industryInsights.map((insight, index) => (
                  <div key={index} className="flex items-start py-2 px-3 bg-indigo-50 rounded">
                    <InformationCircleIcon className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-indigo-700">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !insights && !error && (
          <div className="text-center py-8">
            <LightBulbIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Click "Refresh" to analyze your applications with AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}