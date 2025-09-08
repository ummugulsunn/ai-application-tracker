'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingStates } from '@/components/ui/LoadingStates';
import { ErrorNotification } from '@/components/ui/ErrorNotification';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

interface CoverLetterGeneration {
  coverLetter: string;
  keyPoints: string[];
  suggestions: string[];
  tone: string;
  wordCount: number;
}

interface CoverLetterAnalysis {
  overallScore: number;
  personalization: {
    score: number;
    companyMentions: number;
    roleMentions: number;
    suggestions: string[];
  };
  structure: {
    score: number;
    hasOpening: boolean;
    hasBody: boolean;
    hasClosing: boolean;
    suggestions: string[];
  };
  tone: {
    score: number;
    assessment: string;
    suggestions: string[];
  };
  improvements: string[];
}

interface CoverLetterGeneratorProps {
  onGenerationComplete?: (generation: CoverLetterGeneration) => void;
  onAnalysisComplete?: (analysis: CoverLetterAnalysis) => void;
}

export function CoverLetterGenerator({ onGenerationComplete, onAnalysisComplete }: CoverLetterGeneratorProps) {
  const [mode, setMode] = useState<'generate' | 'analyze'>('generate');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [userProfile, setUserProfile] = useState({
    name: '',
    skills: '',
    experience: '',
    achievements: '',
  });
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'confident' | 'friendly'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generation, setGeneration] = useState<CoverLetterGeneration | null>(null);
  const [analysis, setAnalysis] = useState<CoverLetterAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and passionate' },
    { value: 'confident', label: 'Confident', description: 'Assertive and self-assured' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  ];

  const lengthOptions = [
    { value: 'short', label: 'Short (200-300 words)', description: 'Concise and impactful' },
    { value: 'medium', label: 'Medium (300-400 words)', description: 'Balanced detail and brevity' },
    { value: 'long', label: 'Long (400-500 words)', description: 'Comprehensive and detailed' },
  ];

  const handleGenerate = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !position.trim()) {
      setError('Please fill in job description, company name, and position');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          companyName,
          position,
          userProfile: {
            name: userProfile.name || undefined,
            skills: userProfile.skills ? userProfile.skills.split(',').map(s => s.trim()) : undefined,
            experience: userProfile.experience || undefined,
            achievements: userProfile.achievements ? userProfile.achievements.split(',').map(s => s.trim()) : undefined,
          },
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate cover letter');
      }

      const generationResult = data.data.generation;
      setGeneration(generationResult);
      setCoverLetterText(generationResult.coverLetter);
      onGenerationComplete?.(generationResult);
    } catch (err) {
      console.error('Cover letter generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!coverLetterText.trim() || !jobDescription.trim() || !companyName.trim()) {
      setError('Please provide cover letter text, job description, and company name');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/cover-letter-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetterText,
          jobDescription,
          companyName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to analyze cover letter');
      }

      const analysisResult = data.data.analysis;
      setAnalysis(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      console.error('Cover letter analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze cover letter');
    } finally {
      setIsProcessing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cover Letter Assistant</h2>
          <HelpTooltip content="Generate personalized cover letters or analyze existing ones for effectiveness" />
        </div>

        {/* Mode Selection */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setMode('generate')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Generate Cover Letter
          </button>
          <button
            onClick={() => setMode('analyze')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'analyze'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Analyze Cover Letter
          </button>
        </div>

        {/* Common Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google, Microsoft, Apple"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>

            {mode === 'generate' && (
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position *
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Software Engineer, Product Manager"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              disabled={isProcessing}
            />
          </div>

          {/* Mode-specific fields */}
          {mode === 'generate' ? (
            <>
              {/* User Profile for Generation */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">Your Profile (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-skills" className="block text-sm font-medium text-gray-700 mb-1">
                      Key Skills
                    </label>
                    <input
                      id="user-skills"
                      type="text"
                      value={userProfile.skills}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="JavaScript, React, Node.js (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-experience" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Summary
                    </label>
                    <input
                      id="user-experience"
                      type="text"
                      value={userProfile.experience}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="5 years in software development"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>

                  <div>
                    <label htmlFor="user-achievements" className="block text-sm font-medium text-gray-700 mb-1">
                      Key Achievements
                    </label>
                    <input
                      id="user-achievements"
                      type="text"
                      value={userProfile.achievements}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, achievements: e.target.value }))}
                      placeholder="Led team of 5, Increased efficiency by 30% (comma-separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              {/* Generation Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  >
                    {toneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {toneOptions.find(opt => opt.value === tone)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  >
                    {lengthOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {lengthOptions.find(opt => opt.value === length)?.description}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Cover Letter Input for Analysis */
            <div>
              <label htmlFor="cover-letter-text" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter Text *
              </label>
              <textarea
                id="cover-letter-text"
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                placeholder="Paste your cover letter here..."
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                disabled={isProcessing}
              />
            </div>
          )}

          {error && <ErrorNotification message={error} onDismiss={() => setError(null)} />}

          <Button
            onClick={mode === 'generate' ? handleGenerate : handleAnalyze}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing 
              ? (mode === 'generate' ? 'Generating Cover Letter...' : 'Analyzing Cover Letter...')
              : (mode === 'generate' ? 'Generate Cover Letter' : 'Analyze Cover Letter')
            }
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isProcessing && (
        <Card className="p-6">
          <LoadingStates.Skeleton className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </LoadingStates.Skeleton>
          <p className="text-center text-gray-600 mt-4">
            {mode === 'generate' 
              ? 'Generating your personalized cover letter...'
              : 'Analyzing your cover letter for effectiveness...'
            }
          </p>
        </Card>
      )}

      {/* Generation Results */}
      {generation && !isProcessing && mode === 'generate' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Cover Letter</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{generation.wordCount} words</span>
                <Button
                  onClick={() => copyToClipboard(generation.coverLetter)}
                  variant="outline"
                  size="sm"
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                {generation.coverLetter}
              </pre>
            </div>

            {generation.keyPoints.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Key Strengths</h4>
                <ul className="space-y-1">
                  {generation.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {generation.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Customization Suggestions</h4>
                <ul className="space-y-1">
                  {generation.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isProcessing && mode === 'analyze' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cover Letter Analysis</h3>
              <div className="text-right">
                <div className="text-sm text-gray-500">Overall Score</div>
                <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/100
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-xl font-bold ${getScoreColor(analysis.personalization.score)}`}>
                  {analysis.personalization.score}/100
                </div>
                <div className="text-sm text-gray-600">Personalization</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.personalization.companyMentions} company mentions, {analysis.personalization.roleMentions} role mentions
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-xl font-bold ${getScoreColor(analysis.structure.score)}`}>
                  {analysis.structure.score}/100
                </div>
                <div className="text-sm text-gray-600">Structure</div>
                <div className="text-xs text-gray-500 mt-1">
                  {[analysis.structure.hasOpening, analysis.structure.hasBody, analysis.structure.hasClosing].filter(Boolean).length}/3 sections
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-xl font-bold ${getScoreColor(analysis.tone.score)}`}>
                  {analysis.tone.score}/100
                </div>
                <div className="text-sm text-gray-600">Tone</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analysis.tone.assessment}
                </div>
              </div>
            </div>

            {analysis.improvements.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Improvement Recommendations</h4>
                <ul className="space-y-1">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Detailed Feedback */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personalization Feedback */}
            {analysis.personalization.suggestions.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Personalization Tips</h4>
                <ul className="space-y-2">
                  {analysis.personalization.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-yellow-600 mr-2">→</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Structure Feedback */}
            {analysis.structure.suggestions.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Structure Tips</h4>
                <ul className="space-y-2">
                  {analysis.structure.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-600 mr-2">→</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Tone Feedback */}
            {analysis.tone.suggestions.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Tone Tips</h4>
                <ul className="space-y-2">
                  {analysis.tone.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-green-600 mr-2">→</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}