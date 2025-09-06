'use client';

import { useState, useEffect } from 'react';
import { useAI, formatAIInsights } from '@/lib/hooks/useAI';
import { Application } from '@/types/application';
import { useProgressiveDateDisplay } from '@/lib/utils/dateFormatting';
import { 
  ChartBarIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

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

interface AIInsightsProps {
  applications: Application[];
  className?: string;
}

export default function AIInsights({ applications, className = '' }: AIInsightsProps) {
  const { analyzeApplicationPatterns, isLoading, error, clearError } = useAI();
  const [insights, setInsights] = useState<any>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

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

  if (applications.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some applications to get AI-powered insights about your job search patterns.
          </p>
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
            <h3 className="text-lg font-medium text-gray-900">AI Insights</h3>
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

        {insights && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                  <span className="ml-2 text-sm font-medium text-blue-900">Success Rate</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-blue-900">
                  {insights.successRate?.toFixed(1) || 0}%
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 text-green-600" />
                  <span className="ml-2 text-sm font-medium text-green-900">Response Rate</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-green-900">
                  {insights.responseRate?.toFixed(1) || 0}%
                </p>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="ml-2 text-sm font-medium text-indigo-900">Interview Rate</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-indigo-900">
                  {insights.interviewRate?.toFixed(1) || 0}%
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="ml-2 text-sm font-medium text-purple-900">Avg Response Time</span>
                </div>
                <p className="mt-1 text-2xl font-semibold text-purple-900">
                  {insights.averageResponseTime?.toFixed(0) || 0} days
                </p>
              </div>
            </div>

            {/* Best Performing Companies */}
            {insights.bestPerformingCompanies && insights.bestPerformingCompanies.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Best Performing Companies</h4>
                <div className="space-y-2">
                  {insights.bestPerformingCompanies.slice(0, 5).map((company: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-green-50 rounded">
                      <span className="text-sm font-medium text-green-900">
                        {typeof company === 'string' ? company : company.name}
                      </span>
                      {typeof company === 'object' && (
                        <div className="text-right">
                          <span className="text-sm text-green-700">
                            {company.successRate?.toFixed(1)}% success
                          </span>
                          <span className="ml-2 text-xs text-green-600">
                            ({company.applicationCount} apps)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optimal Timing and Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.optimalApplicationTiming && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Optimal Application Timing</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      Best day: <span className="font-medium">{insights.optimalApplicationTiming.dayOfWeek}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Best time: <span className="font-medium">{insights.optimalApplicationTiming.timeOfDay}</span>
                    </p>
                    {insights.optimalApplicationTiming.confidence && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {insights.optimalApplicationTiming.confidence}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {insights.applicationFrequency && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Application Frequency</h4>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      Recommended: <span className="font-medium">{insights.applicationFrequency.recommended} per week</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      Current: <span className="font-medium">{insights.applicationFrequency.current?.toFixed(1) || 0} per week</span>
                    </p>
                    {insights.applicationFrequency.reasoning && (
                      <p className="text-xs text-blue-600 mt-1">
                        {insights.applicationFrequency.reasoning}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actionable Recommendations */}
            {insights.actionableRecommendations && insights.actionableRecommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Actionable Recommendations</h4>
                <div className="space-y-3">
                  {insights.actionableRecommendations.slice(0, 3).map((rec: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high' ? 'bg-red-50 border-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">{rec.action}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.reasoning}</p>
                      {rec.expectedImpact && (
                        <p className="text-xs text-gray-500 mt-1">Expected impact: {rec.expectedImpact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights.keyInsights && insights.keyInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {insights.keyInsights.slice(0, 4).map((insight: string, index: number) => (
                    <div key={index} className="flex items-start py-2 px-3 bg-gray-50 rounded">
                      <LightBulbIcon className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {insights.trends && insights.trends.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Application Trends</h4>
                <div className="space-y-2">
                  {insights.trends.slice(-3).map((trend: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{trend.period}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {trend.applicationCount} apps
                        </span>
                        <span className="ml-2 text-sm text-gray-600">
                          ({trend.successRate?.toFixed(1) || 0}% success)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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