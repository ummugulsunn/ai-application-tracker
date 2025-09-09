import OpenAI from 'openai';
import { Application } from '@/types/application';
import { prisma } from '@/lib/prisma';

// Initialize OpenAI client
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3,
    });
  }
} catch (error) {
  console.warn('OpenAI client initialization failed:', error);
}

export interface JobRecommendation {
  id: string;
  userId: string;
  jobTitle: string;
  company: string;
  location?: string;
  salaryRange?: string;
  jobDescription?: string;
  requirements: string[];
  jobUrl?: string;
  source: string;
  matchScore: number;
  matchReasons: string[];
  status: 'new' | 'viewed' | 'saved' | 'applied' | 'dismissed';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  skills: string[];
  experienceLevel: string;
  industries: string[];
  jobTypes: string[];
  preferredLocations: string[];
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
}

export interface JobMatchCriteria {
  titleMatch: number;
  skillsMatch: number;
  locationMatch: number;
  salaryMatch: number;
  experienceMatch: number;
  industryMatch: number;
}

export class JobRecommendationService {
  private static instance: JobRecommendationService;
  
  private constructor() {}
  
  public static getInstance(): JobRecommendationService {
    if (!JobRecommendationService.instance) {
      JobRecommendationService.instance = new JobRecommendationService();
    }
    return JobRecommendationService.instance;
  }

  /**
   * Generate job recommendations based on user profile and application history
   */
  async generateRecommendations(
    userId: string,
    userProfile: UserProfile,
    applications: Application[],
    limit: number = 10
  ): Promise<JobRecommendation[]> {
    try {
      // Get existing recommendations to avoid duplicates
      const existingRecommendations = await prisma.jobRecommendation.findMany({
        where: { userId },
        select: { jobTitle: true, company: true }
      });

      const existingJobs = new Set(
        existingRecommendations.map(rec => `${rec.company}-${rec.jobTitle}`)
      );

      // Generate AI-powered job recommendations
      const aiRecommendations = await this.generateAIRecommendations(
        userProfile,
        applications,
        limit * 2 // Generate more to filter out duplicates
      );

      // Filter out existing recommendations and limit results
      const newRecommendations = aiRecommendations
        .filter(rec => !existingJobs.has(`${rec.company}-${rec.jobTitle}`))
        .slice(0, limit);

      // Save recommendations to database
      const savedRecommendations = await Promise.all(
        newRecommendations.map(rec => this.saveRecommendation(userId, rec))
      );

      return savedRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      
      // Return fallback recommendations
      return this.generateFallbackRecommendations(userId, userProfile, applications, limit);
    }
  }

