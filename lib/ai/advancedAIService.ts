import OpenAI from 'openai';
import { Application } from '@/types/application';
import { aiService } from '@/lib/ai';

export interface UserProfile {
  name?: string;
  skills?: string[];
  experience?: string;
  achievements?: string[];
  education?: string;
  certifications?: string[];
}

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

export interface ResumeAnalysis {
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

export interface CoverLetterAnalysis {
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

export interface InterviewPreparation {
  commonQuestions: Array<{
    question: string;
    category: string;
    suggestedAnswer: string;
    tips: string[];
  }>;
  companyResearch: {
    keyPoints: string[];
    questionsToAsk: string[];
    recentNews: string[];
  };
  skillsToHighlight: string[];
  weaknessesToAddress: string[];
  salaryNegotiation: {
    marketRange: string;
    negotiationTips: string[];
    timing: string;
  };
}

export interface CareerPathAnalysis {
  currentLevel: string;
  nextSteps: Array<{
    role: string;
    timeframe: string;
    requirements: string[];
    salaryRange: string;
  }>;
  skillGaps: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    learningResources: string[];
  }>;
  industryTrends: string[];
  recommendations: string[];
}

export interface MarketAnalysis {
  demandLevel: 'high' | 'medium' | 'low';
  competitionLevel: 'high' | 'medium' | 'low';
  salaryTrends: {
    current: string;
    trend: 'increasing' | 'stable' | 'decreasing';
    factors: string[];
  };
  topCompanies: Array<{
    name: string;
    openings: number;
    averageSalary: string;
    culture: string;
  }>;
  emergingSkills: string[];
  locationAnalysis: Array<{
    location: string;
    opportunities: number;
    averageSalary: string;
    costOfLiving: string;
  }>;
}

export class AdvancedAIService {
  private static instance: AdvancedAIService;
  
  private constructor() {}
  
  public static getInstance(): AdvancedAIService {
    if (!AdvancedAIService.instance) {
      AdvancedAIService.instance = new AdvancedAIService();
    }
    return AdvancedAIService.instance;
  }

