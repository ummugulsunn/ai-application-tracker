import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useResumeTools } from '@/lib/hooks/useResumeTools';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('useResumeTools', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Resume Analysis', () => {
    it('should analyze resume successfully', async () => {
      const mockAnalysis = {
        overallScore: 85,
        strengths: ['Strong technical skills', 'Good experience'],
        weaknesses: ['Missing quantified achievements'],
        improvements: [
          {
            category: 'Content',
            suggestion: 'Add metrics to achievements',
            priority: 'high',
            impact: 'Increases credibility'
          }
        ],
        keywordOptimization: {
          missingKeywords: ['React', 'Node.js'],
          overusedKeywords: [],
          industryKeywords: ['JavaScript', 'TypeScript']
        },
        atsCompatibility: {
          score: 80,
          issues: ['Use standard headers'],
          recommendations: ['Simplify formatting']
        },
        sectionAnalysis: {
          summary: { score: 75, feedback: 'Good summary' },
          experience: { score: 85, feedback: 'Strong experience' },
          skills: { score: 90, feedback: 'Comprehensive skills' },
          education: { score: 80, feedback: 'Relevant education' }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { analysis: mockAnalysis }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      expect(result.current.isAnalyzingResume).toBe(false);
      expect(result.current.resumeAnalysis).toBe(null);

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyzeResume(
          'Sample resume text',
          'Software Engineer',
          'Technology'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: 'Sample resume text',
          targetRole: 'Software Engineer',
          targetIndustry: 'Technology',
        }),
      });

      expect(result.current.isAnalyzingResume).toBe(false);
      expect(result.current.resumeAnalysis).toEqual(mockAnalysis);
      expect(analysisResult).toEqual(mockAnalysis);
      expect(result.current.resumeAnalysisError).toBe(null);
    });

    it('should handle resume analysis error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: { message: 'Analysis failed' }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      await act(async () => {
        try {
          await result.current.analyzeResume('Sample resume text');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAnalyzingResume).toBe(false);
      expect(result.current.resumeAnalysisError).toBe('Analysis failed');
      expect(result.current.resumeAnalysis).toBe(null);
    });
  });

  describe('Resume Optimization', () => {
    it('should optimize resume successfully', async () => {
      const mockOptimization = {
        optimizedSections: [
          {
            section: 'Experience',
            original: 'Worked on projects',
            optimized: 'Led 5 cross-functional projects resulting in 30% efficiency improvement',
            improvements: ['Added quantified metrics', 'Used action verbs']
          }
        ],
        keywordSuggestions: [
          {
            category: 'Technical Skills',
            keywords: ['React', 'Node.js', 'TypeScript'],
            placement: 'Skills section and experience descriptions'
          }
        ],
        structuralChanges: [
          {
            change: 'Reorder sections',
            reason: 'Better ATS parsing',
            impact: 'Improved visibility'
          }
        ],
        atsImprovements: [
          {
            issue: 'Complex formatting',
            solution: 'Use simple bullet points',
            priority: 'high'
          }
        ],
        overallScore: 90,
        improvementSummary: ['Enhanced with metrics', 'Improved ATS compatibility']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { optimization: mockOptimization }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      let optimizationResult;
      await act(async () => {
        optimizationResult = await result.current.optimizeResume(
          'Sample resume text',
          'Software Engineer',
          'Technology',
          'Job description',
          ['ats_optimization', 'keyword_enhancement']
        );
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText: 'Sample resume text',
          targetRole: 'Software Engineer',
          targetIndustry: 'Technology',
          jobDescription: 'Job description',
          optimizationGoals: ['ats_optimization', 'keyword_enhancement'],
        }),
      });

      expect(result.current.resumeOptimization).toEqual(mockOptimization);
      expect(optimizationResult).toEqual(mockOptimization);
      expect(result.current.resumeOptimizationError).toBe(null);
    });
  });

  describe('Cover Letter Generation', () => {
    it('should generate cover letter successfully', async () => {
      const mockGeneration = {
        coverLetter: 'Dear Hiring Manager,\n\nI am writing to express my interest...',
        keyPoints: ['Personalized opening', 'Relevant experience highlighted'],
        suggestions: ['Add specific company research', 'Mention recent news'],
        tone: 'professional',
        wordCount: 350
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { generation: mockGeneration }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      let generationResult;
      await act(async () => {
        generationResult = await result.current.generateCoverLetter(
          'Job description text',
          'Google',
          'Software Engineer',
          { name: 'John Doe', skills: ['React', 'Node.js'] },
          'professional',
          'medium'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: 'Job description text',
          companyName: 'Google',
          position: 'Software Engineer',
          userProfile: { name: 'John Doe', skills: ['React', 'Node.js'] },
          tone: 'professional',
          length: 'medium',
        }),
      });

      expect(result.current.coverLetterGeneration).toEqual(mockGeneration);
      expect(generationResult).toEqual(mockGeneration);
      expect(result.current.coverLetterGenerationError).toBe(null);
    });
  });

  describe('Cover Letter Analysis', () => {
    it('should analyze cover letter successfully', async () => {
      const mockAnalysis = {
        overallScore: 78,
        personalization: {
          score: 85,
          companyMentions: 3,
          roleMentions: 2,
          suggestions: ['Mention specific company values']
        },
        structure: {
          score: 80,
          hasOpening: true,
          hasBody: true,
          hasClosing: true,
          suggestions: ['Strengthen the opening hook']
        },
        tone: {
          score: 75,
          assessment: 'Professional and appropriate',
          suggestions: ['Show more enthusiasm']
        },
        improvements: ['Add more specific examples', 'Include quantified achievements']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { analysis: mockAnalysis }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      let analysisResult;
      await act(async () => {
        analysisResult = await result.current.analyzeCoverLetter(
          'Cover letter text',
          'Job description',
          'Google'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/ai/cover-letter-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetterText: 'Cover letter text',
          jobDescription: 'Job description',
          companyName: 'Google',
        }),
      });

      expect(result.current.coverLetterAnalysis).toEqual(mockAnalysis);
      expect(analysisResult).toEqual(mockAnalysis);
      expect(result.current.coverLetterAnalysisError).toBe(null);
    });
  });

  describe('Utility Functions', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useResumeTools());

      // Set some errors first
      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.resumeAnalysisError).toBe(null);
      expect(result.current.resumeOptimizationError).toBe(null);
      expect(result.current.coverLetterGenerationError).toBe(null);
      expect(result.current.coverLetterAnalysisError).toBe(null);
    });

    it('should clear all results and errors', () => {
      const { result } = renderHook(() => useResumeTools());

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.resumeAnalysis).toBe(null);
      expect(result.current.resumeOptimization).toBe(null);
      expect(result.current.coverLetterGeneration).toBe(null);
      expect(result.current.coverLetterAnalysis).toBe(null);
      expect(result.current.resumeAnalysisError).toBe(null);
      expect(result.current.resumeOptimizationError).toBe(null);
      expect(result.current.coverLetterGenerationError).toBe(null);
      expect(result.current.coverLetterAnalysisError).toBe(null);
    });
  });

  describe('Loading States', () => {
    it('should handle loading states correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { analysis: { overallScore: 80 } }
        })
      });

      const { result } = renderHook(() => useResumeTools());

      // Initial state should not be loading
      expect(result.current.isAnalyzingResume).toBe(false);

      // After analysis completes, should not be loading
      await act(async () => {
        await result.current.analyzeResume('Sample resume text');
      });

      expect(result.current.isAnalyzingResume).toBe(false);
      expect(result.current.resumeAnalysis).toBeTruthy();
    });
  });
});