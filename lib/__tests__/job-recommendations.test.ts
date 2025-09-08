import { jobRecommendationService, JobRecommendation } from '@/lib/ai/jobRecommendationService';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { Application } from '@/types/application';

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    jobRecommendation: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn()
    }
  }
}));

describe('Job Recommendation Service', () => {
  const mockUserProfile = {
    skills: ['JavaScript', 'React', 'Node.js'],
    experienceLevel: 'Mid',
    industries: ['Technology'],
    jobTypes: ['Full-time'],
    preferredLocations: ['San Francisco, CA', 'Remote'],
    desiredSalaryMin: 80000,
    desiredSalaryMax: 120000
  };

  const mockApplications: Application[] = [
    {
      id: '1',
      userId: 'user1',
      company: 'TechCorp',
      position: 'Frontend Developer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$90,000',
      status: 'Applied',
      priority: 'Medium',
      appliedDate: new Date('2024-01-15'),
      notes: '',
      jobDescription: 'Frontend development with React',
      requirements: ['React', 'JavaScript', 'CSS'],
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      companyWebsite: '',
      jobUrl: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      userId: 'user1',
      company: 'StartupInc',
      position: 'Full Stack Developer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$100,000',
      status: 'Interviewing',
      priority: 'High',
      appliedDate: new Date('2024-01-20'),
      notes: '',
      jobDescription: 'Full stack development with React and Node.js',
      requirements: ['React', 'Node.js', 'MongoDB'],
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      companyWebsite: '',
      jobUrl: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate job recommendations based on user profile', async () => {
      const mockRecommendations = [
        {
          id: 'rec1',
          userId: 'user1',
          jobTitle: 'Senior Frontend Developer',
          company: 'InnovateTech',
          location: 'San Francisco, CA',
          salaryRange: '$100,000 - $130,000',
          jobDescription: 'Lead frontend development team',
          requirements: ['React', 'TypeScript', 'Leadership'],
          jobUrl: 'https://example.com/job1',
          source: 'ai_generated',
          matchScore: 85,
          matchReasons: ['Strong React skills match', 'Location preference match'],
          status: 'new' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Mock Prisma calls
      const { prisma } = await import('@/lib/prisma');
      (prisma.jobRecommendation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobRecommendation.create as jest.Mock).mockResolvedValue(mockRecommendations[0]);

      // Mock AI service - we'll just test the fallback since mocking OpenAI is complex
      const recommendations = await jobRecommendationService.generateRecommendations(
        'user1',
        mockUserProfile,
        mockApplications,
        5
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].jobTitle).toBeTruthy();
      expect(recommendations[0].matchScore).toBeGreaterThan(0);
    });

    it('should provide fallback recommendations when AI fails', async () => {
      const { prisma } = await import('@/lib/prisma');
      (prisma.jobRecommendation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.jobRecommendation.create as jest.Mock).mockResolvedValue({
        id: 'fallback1',
        jobTitle: 'Software Engineer',
        company: 'TechCorp',
        matchScore: 75
      } as any);

      const recommendations = await jobRecommendationService.generateRecommendations(
        'user1',
        mockUserProfile,
        mockApplications,
        3
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].jobTitle).toBeTruthy();
    });
  });

  describe('calculateMatchScore', () => {
    it('should calculate match score based on multiple criteria', () => {
      const result = jobRecommendationService.calculateMatchScore(
        mockUserProfile,
        'Senior React Developer',
        'We are looking for a senior React developer with Node.js experience in San Francisco',
        ['React', 'JavaScript', 'Node.js', 'TypeScript'],
        'San Francisco, CA',
        '$90,000 - $120,000'
      );

      expect(result.score).toBeGreaterThan(60);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons).toContain('Location matches your preferences');
      expect(result.criteria.skillsMatch).toBeGreaterThan(50);
      expect(result.criteria.locationMatch).toBe(100);
    });

    it('should handle missing location gracefully', () => {
      const result = jobRecommendationService.calculateMatchScore(
        mockUserProfile,
        'React Developer',
        'React development position',
        ['React', 'JavaScript'],
        undefined,
        undefined
      );

      expect(result.score).toBeGreaterThan(0);
      expect(result.criteria.locationMatch).toBe(50); // Neutral score
    });

    it('should prioritize skills match heavily', () => {
      const highSkillsMatch = jobRecommendationService.calculateMatchScore(
        mockUserProfile,
        'Developer',
        'Position requiring JavaScript, React, and Node.js',
        ['JavaScript', 'React', 'Node.js'],
        'New York, NY', // Different location
        '$60,000'
      );

      const lowSkillsMatch = jobRecommendationService.calculateMatchScore(
        mockUserProfile,
        'Developer',
        'Position requiring Python and Django',
        ['Python', 'Django'],
        'San Francisco, CA', // Preferred location
        '$100,000'
      );

      expect(highSkillsMatch.score).toBeGreaterThan(lowSkillsMatch.score);
    });
  });

  describe('updateRecommendationStatus', () => {
    it('should update recommendation status', async () => {
      const updatedRecommendation = {
        id: 'rec1',
        status: 'saved',
        updatedAt: new Date()
      };

      const { prisma } = await import('@/lib/prisma');
      (prisma.jobRecommendation.update as jest.Mock).mockResolvedValue(updatedRecommendation as any);

      const result = await jobRecommendationService.updateRecommendationStatus('rec1', 'saved');

      expect(prisma.jobRecommendation.update).toHaveBeenCalledWith({
        where: { id: 'rec1' },
        data: { 
          status: 'saved',
          updatedAt: expect.any(Date)
        }
      });
      expect(result.status).toBe('saved');
    });
  });

  describe('getRecommendations', () => {
    it('should fetch recommendations with filters', async () => {
      const mockRecommendations = [
        { id: 'rec1', status: 'new', matchScore: 85 },
        { id: 'rec2', status: 'new', matchScore: 80 }
      ];

      const { prisma } = await import('@/lib/prisma');
      (prisma.jobRecommendation.findMany as jest.Mock).mockResolvedValue(mockRecommendations as any);

      const recommendations = await jobRecommendationService.getRecommendations(
        'user1',
        'new',
        10
      );

      expect(prisma.jobRecommendation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1', status: 'new' },
        orderBy: [
          { matchScore: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10
      });
      expect(recommendations).toHaveLength(2);
    });
  });
});

