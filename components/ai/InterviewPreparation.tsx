'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { Skeleton } from '@/components/ui/LoadingStates';
import { InterviewPreparation as InterviewPrepType } from '@/lib/ai/advancedAIService';

interface InterviewPreparationProps {
  onPreparationComplete?: (preparation: InterviewPrepType) => void;
}

export function InterviewPreparation({ onPreparationComplete }: InterviewPreparationProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [interviewType, setInterviewType] = useState<'phone' | 'video' | 'in-person' | 'panel' | 'technical'>('video');
  const [preparation, setPreparation] = useState<InterviewPrepType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePreparation = async () => {
    if (!jobDescription.trim() || !companyName.trim()) {
      setError('Please provide both job description and company name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/interview-preparation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          companyName: companyName.trim(),
          interviewType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate interview preparation');
      }

      if (data.success) {
        setPreparation(data.data);
        onPreparationComplete?.(data.data);
      } else {
        throw new Error(data.error || 'Failed to generate interview preparation');
      }
    } catch (err) {
      console.error('Error generating interview preparation:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPreparation(null);
    setJobDescription('');
    setCompanyName('');
    setInterviewType('video');
    setError(null);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  if (preparation) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Interview Preparation</h2>
            <p className="text-gray-600">
              Preparation materials for {companyName} - {interviewType} interview
            </p>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <span>🔄</span>
            New Preparation
          </Button>
        </div>

        {/* Common Questions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>❓</span>
            Common Interview Questions
            <HelpTooltip content="Practice these questions to feel more confident during your interview" />
          </h3>
          <div className="space-y-4">
            {preparation.commonQuestions.map((q, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-medium text-gray-900 mb-2">{q.question}</h4>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {q.category}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{q.suggestedAnswer}</p>
                {q.tips && q.tips.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Tips:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {q.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Company Research */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🏢</span>
            Company Research
            <HelpTooltip content="Key information about the company to demonstrate your interest and preparation" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Points to Remember</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {preparation.companyResearch.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Questions to Ask</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {preparation.companyResearch.questionsToAsk.map((question, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-purple-600 mr-2">•</span>
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {preparation.companyResearch.recentNews && preparation.companyResearch.recentNews.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">Recent News & Updates</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {preparation.companyResearch.recentNews.map((news, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {news}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Skills and Preparation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>⭐</span>
              Skills to Highlight
            </h3>
            <ul className="space-y-2">
              {preparation.skillsToHighlight.map((skill, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span className="text-gray-700">{skill}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              Areas to Address
            </h3>
            <ul className="space-y-2">
              {preparation.weaknessesToAddress.map((weakness, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  <span className="text-gray-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Salary Negotiation */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>💰</span>
            Salary Negotiation
            <HelpTooltip content="Guidelines for discussing compensation during the interview process" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Market Range</h4>
              <p className="text-lg font-semibold text-green-600 mb-4">{preparation.salaryNegotiation.marketRange}</p>
              <h4 className="font-medium text-gray-900 mb-2">Best Timing</h4>
              <p className="text-sm text-gray-700">{preparation.salaryNegotiation.timing}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Negotiation Tips</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {preparation.salaryNegotiation.negotiationTips.map((tip, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Preparation Timeline */}
        {preparation.preparationTimeline && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📅</span>
              Preparation Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">One Week Before</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {preparation.preparationTimeline.oneWeekBefore.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Three Days Before</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {preparation.preparationTimeline.threeDaysBefore.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">One Day Before</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {preparation.preparationTimeline.oneDayBefore.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Day Of Interview</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  {preparation.preparationTimeline.dayOf.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Follow-up Strategy */}
        {preparation.followUpStrategy && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📧</span>
              Follow-up Strategy
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Thank You Email Template</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-line">
                    {preparation.followUpStrategy.thankYouEmail}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Follow-up Timeline</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {preparation.followUpStrategy.followUpTimeline.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {preparation.followUpStrategy.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>🎯</span>
          Interview Preparation Assistant
          <HelpTooltip content="Get personalized interview preparation materials including common questions, company research, and negotiation tips" />
        </h2>
        <p className="text-gray-600">
          Generate comprehensive interview preparation materials tailored to your specific role and company
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google, Microsoft, Startup Inc."
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="interviewType" className="block text-sm font-medium text-gray-700 mb-2">
            Interview Type
          </label>
          <select
            id="interviewType"
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="video">Video Interview</option>
            <option value="phone">Phone Interview</option>
            <option value="in-person">In-Person Interview</option>
            <option value="panel">Panel Interview</option>
            <option value="technical">Technical Interview</option>
          </select>
        </div>

        <div>
          <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here, including requirements, responsibilities, and qualifications..."
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include as much detail as possible for better preparation materials
          </p>
        </div>

        <Button
          onClick={handleGeneratePreparation}
          disabled={loading || !jobDescription.trim() || !companyName.trim()}
          className="w-full flex items-center justify-center gap-2"
        >
          <span>🚀</span>
          Generate Interview Preparation
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 What you'll get:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Common interview questions with suggested answers
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Company research and key talking points
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Skills to highlight and areas to address
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Salary negotiation guidance and market insights
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Preparation timeline and follow-up strategy
          </li>
        </ul>
      </div>
    </Card>
  );
}