'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageLoading } from '@/components/ui/LoadingStates';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

interface ResumeOptimization {
  optimizedSections: {
    section: string;
    original: string;
    optimized: string;
    improvements: string[];
  }[];
  keywordSuggestions: {
    category: string;
    keywords: string[];
    placement: string;
  }[];
  structuralChanges: {
    change: string;
    reason: string;
    impact: string;
  }[];
  atsImprovements: {
    issue: string;
    solution: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  overallScore: number;
  improvementSummary: string[];
}

interface ResumeOptimizerProps {
  onOptimizationComplete?: (optimization: ResumeOptimization) => void;
}

export function ResumeOptimizer({ onOptimizationComplete }: ResumeOptimizerProps) {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizationGoals, setOptimizationGoals] = useState<string[]>(['ats_optimization', 'keyword_enhancement']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goalOptions = [
    { id: 'ats_optimization', label: 'ATS Optimization', description: 'Improve compatibility with Applicant Tracking Systems' },
    { id: 'keyword_enhancement', label: 'Keyword Enhancement', description: 'Add relevant keywords and phrases' },
    { id: 'achievement_quantification', label: 'Achievement Quantification', description: 'Add metrics and quantify accomplishments' },
    { id: 'structure_improvement', label: 'Structure Improvement', description: 'Improve formatting and organization' },
    { id: 'content_enhancement', label: 'Content Enhancement', description: 'Enhance overall content quality and impact' },
  ];

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      setError('Please enter your resume text');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole: targetRole || undefined,
          targetIndustry: targetIndustry || undefined,
          jobDescription: jobDescription || undefined,
          optimizationGoals,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to optimize resume');
      }

      const optimizationResult = data.data.optimization;
      setOptimization(optimizationResult);
      onOptimizationComplete?.(optimizationResult);
    } catch (err) {
      console.error('Resume optimization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setOptimizationGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Resume Optimizer</h2>
          <HelpTooltip content="Get AI-powered suggestions to optimize your resume for better ATS compatibility and recruiter appeal" />
        </div>

        {/* Resume Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="resume-text" className="block text-sm font-medium text-gray-700 mb-2">
              Resume Text *
            </label>
            <textarea
              id="resume-text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              disabled={isAnalyzing}
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="target-role" className="block text-sm font-medium text-gray-700 mb-2">
                Target Role (Optional)
              </label>
              <input
                id="target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Software Engineer, Product Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label htmlFor="target-industry" className="block text-sm font-medium text-gray-700 mb-2">
                Target Industry (Optional)
              </label>
              <input
                id="target-industry"
                type="text"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isAnalyzing}
              />
            </div>
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
              Target Job Description (Optional)
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're targeting for more specific optimization..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              disabled={isAnalyzing}
            />
          </div>

          {/* Optimization Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Optimization Goals
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalOptions.map((goal) => (
                <label key={goal.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optimizationGoals.includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isAnalyzing}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{goal.label}</div>
                    <div className="text-xs text-gray-500">{goal.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && <ErrorNotification message={error} onDismiss={() => setError(null)} />}

          <Button
            onClick={handleOptimize}
            disabled={isAnalyzing || !resumeText.trim()}
            className="w-full"
          >
            {isAnalyzing ? 'Optimizing Resume...' : 'Optimize Resume'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <Card className="p-6">
          <LoadingStates.Skeleton className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </LoadingStates.Skeleton>
          <p className="text-center text-gray-600 mt-4">
            Analyzing your resume and generating optimization suggestions...
          </p>
        </Card>
      )}

      {/* Optimization Results */}
      {optimization && !isAnalyzing && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Optimization Results</h3>
              <div className="text-right">
                <div className="text-sm text-gray-500">Overall Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(optimization.overallScore)}`}>
                  {optimization.overallScore}/100
                </div>
              </div>
            </div>
            
            {optimization.improvementSummary.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Key Improvements</h4>
                <ul className="space-y-1">
                  {optimization.improvementSummary.map((summary, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {summary}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* ATS Improvements */}
          {optimization.atsImprovements.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ATS Compatibility Improvements</h3>
              <div className="space-y-3">
                {optimization.atsImprovements.map((improvement, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{improvement.issue}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(improvement.priority)}`}>
                        {improvement.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{improvement.solution}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Keyword Suggestions */}
          {optimization.keywordSuggestions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Suggestions</h3>
              <div className="space-y-4">
                {optimization.keywordSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{suggestion.category}</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {suggestion.keywords.map((keyword, keywordIndex) => (
                        <span key={keywordIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>Placement:</strong> {suggestion.placement}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Optimized Sections */}
          {optimization.optimizedSections.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Optimizations</h3>
              <div className="space-y-6">
                {optimization.optimizedSections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{section.section}</h4>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Original</h5>
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-gray-700">
                          {section.original}
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Optimized</h5>
                        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-gray-700">
                          {section.optimized}
                        </div>
                      </div>
                    </div>
                    
                    {section.improvements.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Improvements Made</h5>
                        <ul className="space-y-1">
                          {section.improvements.map((improvement, improvementIndex) => (
                            <li key={improvementIndex} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-600 mr-2">✓</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Structural Changes */}
          {optimization.structuralChanges.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Structural Improvements</h3>
              <div className="space-y-3">
                {optimization.structuralChanges.map((change, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{change.change}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Reason:</strong> {change.reason}
                    </p>
                    <p className="text-sm text-green-700">
                      <strong>Expected Impact:</strong> {change.impact}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}