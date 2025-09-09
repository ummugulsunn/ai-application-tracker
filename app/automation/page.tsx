'use client'

import React, { useState } from 'react'
import WorkflowManager from '@/components/automation/WorkflowManager'
import SmartSuggestions from '@/components/automation/SmartSuggestions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Bot, 
  Zap, 
  Settings, 
  Lightbulb,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflows' | 'suggestions'>('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automation Center</h1>
              <p className="text-gray-600">Streamline your job search with intelligent automation</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('workflows')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'workflows'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Workflows
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'suggestions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Smart Suggestions
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && <AutomationOverview />}
        {activeTab === 'workflows' && <WorkflowManager />}
        {activeTab === 'suggestions' && <SmartSuggestions />}
      </div>
    </div>
  )
}

function AutomationOverview() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Automation Center
            </h2>
            <p className="text-gray-600 mb-4">
              Save time and improve your job search efficiency with intelligent automation tools.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Automated follow-ups</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Smart reminders</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Pattern recognition</span>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Bot className="w-24 h-24 text-blue-400" />
          </div>
        </div>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Smart Workflows</h3>
              <p className="text-sm text-gray-600">Automate repetitive tasks</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Create custom workflows that automatically handle follow-ups, reminders, and status updates based on your application patterns.
          </p>
          <Button variant="outline" className="w-full">
            Create Workflow
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
              <p className="text-sm text-gray-600">Personalized recommendations</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Get intelligent suggestions based on your job search patterns to optimize timing, improve success rates, and save time.
          </p>
          <Button variant="outline" className="w-full">
            View Suggestions
          </Button>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analytics & Insights</h3>
              <p className="text-sm text-gray-600">Data-driven optimization</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Analyze your application patterns, success rates, and timing to identify opportunities for improvement and automation.
          </p>
          <Button variant="outline" className="w-full">
            View Analytics
          </Button>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Set up your first workflow</h4>
                <p className="text-sm text-gray-600">
                  Create an automated follow-up reminder for new applications
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Review AI suggestions</h4>
                <p className="text-sm text-gray-600">
                  Check personalized recommendations to optimize your job search
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Monitor and adjust</h4>
                <p className="text-sm text-gray-600">
                  Track automation performance and refine your workflows
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Automation Benefits</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                Save 2-3 hours per week on manual tasks
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Improve follow-up consistency by 80%
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Never miss important deadlines
              </li>
              <li className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-green-500" />
                Get data-driven insights for better results
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Popular Automation Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Automation Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-blue-500" />
              <h4 className="font-medium text-gray-900">Follow-up Reminder</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Automatically create follow-up reminders 7 days after applying
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Use Template
            </Button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h4 className="font-medium text-gray-900">Interview Prep</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Create preparation tasks when status changes to interviewing
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Use Template
            </Button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h4 className="font-medium text-gray-900">Status Update Alert</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Alert when applications haven't been updated in 2 weeks
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Use Template
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}