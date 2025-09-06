import { useState, useCallback } from 'react';
import { Application } from '@/types/application';

export interface AIAnalysisResult {
  analysisType: 'patterns' | 'trends' | 'individual';
  insights: any;
  timestamp: string;
}

export interface ResumeAnalysisResult {
  analysis: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    keywordMatch: {
      matched: string[];
      missing: string[];
      score: number;
    };
    sections: {
      name: string;
      score: number;
      feedback: string;
    }[];
  };
  timestamp: string;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AIError | null>(null);

  const analyzeApplications = useCallback(async (
    applications: Application[],
    analysisType: 'patterns' | 'trends' | 'individual' = 'patterns'
  ): Promise<AIAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applications,
          analysisType
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Analysis failed');
      }

      return data.data;
    } catch (err) {
      const error: AIError = {
        code: 'ANALYSIS_FAILED',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      };
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeResume = useCallback(async (
    resumeText: string,
    jobDescription?: string,
    targetRole?: string
  ): Promise<ResumeAnalysisResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          targetRole
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Resume analysis failed');
      }

      return data.data;
    } catch (err) {
      const error: AIError = {
        code: 'RESUME_ANALYSIS_FAILED',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      };
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeApplicationPatterns = useCallback(async (
    applications: Application[]
  ) => {
    return analyzeApplications(applications, 'patterns');
  }, [analyzeApplications]);

  const analyzeTrends = useCallback(async (
    applications: Application[]
  ) => {
    return analyzeApplications(applications, 'trends');
  }, [analyzeApplications]);

  const analyzeIndividualApplication = useCallback(async (
    application: Application
  ) => {
    return analyzeApplications([application], 'individual');
  }, [analyzeApplications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Methods
    analyzeApplications,
    analyzeResume,
    analyzeApplicationPatterns,
    analyzeTrends,
    analyzeIndividualApplication,
    clearError,
  };
}

// Utility function to format AI insights for display
export function formatAIInsights(insights: any, analysisType: string) {
  switch (analysisType) {
    case 'patterns':
      return {
        title: 'Application Pattern Analysis',
        metrics: [
          { label: 'Success Rate', value: `${insights.successRate?.toFixed(1) || 0}%` },
          { label: 'Response Rate', value: `${insights.responseRate?.toFixed(1) || 0}%` },
          { label: 'Avg Response Time', value: `${insights.averageResponseTime?.toFixed(0) || 0} days` },
        ],
        recommendations: insights.bestPerformingCompanies || [],
        timing: insights.optimalApplicationTiming || null,
      };
    
    case 'trends':
      return {
        title: 'Success Trend Analysis',
        trend: insights.overallTrend || 'stable',
        score: insights.trendScore || 0,
        insights: insights.keyInsights || [],
        recommendations: insights.recommendations || [],
        monthlyStats: insights.monthlyStats || [],
      };
    
    case 'individual':
      return {
        title: 'Application Analysis',
        matchScore: insights.matchScore || 0,
        successProbability: insights.successProbability || 0,
        matchReasons: insights.matchReasons || [],
        suggestions: insights.improvementSuggestions || [],
        actions: insights.recommendedActions || [],
      };
    
    default:
      return {
        title: 'AI Analysis',
        message: 'Analysis completed',
        data: insights,
      };
  }
}

// Utility function to check if AI features are available
export function isAIAvailable(): boolean {
  return typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_AI_ENABLED;
}

// Utility function to get AI feature status
export function getAIStatus() {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'Server-side rendering' };
  }

  if (!process.env.NEXT_PUBLIC_AI_ENABLED) {
    return { available: false, reason: 'AI features disabled' };
  }

  return { available: true, reason: 'AI features enabled' };
}