  /**
   * Generate AI-powered job recommendations using OpenAI
   */
  private async generateAIRecommendations(
    userProfile: UserProfile,
    applications: Application[],
    limit: number
  ): Promise<Partial<JobRecommendation>[]> {
    if (!openai) {
      throw new Error('OpenAI client not available');
    }

    const prompt = this.buildRecommendationPrompt(userProfile, applications, limit);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert career advisor and job market analyst. Generate personalized job recommendations based on user profile and application history.
          
          Respond with valid JSON array in this format:
          [
            {
              "jobTitle": "string",
              "company": "string", 
              "location": "string",
              "salaryRange": "string",
              "jobDescription": "string",
              "requirements": ["req1", "req2"],
              "jobUrl": "string",
              "source": "ai_generated",
              "matchScore": number (0-100),
              "matchReasons": ["reason1", "reason2"]
            }
          ]`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    return this.parseAIRecommendations(response);
  }

  /**
   * Build prompt for AI job recommendation generation
   */
  private buildRecommendationPrompt(
    userProfile: UserProfile,
    applications: Application[],
    limit: number
  ): string {
    const successfulApplications = applications.filter(app => 
      ['Interviewing', 'Offered', 'Accepted'].includes(app.status)
    );

    const appliedCompanies = applications.map(app => app.company);
    const appliedPositions = applications.map(app => app.position);

    return `
Generate ${limit} personalized job recommendations for a user with the following profile:

User Profile:
- Skills: ${userProfile.skills.join(', ')}
- Experience Level: ${userProfile.experienceLevel}
- Industries: ${userProfile.industries.join(', ')}
- Job Types: ${userProfile.jobTypes.join(', ')}
- Preferred Locations: ${userProfile.preferredLocations.join(', ')}
- Salary Range: ${userProfile.desiredSalaryMin ? `$${userProfile.desiredSalaryMin}` : 'Not specified'} - ${userProfile.desiredSalaryMax ? `$${userProfile.desiredSalaryMax}` : 'Not specified'}

Application History:
- Total Applications: ${applications.length}
- Successful Applications: ${successfulApplications.length}
- Companies Applied To: ${appliedCompanies.slice(0, 10).join(', ')}${appliedCompanies.length > 10 ? '...' : ''}
- Positions Applied For: ${appliedPositions.slice(0, 10).join(', ')}${appliedPositions.length > 10 ? '...' : ''}

Successful Application Patterns:
${successfulApplications.slice(0, 5).map(app => 
  `- ${app.position} at ${app.company} (${app.status})`
).join('\n')}

Requirements:
1. Recommend jobs that align with the user's skills and experience level
2. Consider successful application patterns to suggest similar opportunities
3. Avoid companies and positions the user has already applied to
4. Include realistic salary ranges based on experience level and location
5. Provide specific match reasons for each recommendation
6. Focus on opportunities with high success probability
7. Include diverse companies and industries within the user's preferences

Generate realistic job recommendations with actual company names and detailed job descriptions.
`;
  }

  /**
   * Parse AI-generated recommendations
   */
  private parseAIRecommendations(response: string): Partial<JobRecommendation>[] {
    try {
      const parsed = JSON.parse(response);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map(rec => ({
        jobTitle: rec.jobTitle || 'Unknown Position',
        company: rec.company || 'Unknown Company',
        location: rec.location,
        salaryRange: rec.salaryRange,
        jobDescription: rec.jobDescription,
        requirements: Array.isArray(rec.requirements) ? rec.requirements : [],
        jobUrl: rec.jobUrl,
        source: 'ai_generated',
        matchScore: Math.min(100, Math.max(0, rec.matchScore || 50)),
        matchReasons: Array.isArray(rec.matchReasons) ? rec.matchReasons : []
      }));
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      throw new Error('Failed to parse AI recommendations');
    }
  }

  /**
   * Save recommendation to database
   */
  private async saveRecommendation(
    userId: string,
    recommendation: Partial<JobRecommendation>
  ): Promise<JobRecommendation> {
    return await prisma.jobRecommendation.create({
      data: {
        userId,
        jobTitle: recommendation.jobTitle!,
        company: recommendation.company!,
        location: recommendation.location,
        salaryRange: recommendation.salaryRange,
        jobDescription: recommendation.jobDescription,
        requirements: recommendation.requirements || [],
        jobUrl: recommendation.jobUrl,
        source: recommendation.source || 'ai_generated',
        matchScore: recommendation.matchScore || 50,
        matchReasons: recommendation.matchReasons || [],
        status: 'new'
      }
    });
  }

  /**
   * Generate fallback recommendations when AI is unavailable
   */
  private async generateFallbackRecommendations(
    userId: string,
    userProfile: UserProfile,
    applications: Application[],
    limit: number
  ): Promise<JobRecommendation[]> {
    const fallbackJobs = this.getFallbackJobData(userProfile);
    
    const recommendations = fallbackJobs.slice(0, limit).map(async (job, index) => {
      return await this.saveRecommendation(userId, {
        ...job,
        matchScore: 60 + (index * 2), // Vary scores slightly
        matchReasons: [`Matches ${userProfile.experienceLevel} level`, 'Aligns with your skills']
      });
    });

    return await Promise.all(recommendations);
  }

  /**
   * Get fallback job data based on user profile
   */
  private getFallbackJobData(userProfile: UserProfile): Partial<JobRecommendation>[] {
    const fallbackJobs: Partial<JobRecommendation>[] = [];

    // Generate fallback jobs based on user's industries and skills
    if (userProfile.industries.includes('Technology')) {
      fallbackJobs.push(
        {
          jobTitle: 'Software Engineer',
          company: 'TechCorp',
          location: userProfile.preferredLocations[0] || 'Remote',
          salaryRange: '$80,000 - $120,000',
          jobDescription: 'Join our engineering team to build innovative software solutions.',
          requirements: ['Programming', 'Problem Solving', 'Team Collaboration'],
          source: 'fallback',
          matchScore: 75
        },
        {
          jobTitle: 'Product Manager',
          company: 'InnovateTech',
          location: userProfile.preferredLocations[0] || 'Remote',
          salaryRange: '$90,000 - $130,000',
          jobDescription: 'Lead product development and strategy for our flagship products.',
          requirements: ['Product Strategy', 'Analytics', 'Communication'],
          source: 'fallback',
          matchScore: 70
        }
      );
    }

    if (userProfile.industries.includes('Finance')) {
      fallbackJobs.push(
        {
          jobTitle: 'Financial Analyst',
          company: 'FinanceFirst',
          location: userProfile.preferredLocations[0] || 'New York, NY',
          salaryRange: '$70,000 - $100,000',
          jobDescription: 'Analyze financial data and provide insights for investment decisions.',
          requirements: ['Financial Analysis', 'Excel', 'Data Analysis'],
          source: 'fallback',
          matchScore: 72
        }
      );
    }

    if (userProfile.industries.includes('Marketing')) {
      fallbackJobs.push(
        {
          jobTitle: 'Digital Marketing Manager',
          company: 'MarketPro',
          location: userProfile.preferredLocations[0] || 'Remote',
          salaryRange: '$65,000 - $95,000',
          jobDescription: 'Develop and execute digital marketing campaigns across multiple channels.',
          requirements: ['Digital Marketing', 'Analytics', 'Content Strategy'],
          source: 'fallback',
          matchScore: 68
        }
      );
    }

    // Add generic recommendations if no specific industry matches
    if (fallbackJobs.length === 0) {
      fallbackJobs.push(
        {
          jobTitle: 'Business Analyst',
          company: 'GlobalCorp',
          location: userProfile.preferredLocations[0] || 'Remote',
          salaryRange: '$60,000 - $90,000',
          jobDescription: 'Analyze business processes and recommend improvements.',
          requirements: ['Analysis', 'Communication', 'Problem Solving'],
          source: 'fallback',
          matchScore: 65
        },
        {
          jobTitle: 'Project Manager',
          company: 'ProjectPro',
          location: userProfile.preferredLocations[0] || 'Remote',
          salaryRange: '$70,000 - $100,000',
          jobDescription: 'Lead cross-functional teams to deliver projects on time and budget.',
          requirements: ['Project Management', 'Leadership', 'Organization'],
          source: 'fallback',
          matchScore: 63
        }
      );
    }

    return fallbackJobs;
  }

  /**
   * Get recommendations for a user
   */
  async getRecommendations(
    userId: string,
    status?: string,
    limit: number = 20
  ): Promise<JobRecommendation[]> {
    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    return await prisma.jobRecommendation.findMany({
      where,
      orderBy: [
        { matchScore: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Update recommendation status
   */
  async updateRecommendationStatus(
    recommendationId: string,
    status: 'viewed' | 'saved' | 'applied' | 'dismissed'
  ): Promise<JobRecommendation> {
    return await prisma.jobRecommendation.update({
      where: { id: recommendationId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete recommendation
   */
  async deleteRecommendation(recommendationId: string): Promise<void> {
    await prisma.jobRecommendation.delete({
      where: { id: recommendationId }
    });
  }

  /**
   * Calculate match score between user profile and job
   */
  calculateMatchScore(
    userProfile: UserProfile,
    jobTitle: string,
    jobDescription: string,
    requirements: string[],
    location?: string,
    salaryRange?: string
  ): { score: number; criteria: JobMatchCriteria; reasons: string[] } {
    const criteria: JobMatchCriteria = {
      titleMatch: 0,
      skillsMatch: 0,
      locationMatch: 0,
      salaryMatch: 0,
      experienceMatch: 0,
      industryMatch: 0
    };

    const reasons: string[] = [];

    // Title match (20% weight)
    const titleWords = jobTitle.toLowerCase().split(' ');
    const userSkillsLower = userProfile.skills.map(s => s.toLowerCase());
    const titleMatchCount = titleWords.filter(word => 
      userSkillsLower.some(skill => skill.includes(word) || word.includes(skill))
    ).length;
    criteria.titleMatch = Math.min(100, (titleMatchCount / titleWords.length) * 100);
    
    if (criteria.titleMatch > 50) {
      reasons.push('Job title aligns with your skills');
    }

    // Skills match (30% weight)
    const jobRequirementsLower = requirements.map(r => r.toLowerCase());
    const skillMatches = userProfile.skills.filter(skill =>
      jobRequirementsLower.some(req => 
        req.includes(skill.toLowerCase()) || skill.toLowerCase().includes(req)
      )
    );
    criteria.skillsMatch = Math.min(100, (skillMatches.length / Math.max(userProfile.skills.length, 1)) * 100);
    
    if (criteria.skillsMatch > 60) {
      reasons.push(`${skillMatches.length} of your skills match the requirements`);
    }

    // Location match (15% weight)
    if (location && userProfile.preferredLocations.length > 0) {
      const locationMatch = userProfile.preferredLocations.some(prefLoc =>
        location.toLowerCase().includes(prefLoc.toLowerCase()) ||
        prefLoc.toLowerCase().includes(location.toLowerCase()) ||
        location.toLowerCase().includes('remote')
      );
      criteria.locationMatch = locationMatch ? 100 : 0;
      
      if (locationMatch) {
        reasons.push('Location matches your preferences');
      }
    } else {
      criteria.locationMatch = 50; // Neutral if no location data
    }

    // Experience match (20% weight)
    const jobDescLower = jobDescription.toLowerCase();
    const expLevel = userProfile.experienceLevel.toLowerCase();
    
    if (
      (expLevel.includes('entry') && (jobDescLower.includes('entry') || jobDescLower.includes('junior'))) ||
      (expLevel.includes('mid') && (jobDescLower.includes('mid') || jobDescLower.includes('intermediate'))) ||
      (expLevel.includes('senior') && (jobDescLower.includes('senior') || jobDescLower.includes('lead'))) ||
      (expLevel.includes('executive') && (jobDescLower.includes('director') || jobDescLower.includes('vp')))
    ) {
      criteria.experienceMatch = 100;
      reasons.push('Experience level matches the role');
    } else {
      criteria.experienceMatch = 30;
    }

    // Industry match (15% weight)
    const industryMatches = userProfile.industries.some(industry =>
      jobDescription.toLowerCase().includes(industry.toLowerCase()) ||
      jobTitle.toLowerCase().includes(industry.toLowerCase())
    );
    criteria.industryMatch = industryMatches ? 100 : 30;
    
    if (industryMatches) {
      reasons.push('Industry aligns with your background');
    }

    // Calculate weighted score
    const score = Math.round(
      (criteria.titleMatch * 0.2) +
      (criteria.skillsMatch * 0.3) +
      (criteria.locationMatch * 0.15) +
      (criteria.experienceMatch * 0.2) +
      (criteria.industryMatch * 0.15)
    );

    return { score, criteria, reasons };
  }
}

export const jobRecommendationService = JobRecommendationService.getInstance();