  /**
   * Analyze resume content and provide detailed feedback
   */
  async analyzeResume(
    resumeText: string,
    targetRole?: string,
    targetIndustry?: string
  ): Promise<ResumeAnalysis> {
    if (!openai) {
      return this.generateFallbackResumeAnalysis();
    }

    try {
      const prompt = this.buildResumeAnalysisPrompt(resumeText, targetRole, targetIndustry);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume reviewer and career coach. Analyze resumes and provide detailed, actionable feedback to improve job search success.
            
            Respond with valid JSON in this format:
            {
              "overallScore": number (0-100),
              "strengths": ["strength1", "strength2"],
              "weaknesses": ["weakness1", "weakness2"],
              "improvements": [
                {
                  "category": "string",
                  "suggestion": "string",
                  "priority": "high|medium|low",
                  "impact": "string"
                }
              ],
              "keywordOptimization": {
                "missingKeywords": ["keyword1", "keyword2"],
                "overusedKeywords": ["keyword1", "keyword2"],
                "industryKeywords": ["keyword1", "keyword2"]
              },
              "atsCompatibility": {
                "score": number (0-100),
                "issues": ["issue1", "issue2"],
                "recommendations": ["rec1", "rec2"]
              },
              "sectionAnalysis": {
                "summary": {"score": number, "feedback": "string"},
                "experience": {"score": number, "feedback": "string"},
                "skills": {"score": number, "feedback": "string"},
                "education": {"score": number, "feedback": "string"}
              }
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseResumeAnalysis(response);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      return this.generateFallbackResumeAnalysis();
    }
  }

  /**
   * Analyze cover letter and provide feedback
   */
  async analyzeCoverLetter(
    coverLetterText: string,
    jobDescription: string,
    companyName: string
  ): Promise<CoverLetterAnalysis> {
    if (!openai) {
      return this.generateFallbackCoverLetterAnalysis();
    }

    try {
      const prompt = this.buildCoverLetterAnalysisPrompt(coverLetterText, jobDescription, companyName);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert career coach specializing in cover letter optimization. Analyze cover letters and provide detailed feedback.
            
            Respond with valid JSON in this format:
            {
              "overallScore": number (0-100),
              "personalization": {
                "score": number (0-100),
                "companyMentions": number,
                "roleMentions": number,
                "suggestions": ["suggestion1", "suggestion2"]
              },
              "structure": {
                "score": number (0-100),
                "hasOpening": boolean,
                "hasBody": boolean,
                "hasClosing": boolean,
                "suggestions": ["suggestion1", "suggestion2"]
              },
              "tone": {
                "score": number (0-100),
                "assessment": "string",
                "suggestions": ["suggestion1", "suggestion2"]
              },
              "improvements": ["improvement1", "improvement2"]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseCoverLetterAnalysis(response);
    } catch (error) {
      console.error('Error analyzing cover letter:', error);
      return this.generateFallbackCoverLetterAnalysis();
    }
  }

  /**
   * Generate interview preparation materials
   */
  async generateInterviewPreparation(
    jobDescription: string,
    companyName: string,
    userProfile: UserProfile,
    applications: Application[]
  ): Promise<InterviewPreparation> {
    if (!openai) {
      return this.generateFallbackInterviewPreparation();
    }

    try {
      const prompt = this.buildInterviewPrepPrompt(jobDescription, companyName, userProfile, applications);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert interview coach. Generate comprehensive interview preparation materials tailored to specific roles and companies.
            
            Respond with valid JSON in this format:
            {
              "commonQuestions": [
                {
                  "question": "string",
                  "category": "string",
                  "suggestedAnswer": "string",
                  "tips": ["tip1", "tip2"]
                }
              ],
              "companyResearch": {
                "keyPoints": ["point1", "point2"],
                "questionsToAsk": ["question1", "question2"],
                "recentNews": ["news1", "news2"]
              },
              "skillsToHighlight": ["skill1", "skill2"],
              "weaknessesToAddress": ["weakness1", "weakness2"],
              "salaryNegotiation": {
                "marketRange": "string",
                "negotiationTips": ["tip1", "tip2"],
                "timing": "string"
              }
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 3500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseInterviewPreparation(response);
    } catch (error) {
      console.error('Error generating interview preparation:', error);
      return this.generateFallbackInterviewPreparation();
    }
  }

  /**
   * Analyze career path and provide recommendations
   */
  async analyzeCareerPath(
    userProfile: UserProfile,
    applications: Application[],
    targetRole?: string
  ): Promise<CareerPathAnalysis> {
    if (!openai) {
      return this.generateFallbackCareerPathAnalysis();
    }

    try {
      const prompt = this.buildCareerPathPrompt(userProfile, applications, targetRole);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior career strategist. Analyze career paths and provide strategic guidance for professional growth.
            
            Respond with valid JSON in this format:
            {
              "currentLevel": "string",
              "nextSteps": [
                {
                  "role": "string",
                  "timeframe": "string",
                  "requirements": ["req1", "req2"],
                  "salaryRange": "string"
                }
              ],
              "skillGaps": [
                {
                  "skill": "string",
                  "importance": "critical|important|nice-to-have",
                  "learningResources": ["resource1", "resource2"]
                }
              ],
              "industryTrends": ["trend1", "trend2"],
              "recommendations": ["rec1", "rec2"]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseCareerPathAnalysis(response);
    } catch (error) {
      console.error('Error analyzing career path:', error);
      return this.generateFallbackCareerPathAnalysis();
    }
  }

  /**
   * Analyze job market for specific role/industry
   */
  async analyzeJobMarket(
    role: string,
    industry: string,
    location: string,
    experienceLevel: string
  ): Promise<MarketAnalysis> {
    if (!openai) {
      return this.generateFallbackMarketAnalysis();
    }

    try {
      const prompt = this.buildMarketAnalysisPrompt(role, industry, location, experienceLevel);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a job market analyst with expertise in employment trends and salary data. Provide comprehensive market analysis.
            
            Respond with valid JSON in this format:
            {
              "demandLevel": "high|medium|low",
              "competitionLevel": "high|medium|low",
              "salaryTrends": {
                "current": "string",
                "trend": "increasing|stable|decreasing",
                "factors": ["factor1", "factor2"]
              },
              "topCompanies": [
                {
                  "name": "string",
                  "openings": number,
                  "averageSalary": "string",
                  "culture": "string"
                }
              ],
              "emergingSkills": ["skill1", "skill2"],
              "locationAnalysis": [
                {
                  "location": "string",
                  "opportunities": number,
                  "averageSalary": "string",
                  "costOfLiving": "string"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      return this.parseMarketAnalysis(response);
    } catch (error) {
      console.error('Error analyzing job market:', error);
      return this.generateFallbackMarketAnalysis();
    }
  }

  // Private helper methods for building prompts
  private buildResumeAnalysisPrompt(resumeText: string, targetRole?: string, targetIndustry?: string): string {
    return `
Analyze this resume and provide detailed feedback:

Resume Content:
${resumeText}

${targetRole ? `Target Role: ${targetRole}` : ''}
${targetIndustry ? `Target Industry: ${targetIndustry}` : ''}

Please provide a comprehensive analysis including:
1. Overall score and assessment
2. Key strengths and weaknesses
3. Specific improvement suggestions with priorities
4. Keyword optimization recommendations
5. ATS compatibility assessment
6. Section-by-section analysis

Focus on actionable feedback that will improve job search success.
`;
  }

  private buildCoverLetterAnalysisPrompt(coverLetterText: string, jobDescription: string, companyName: string): string {
    return `
Analyze this cover letter for the following position:

Cover Letter:
${coverLetterText}

Job Description:
${jobDescription}

Company: ${companyName}

Please analyze:
1. Overall effectiveness and score
2. Personalization level (company and role mentions)
3. Structure and organization
4. Tone and professionalism
5. Specific improvements needed

Provide actionable feedback to improve the cover letter's impact.
`;
  }

  private buildInterviewPrepPrompt(jobDescription: string, companyName: string, userProfile: UserProfile, applications: Application[]): string {
    const successfulApps = applications.filter(app => ['Interviewing', 'Offered', 'Accepted'].includes(app.status));
    
    return `
Generate comprehensive interview preparation materials for:

Job Description:
${jobDescription}

Company: ${companyName}

Candidate Profile:
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Experience Level: ${userProfile.experience || 'Not specified'}
- Education: ${userProfile.education || 'Not specified'}

Application History:
- Total Applications: ${applications.length}
- Successful Applications: ${successfulApps.length}
- Recent Success Patterns: ${successfulApps.slice(0, 3).map(app => `${app.position} at ${app.company}`).join(', ')}

Please provide:
1. Common interview questions with suggested answers
2. Company research points and questions to ask
3. Skills to highlight based on job requirements
4. Potential weaknesses to address
5. Salary negotiation guidance

Tailor everything to this specific role and company.
`;
  }

  private buildCareerPathPrompt(userProfile: UserProfile, applications: Application[], targetRole?: string): string {
    return `
Analyze career path and provide strategic guidance for:

Current Profile:
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Experience Level: ${userProfile.experience || 'Not specified'}
- Education: ${userProfile.education || 'Not specified'}
- Current Applications: ${applications.map(app => app.position).slice(0, 10).join(', ')}

${targetRole ? `Target Role: ${targetRole}` : ''}

Application History Insights:
- Total Applications: ${applications.length}
- Most Applied Industries: ${this.getTopIndustries(applications)}
- Most Applied Roles: ${this.getTopRoles(applications)}

Please provide:
1. Assessment of current career level
2. Logical next steps with timeframes
3. Skill gaps and learning recommendations
4. Industry trends affecting career growth
5. Strategic recommendations for advancement

Focus on realistic, actionable career development advice.
`;
  }

  private buildMarketAnalysisPrompt(role: string, industry: string, location: string, experienceLevel: string): string {
    return `
Provide comprehensive job market analysis for:

Role: ${role}
Industry: ${industry}
Location: ${location}
Experience Level: ${experienceLevel}

Please analyze:
1. Current demand and competition levels
2. Salary trends and factors affecting compensation
3. Top companies hiring for this role
4. Emerging skills and requirements
5. Location-specific opportunities and considerations

Provide data-driven insights and practical recommendations for job seekers in this market.
`;
  }

  // Helper methods for parsing responses
  private parseResumeAnalysis(response: string): ResumeAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.generateFallbackResumeAnalysis();
    }
  }

  private parseCoverLetterAnalysis(response: string): CoverLetterAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.generateFallbackCoverLetterAnalysis();
    }
  }

  private parseInterviewPreparation(response: string): InterviewPreparation {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.generateFallbackInterviewPreparation();
    }
  }

  private parseCareerPathAnalysis(response: string): CareerPathAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.generateFallbackCareerPathAnalysis();
    }
  }

