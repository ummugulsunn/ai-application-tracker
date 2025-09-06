/**
 * Integration test for AI service
 * This test verifies that the AI service integration layer works correctly
 */

import { AIService } from '../ai';
import { Application } from '@/types/application';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  matchScore: 85,
                  matchReasons: ['Strong technical skills match', 'Relevant experience'],
                  improvementSuggestions: ['Add more quantified achievements'],
                  successProbability: 75,
                  recommendedActions: ['Follow up in 1 week']
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe('AI Service Integration', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = AIService.getInstance();
  });

  const mockApplication: Application = {
    id: '1',
    company: 'Tech Corp',
    position: 'Software Engineer',
    location: 'San Francisco, CA',
    jobType: 'Full-time',
    salaryRange: '$120,000 - $150,000',
    status: 'Applied',
    appliedDate: '2024-01-15',
    responseDate: null,
    interviewDate: null,
    notes: 'Applied through company website',
    contactPerson: 'John Doe',
    contactEmail: 'john@techcorp.com',
    companyWebsite: 'https://techcorp.com',
    tags: ['JavaScript', 'React', 'Node.js'],
    priority: 'High',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    jobDescription: 'Looking for a skilled software engineer...',
    requirements: ['JavaScript', 'React', '3+ years experience']
  };

  test('AI service should be a singleton', () => {
    const instance1 = AIService.getInstance();
    const instance2 = AIService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should calculate success rates for empty applications', () => {
    const result = aiService.calculateSuccessRates([]);

    expect(result.overallTrend).toBe('stable');
    expect(result.trendScore).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.keyInsights).toContain('No applications to analyze');
    expect(result.recommendations[0]).toHaveProperty('action');
    expect(result.recommendations[0].action).toContain('Start applying to jobs to get insights');
    expect(result.monthlyStats).toEqual([]);
    expect(result.performanceMetrics).toHaveProperty('averageApplicationsPerWeek');
  });

  test('should calculate success rates for applications with data', () => {
    const applications: Application[] = [
      { ...mockApplication, id: '1', status: 'Applied' },
      { ...mockApplication, id: '2', status: 'Interviewing' },
      { ...mockApplication, id: '3', status: 'Offered' },
      { ...mockApplication, id: '4', status: 'Rejected' },
      { ...mockApplication, id: '5', status: 'Accepted' },
    ];

    const result = aiService.calculateSuccessRates(applications);

    expect(result).toHaveProperty('overallTrend');
    expect(result).toHaveProperty('trendScore');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('keyInsights');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('monthlyStats');
    expect(result).toHaveProperty('performanceMetrics');

    expect(['improving', 'declining', 'stable']).toContain(result.overallTrend);
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.keyInsights)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(Array.isArray(result.monthlyStats)).toBe(true);
    expect(result.performanceMetrics).toHaveProperty('averageApplicationsPerWeek');
  });

  test('should analyze application patterns with sufficient data', async () => {
    const applications: Application[] = [
      { ...mockApplication, id: '1', status: 'Applied' },
      { ...mockApplication, id: '2', status: 'Interviewing', company: 'StartupCo' },
      { ...mockApplication, id: '3', status: 'Offered', company: 'BigTech' },
      { ...mockApplication, id: '4', status: 'Rejected', company: 'MediumCorp' },
      { ...mockApplication, id: '5', status: 'Accepted', company: 'DreamJob' },
    ];

    const result = await aiService.analyzeApplicationPatterns(applications);

    expect(result).toHaveProperty('successRate');
    expect(result).toHaveProperty('responseRate');
    expect(result).toHaveProperty('interviewRate');
    expect(result).toHaveProperty('averageResponseTime');
    expect(result).toHaveProperty('bestPerformingCompanies');
    expect(result).toHaveProperty('bestPerformingIndustries');
    expect(result).toHaveProperty('optimalApplicationTiming');
    expect(result).toHaveProperty('applicationFrequency');
    expect(result).toHaveProperty('trends');
    expect(result).toHaveProperty('keyInsights');
    expect(result).toHaveProperty('actionableRecommendations');

    expect(typeof result.successRate).toBe('number');
    expect(typeof result.responseRate).toBe('number');
    expect(typeof result.interviewRate).toBe('number');
    expect(Array.isArray(result.trends)).toBe(true);
    expect(Array.isArray(result.keyInsights)).toBe(true);
    expect(Array.isArray(result.actionableRecommendations)).toBe(true);
  });

  test('should analyze individual application', async () => {
    const result = await aiService.analyzeApplication(mockApplication);

    expect(result).toHaveProperty('matchScore');
    expect(result).toHaveProperty('matchReasons');
    expect(result).toHaveProperty('improvementSuggestions');
    expect(result).toHaveProperty('successProbability');
    expect(result).toHaveProperty('recommendedActions');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('analysisDate');

    expect(typeof result.matchScore).toBe('number');
    expect(Array.isArray(result.matchReasons)).toBe(true);
    expect(Array.isArray(result.improvementSuggestions)).toBe(true);
    expect(typeof result.successProbability).toBe('number');
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    expect(typeof result.confidence).toBe('number');
    expect(typeof result.analysisDate).toBe('string');
  });
});

describe('AI Service Error Handling', () => {
  test('should handle OpenAI API errors gracefully', async () => {
    // Temporarily remove API key to simulate service unavailable
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const aiService = AIService.getInstance();
    const mockApplication: Application = {
      id: '1',
      company: 'Test Corp',
      position: 'Developer',
      location: 'Remote',
      jobType: 'Full-time',
      salaryRange: '$100k',
      status: 'Applied',
      appliedDate: '2024-01-01',
      responseDate: null,
      interviewDate: null,
      notes: '',
      contactPerson: '',
      contactEmail: '',
      companyWebsite: '',
      tags: [],
      priority: 'Medium',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    // The enhanced AI service now returns fallback analysis instead of throwing
    const result = await aiService.analyzeApplication(mockApplication);
    expect(result).toHaveProperty('matchScore');
    expect(result).toHaveProperty('confidence');
    // Should have lower confidence for fallback analysis
    expect(result.confidence).toBeLessThan(70);

    // Restore API key
    process.env.OPENAI_API_KEY = originalKey;
  });
});

console.log('✅ AI Service Integration Layer - All tests configured and ready to run');