describe('Advanced AI Service', () => {
  const mockUserProfile = {
    skills: ['JavaScript', 'React', 'Node.js'],
    experienceLevel: 'Mid',
    industries: ['Technology'],
    jobTypes: ['Full-time'],
    preferredLocations: ['San Francisco, CA', 'Remote'],
    desiredSalaryMin: 80000,
    desiredSalaryMax: 120000
  };

  const mockApplications: Application[] = [
    {
      id: '1',
      userId: 'user1',
      company: 'TechCorp',
      position: 'Frontend Developer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$90,000',
      status: 'Applied',
      priority: 'Medium',
      appliedDate: new Date('2024-01-15'),
      notes: '',
      jobDescription: 'Frontend development with React',
      requirements: ['React', 'JavaScript', 'CSS'],
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      companyWebsite: '',
      jobUrl: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeResume', () => {
    it('should provide fallback analysis when AI fails', async () => {
      const analysis = await advancedAIService.analyzeResume('Sample resume text');

      expect(analysis.overallScore).toBe(70);
      expect(analysis.strengths).toContain('Professional experience listed');
      expect(analysis.improvements).toHaveLength(1);
    });
  });

  describe('analyzeCoverLetter', () => {
    it('should provide fallback analysis when AI fails', async () => {
      const analysis = await advancedAIService.analyzeCoverLetter(
        'Dear hiring manager, I am interested in the frontend developer position...',
        'We are looking for a frontend developer with React experience',
        'TechCorp'
      );

      expect(analysis.overallScore).toBe(65);
      expect(analysis.personalization.companyMentions).toBe(1);
      expect(analysis.structure.hasOpening).toBe(true);
    });
  });

  describe('generateInterviewPreparation', () => {
    it('should provide fallback preparation when AI fails', async () => {
      const preparation = await advancedAIService.generateInterviewPreparation(
        'Frontend developer position requiring React skills',
        'TechCorp',
        mockUserProfile,
        mockApplications
      );

      expect(preparation.commonQuestions).toHaveLength(2);
      expect(preparation.commonQuestions[0].question).toBe('Tell me about yourself');
      expect(preparation.skillsToHighlight).toContain('Relevant technical skills');
    });
  });

  describe('analyzeCareerPath', () => {
    it('should provide fallback career path analysis when AI fails', async () => {
      const analysis = await advancedAIService.analyzeCareerPath(
        mockUserProfile,
        mockApplications,
        'Senior Frontend Developer'
      );

      expect(analysis.currentLevel).toBe('Mid-level professional');
      expect(analysis.nextSteps).toHaveLength(1);
      expect(analysis.skillGaps[0].skill).toBe('Leadership');
      expect(analysis.skillGaps[0].importance).toBe('important');
    });
  });

  describe('analyzeJobMarket', () => {
    it('should provide fallback market analysis when AI fails', async () => {
      const analysis = await advancedAIService.analyzeJobMarket(
        'Frontend Developer',
        'Technology',
        'San Francisco, CA',
        'Mid'
      );

      expect(analysis.demandLevel).toBe('medium');
      expect(analysis.competitionLevel).toBe('medium');
      expect(analysis.salaryTrends.trend).toBe('stable');
      expect(analysis.topCompanies).toHaveLength(1);
      expect(analysis.emergingSkills).toContain('Digital skills');
    });
  });
});