  private parseMarketAnalysis(response: string): MarketAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      return this.generateFallbackMarketAnalysis();
    }
  }

  // Fallback methods when AI is unavailable
  private generateFallbackResumeAnalysis(): ResumeAnalysis {
    return {
      overallScore: 70,
      strengths: ['Professional experience listed', 'Skills section included'],
      weaknesses: ['Could use more specific achievements', 'Missing keywords for ATS'],
      improvements: [
        {
          category: 'Content',
          suggestion: 'Add quantified achievements to experience section',
          priority: 'high',
          impact: 'Increases credibility and impact'
        }
      ],
      keywordOptimization: {
        missingKeywords: ['Industry-specific terms'],
        overusedKeywords: [],
        industryKeywords: ['Professional skills', 'Experience']
      },
      atsCompatibility: {
        score: 75,
        issues: ['Consider using standard section headers'],
        recommendations: ['Use simple formatting', 'Include relevant keywords']
      },
      sectionAnalysis: {
        summary: { score: 70, feedback: 'Good foundation, could be more compelling' },
        experience: { score: 75, feedback: 'Solid experience, add more metrics' },
        skills: { score: 80, feedback: 'Good skill coverage' },
        education: { score: 85, feedback: 'Education section is clear' }
      }
    };
  }

  private generateFallbackCoverLetterAnalysis(): CoverLetterAnalysis {
    return {
      overallScore: 65,
      personalization: {
        score: 60,
        companyMentions: 1,
        roleMentions: 1,
        suggestions: ['Mention specific company values', 'Reference recent company news']
      },
      structure: {
        score: 75,
        hasOpening: true,
        hasBody: true,
        hasClosing: true,
        suggestions: ['Strengthen opening hook', 'Add more specific examples']
      },
      tone: {
        score: 70,
        assessment: 'Professional and appropriate',
        suggestions: ['Show more enthusiasm', 'Be more specific about contributions']
      },
      improvements: ['Add more company-specific details', 'Include quantified achievements']
    };
  }

  private generateFallbackInterviewPreparation(): InterviewPreparation {
    return {
      commonQuestions: [
        {
          question: 'Tell me about yourself',
          category: 'General',
          suggestedAnswer: 'Focus on relevant experience and skills that match the role',
          tips: ['Keep it concise', 'Connect to the job requirements']
        },
        {
          question: 'Why do you want this role?',
          category: 'Motivation',
          suggestedAnswer: 'Explain how the role aligns with your career goals',
          tips: ['Research the company', 'Be specific about your interest']
        }
      ],
      companyResearch: {
        keyPoints: ['Company mission and values', 'Recent achievements', 'Industry position'],
        questionsToAsk: ['What does success look like in this role?', 'What are the team dynamics?'],
        recentNews: ['Check company website and news for recent updates']
      },
      skillsToHighlight: ['Relevant technical skills', 'Communication abilities', 'Problem-solving'],
      weaknessesToAddress: ['Areas for improvement', 'Learning opportunities'],
      salaryNegotiation: {
        marketRange: 'Research industry standards',
        negotiationTips: ['Know your worth', 'Consider total compensation'],
        timing: 'Wait for offer before discussing salary'
      }
    };
  }

  private generateFallbackCareerPathAnalysis(): CareerPathAnalysis {
    return {
      currentLevel: 'Mid-level professional',
      nextSteps: [
        {
          role: 'Senior position in current field',
          timeframe: '1-2 years',
          requirements: ['Advanced skills', 'Leadership experience'],
          salaryRange: 'Market rate + 20-30%'
        }
      ],
      skillGaps: [
        {
          skill: 'Leadership',
          importance: 'important',
          learningResources: ['Management courses', 'Mentorship programs']
        }
      ],
      industryTrends: ['Digital transformation', 'Remote work adoption'],
      recommendations: ['Focus on skill development', 'Build professional network']
    };
  }

  private generateFallbackMarketAnalysis(): MarketAnalysis {
    return {
      demandLevel: 'medium',
      competitionLevel: 'medium',
      salaryTrends: {
        current: 'Competitive market rates',
        trend: 'stable',
        factors: ['Economic conditions', 'Industry growth']
      },
      topCompanies: [
        {
          name: 'Leading companies in the industry',
          openings: 50,
          averageSalary: 'Market competitive',
          culture: 'Professional environment'
        }
      ],
      emergingSkills: ['Digital skills', 'Data analysis', 'Communication'],
      locationAnalysis: [
        {
          location: 'Major metropolitan areas',
          opportunities: 100,
          averageSalary: 'Above national average',
          costOfLiving: 'Higher than average'
        }
      ]
    };
  }

  // Utility methods
  private getTopIndustries(applications: Application[]): string {
    // This would analyze application data to identify top industries
    // For now, return a placeholder
    return 'Technology, Finance, Healthcare';
  }

  private getTopRoles(applications: Application[]): string {
    // This would analyze application data to identify top roles
    // For now, return a placeholder
    return 'Software Engineer, Product Manager, Data Analyst';
  }
}

export const advancedAIService = AdvancedAIService.getInstance();