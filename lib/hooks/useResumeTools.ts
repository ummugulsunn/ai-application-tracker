'use client';

import { useState, useCallback } from 'react';

interface ResumeAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: Array<{
    category: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  }>;
  keywordOptimization: {
    missingKeywords: string[];
    overusedKeywords: string[];
    industryKeywords: string[];
  };
  atsCompatibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
  sectionAnalysis: {
    summary: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    skills: { score: number; feedback: string };
    education: { score: number; feedback: string };
  };
}

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

interface UseResumeToolsReturn {
  // Resume Analysis
  analyzeResume: (resumeText: string, targetRole?: string, targetIndustry?: string) => Promise<ResumeAnalysis>;
  resumeAnalysis: ResumeAnalysis | null;
  isAnalyzingResume: boolean;
  resumeAnalysisError: string | null;

  // Resume Optimization
  optimizeResume: (
    resumeText: string,
    targetRole?: string,
    targetIndustry?: string,
    jobDescription?: string,
    optimizationGoals?: string[]
  ) => Promise<ResumeOptimization>;
  resumeOptimization: ResumeOptimization | null;
  isOptimizingResume: boolean;
  resumeOptimizationError: string | null;

  // Cover Letter Generation
  generateCoverLetter: (
    jobDescription: string,
    companyName: string,
    position: string,
    userProfile?: any,
    tone?: string,
    length?: string
  ) => Promise<CoverLetterGeneration>;
  coverLetterGeneration: CoverLetterGeneration | null;
  isGeneratingCoverLetter: boolean;
  coverLetterGenerationError: string | null;

  // Cover Letter Analysis
  analyzeCoverLetter: (
    coverLetterText: string,
    jobDescription: string,
    companyName: string
  ) => Promise<CoverLetterAnalysis>;
  coverLetterAnalysis: CoverLetterAnalysis | null;
  isAnalyzingCoverLetter: boolean;
  coverLetterAnalysisError: string | null;

  // Utility functions
  clearErrors: () => void;
  clearResults: () => void;
}

export function useResumeTools(): UseResumeToolsReturn {
  // Resume Analysis State
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState(false);
  const [resumeAnalysisError, setResumeAnalysisError] = useState<string | null>(null);

  // Resume Optimization State
  const [resumeOptimization, setResumeOptimization] = useState<ResumeOptimization | null>(null);
  const [isOptimizingResume, setIsOptimizingResume] = useState(false);
  const [resumeOptimizationError, setResumeOptimizationError] = useState<string | null>(null);

  // Cover Letter Generation State
  const [coverLetterGeneration, setCoverLetterGeneration] = useState<CoverLetterGeneration | null>(null);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [coverLetterGenerationError, setCoverLetterGenerationError] = useState<string | null>(null);

  // Cover Letter Analysis State
  const [coverLetterAnalysis, setCoverLetterAnalysis] = useState<CoverLetterAnalysis | null>(null);
  const [isAnalyzingCoverLetter, setIsAnalyzingCoverLetter] = useState(false);
  const [coverLetterAnalysisError, setCoverLetterAnalysisError] = useState<string | null>(null);

  // Resume Analysis
  const analyzeResume = useCallback(async (
    resumeText: string,
    targetRole?: string,
    targetIndustry?: string
  ): Promise<ResumeAnalysis> => {
    setIsAnalyzingResume(true);
    setResumeAnalysisError(null);

    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole,
          targetIndustry,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to analyze resume');
      }

      const analysis = data.data.analysis;
      setResumeAnalysis(analysis);
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze resume';
      setResumeAnalysisError(errorMessage);
      throw error;
    } finally {
      setIsAnalyzingResume(false);
    }
  }, []);

  // Resume Optimization
  const optimizeResume = useCallback(async (
    resumeText: string,
    targetRole?: string,
    targetIndustry?: string,
    jobDescription?: string,
    optimizationGoals?: string[]
  ): Promise<ResumeOptimization> => {
    setIsOptimizingResume(true);
    setResumeOptimizationError(null);

    try {
      const response = await fetch('/api/ai/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          targetRole,
          targetIndustry,
          jobDescription,
          optimizationGoals,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to optimize resume');
      }

      const optimization = data.data.optimization;
      setResumeOptimization(optimization);
      return optimization;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize resume';
      setResumeOptimizationError(errorMessage);
      throw error;
    } finally {
      setIsOptimizingResume(false);
    }
  }, []);

  // Cover Letter Generation
  const generateCoverLetter = useCallback(async (
    jobDescription: string,
    companyName: string,
    position: string,
    userProfile?: any,
    tone: string = 'professional',
    length: string = 'medium'
  ): Promise<CoverLetterGeneration> => {
    setIsGeneratingCoverLetter(true);
    setCoverLetterGenerationError(null);

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
          userProfile,
          tone,
          length,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to generate cover letter');
      }

      const generation = data.data.generation;
      setCoverLetterGeneration(generation);
      return generation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover letter';
      setCoverLetterGenerationError(errorMessage);
      throw error;
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  }, []);

  // Cover Letter Analysis
  const analyzeCoverLetter = useCallback(async (
    coverLetterText: string,
    jobDescription: string,
    companyName: string
  ): Promise<CoverLetterAnalysis> => {
    setIsAnalyzingCoverLetter(true);
    setCoverLetterAnalysisError(null);

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

      const analysis = data.data.analysis;
      setCoverLetterAnalysis(analysis);
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze cover letter';
      setCoverLetterAnalysisError(errorMessage);
      throw error;
    } finally {
      setIsAnalyzingCoverLetter(false);
    }
  }, []);

  // Utility functions
  const clearErrors = useCallback(() => {
    setResumeAnalysisError(null);
    setResumeOptimizationError(null);
    setCoverLetterGenerationError(null);
    setCoverLetterAnalysisError(null);
  }, []);

  const clearResults = useCallback(() => {
    setResumeAnalysis(null);
    setResumeOptimization(null);
    setCoverLetterGeneration(null);
    setCoverLetterAnalysis(null);
    clearErrors();
  }, [clearErrors]);

  return {
    // Resume Analysis
    analyzeResume,
    resumeAnalysis,
    isAnalyzingResume,
    resumeAnalysisError,

    // Resume Optimization
    optimizeResume,
    resumeOptimization,
    isOptimizingResume,
    resumeOptimizationError,

    // Cover Letter Generation
    generateCoverLetter,
    coverLetterGeneration,
    isGeneratingCoverLetter,
    coverLetterGenerationError,

    // Cover Letter Analysis
    analyzeCoverLetter,
    coverLetterAnalysis,
    isAnalyzingCoverLetter,
    coverLetterAnalysisError,

    // Utility functions
    clearErrors,
    clearResults,
  };
}