'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  CheckCircle, 
  X,
  ArrowRight,
  BarChart3,
  Bot,
  Sparkles
} from 'lucide-react'

interface SmartSuggestion {
  id: string
  type: 'workflow' | 'action' | 'optimization' | 'insight'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  category: string
  actionable: boolean
  metadata: Record<string, any>
}

interface AutomationInsight {
  id: string
  type: 'pattern' | 'anomaly' | 'opportunity' | 'warning'
  title: string
  description: string
  confidence: number
  data: Record<string, any>
}

export default function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [insights, setInsights] = useState<AutomationInsight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights'>('suggestions')

  useEffect(() => {
    loadSuggestions()
    loadInsights()
  }, [])

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/automation/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error loading suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/automation/insights')
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (error) {
      console.error('Error loading insights:', error)
    }
  }

  const applySuggestion = async (suggestion: SmartSuggestion) => {
    try {
      const response = await fetch('/api/automation/suggestions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId: suggestion.id })
      })

      if (response.ok) {
        // Remove suggestion from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
        
        // Show success message
        alert('Suggestion applied successfully!')
      }
    } catch (error) {
      console.error('Error applying suggestion:', error)
    }
  }

  const dismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]))
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workflow': return <Zap className="w-5 h-5" />
      case 'action': return <Target className="w-5 h-5" />
      case 'optimization': return <TrendingUp className="w-5 h-5" />
      case 'insight': return <Lightbulb className="w-5 h-5" />
      default: return <Sparkles className="w-5 h-5" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="w-5 h-5 text-blue-500" />
      case 'anomaly': return <TrendingUp className="w-5 h-5 text-orange-500" />
      case 'opportunity': return <Target className="w-5 h-5 text-green-500" />
      case 'warning': return <Clock className="w-5 h-5 text-red-500" />
      default: return <Lightbulb className="w-5 h-5 text-gray-500" />
    }
  }

  const filteredSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id))

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded mb-4"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-500" />
            Smart Automation
          </h1>
          <p className="text-gray-600">AI-powered suggestions to optimize your job search workflow</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Smart Suggestions ({filteredSuggestions.length})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights ({insights.length})
          </button>
        </nav>
      </div>

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
              <p className="text-gray-600">
                Keep using the application and we'll provide personalized automation suggestions based on your patterns.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <Card key={suggestion.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          {getTypeIcon(suggestion.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {suggestion.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                              {suggestion.impact} impact
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(suggestion.effort)}`}>
                              {suggestion.effort} effort
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {Math.round(suggestion.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{suggestion.description}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Category:</span>
                        <span className="capitalize">{suggestion.category}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {suggestion.actionable && (
                        <Button
                          onClick={() => applySuggestion(suggestion)}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Apply
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissSuggestion(suggestion.id)}
                        className="flex items-center gap-1 text-gray-600"
                      >
                        <X className="w-3 h-3" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <Card className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
              <p className="text-gray-600">
                Add more applications to generate personalized insights about your job search patterns.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gray-100">
                      {getInsightIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {insight.title}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      
                      {insight.data && Object.keys(insight.data).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {Object.entries(insight.data).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                <span className="font-medium">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to automate more?</h3>
            <p className="text-gray-600">
              Set up custom workflows to handle repetitive tasks automatically.
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Create Workflow
          </Button>
        </div>
      </Card>
    </div>
  )
}