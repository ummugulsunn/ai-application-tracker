'use client';

import React, { useState } from 'react';
import { ResumeOptimizer } from '@/components/ai/ResumeOptimizer';
import { CoverLetterGenerator } from '@/components/ai/CoverLetterGenerator';
import { Card } from '@/components/ui/Card';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

export default function ResumeToolsPage() {
  const [activeTab, setActiveTab] = useState<'resume' | 'cover-letter'>('resume');

  const tabs = [
    {
      id: 'resume' as const,
      label: 'Resume Optimizer',
      description: 'Get AI-powered suggestions to optimize your resume for ATS and recruiters',
      icon: '📄'
    },
    {
      id: 'cover-letter' as const,
      label: 'Cover Letter Assistant',
      description: 'Generate personalized cover letters or analyze existing ones',
      icon: '✉️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Resume & Cover Letter Tools</h1>
            <HelpTooltip content="AI-powered tools to optimize your resume and create compelling cover letters that get noticed by recruiters and ATS systems" />
          </div>
          <p className="text-lg text-gray-600">
            Enhance your job applications with AI-powered optimization and generation tools
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="mt-4">
            <p className="text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'resume' && (
            <div>
              <ResumeOptimizer
                onOptimizationComplete={(optimization) => {
                  console.log('Resume optimization completed:', optimization);
                }}
              />
            </div>
          )}

          {activeTab === 'cover-letter' && (
            <div>
              <CoverLetterGenerator
                onGenerationComplete={(generation) => {
                  console.log('Cover letter generation completed:', generation);
                }}
                onAnalysisComplete={(analysis) => {
                  console.log('Cover letter analysis completed:', analysis);
                }}
              />
            </div>
          )}
        </div>

        {/* Tips and Best Practices */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💡</span>
              Resume Optimization Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Use keywords from the job description naturally throughout your resume
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Quantify your achievements with specific numbers and metrics
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Keep formatting simple and ATS-friendly (avoid tables, graphics, columns)
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Use standard section headers like "Work Experience" and "Education"
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                Tailor your resume for each application to match the specific role
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>✨</span>
              Cover Letter Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Research the company and mention specific details about their mission or recent news
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Start with a compelling hook that grabs attention in the first sentence
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Connect your experience directly to the job requirements
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                Show enthusiasm for the role and company culture
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                End with a strong call to action and professional closing
              </li>
            </ul>
          </Card>
        </div>

        {/* Additional Resources */}
        <div className="mt-8">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              🚀 Pro Tips for Job Search Success
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Before You Apply:</h4>
                <ul className="space-y-1">
                  <li>• Research the company thoroughly</li>
                  <li>• Customize your resume for each role</li>
                  <li>• Write a targeted cover letter</li>
                  <li>• Practice your elevator pitch</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">After You Apply:</h4>
                <ul className="space-y-1">
                  <li>• Follow up within 1-2 weeks</li>
                  <li>• Connect with employees on LinkedIn</li>
                  <li>• Prepare for potential interviews</li>
                  <li>• Track your applications systematically</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}