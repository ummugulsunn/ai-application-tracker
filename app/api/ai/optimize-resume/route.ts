import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, withErrorHandling } from '@/lib/ai';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const optimizeResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional(),
  jobDescription: z.string().optional(),
  optimizationGoals: z.array(z.enum(['ats_optimization', 'keyword_enhancement', 'achievement_quantification', 'structure_improvement', 'content_enhancement'])).default(['ats_optimization', 'keyword_enhancement']),
});

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

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - works in guest mode too)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || 'guest';

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: 'Too many AI requests. Please try again later.' 
          } 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = optimizeResumeSchema.parse(body);

    const { resumeText, targetRole, targetIndustry, jobDescription, optimizationGoals } = validatedData;

    const optimizationResult = await withErrorHandling(
      () => optimizeResumeWithAI(resumeText, targetRole, targetIndustry, jobDescription, optimizationGoals),
      {
        optimizedSections: [],
        keywordSuggestions: [],
        structuralChanges: [],
        atsImprovements: [],
        overallScore: 50,
        improvementSummary: ['Resume optimization temporarily unavailable']
      },
      'Failed to optimize resume'
    );

    return NextResponse.json({
      success: true,
      data: {
        optimization: optimizationResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in resume optimization endpoint:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid request data',
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}

async function optimizeResumeWithAI(
  resumeText: string,
  targetRole?: string,
  targetIndustry?: string,
  jobDescription?: string,
  optimizationGoals: string[] = []
): Promise<ResumeOptimization> {
  const prompt = buildResumeOptimizationPrompt(resumeText, targetRole, targetIndustry, jobDescription, optimizationGoals);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert resume optimization specialist and ATS consultant. Analyze resumes and provide specific, actionable optimization recommendations that will improve job search success.

        Respond with valid JSON in this format:
        {
          "optimizedSections": [
            {
              "section": "string (section name)",
              "original": "string (original text)",
              "optimized": "string (improved text)",
              "improvements": ["improvement1", "improvement2"]
            }
          ],
          "keywordSuggestions": [
            {
              "category": "string (e.g., Technical Skills, Soft Skills)",
              "keywords": ["keyword1", "keyword2"],
              "placement": "string (where to place these keywords)"
            }
          ],
          "structuralChanges": [
            {
              "change": "string (what to change)",
              "reason": "string (why this change helps)",
              "impact": "string (expected impact)"
            }
          ],
          "atsImprovements": [
            {
              "issue": "string (ATS compatibility issue)",
              "solution": "string (how to fix it)",
              "priority": "high|medium|low"
            }
          ],
          "overallScore": number (0-100),
          "improvementSummary": ["summary1", "summary2"]
        }`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 3500,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI service');
  }

  return parseResumeOptimization(response);
}

function buildResumeOptimizationPrompt(
  resumeText: string,
  targetRole?: string,
  targetIndustry?: string,
  jobDescription?: string,
  optimizationGoals: string[] = []
): string {
  const goalDescriptions = {
    ats_optimization: 'Improve ATS (Applicant Tracking System) compatibility',
    keyword_enhancement: 'Enhance relevant keywords and phrases',
    achievement_quantification: 'Add metrics and quantify achievements',
    structure_improvement: 'Improve overall structure and formatting',
    content_enhancement: 'Enhance content quality and impact'
  };

  return `
Optimize this resume for maximum job search effectiveness:

Current Resume:
${resumeText}

${targetRole ? `Target Role: ${targetRole}` : ''}
${targetIndustry ? `Target Industry: ${targetIndustry}` : ''}
${jobDescription ? `
Target Job Description:
${jobDescription}
` : ''}

Optimization Goals:
${optimizationGoals.map(goal => `- ${goalDescriptions[goal as keyof typeof goalDescriptions] || goal}`).join('\n')}

Please provide:

1. **Optimized Sections**: For each major section (Summary, Experience, Skills, Education), provide:
   - Original text (if needs improvement)
   - Optimized version
   - Specific improvements made

2. **Keyword Suggestions**: Identify missing keywords by category:
   - Technical skills keywords
   - Industry-specific terms
   - Soft skills keywords
   - Action verbs and power words
   - Where to strategically place them

3. **Structural Changes**: Recommend formatting and organization improvements:
   - Section ordering
   - Bullet point structure
   - Length optimization
   - Visual hierarchy

4. **ATS Improvements**: Address ATS compatibility issues:
   - Formatting problems
   - Keyword density
   - Section header standardization
   - File format considerations

5. **Overall Assessment**: 
   - Score the optimized resume (0-100)
   - Summarize key improvements
   - Expected impact on job search success

Focus on changes that will have the highest impact on:
- ATS parsing and ranking
- Recruiter attention and interest
- Interview callback rates
- Overall professional presentation

Provide specific, actionable recommendations that can be immediately implemented.
`;
}

function parseResumeOptimization(response: string): ResumeOptimization {
  try {
    const parsed = JSON.parse(response);
    
    return {
      optimizedSections: parsed.optimizedSections || [],
      keywordSuggestions: parsed.keywordSuggestions || [],
      structuralChanges: parsed.structuralChanges || [],
      atsImprovements: parsed.atsImprovements || [],
      overallScore: parsed.overallScore || 50,
      improvementSummary: parsed.improvementSummary || []
    };
  } catch (error) {
    console.error('Failed to parse resume optimization:', error);
    
    // Fallback optimization
    return {
      optimizedSections: [],
      keywordSuggestions: [
        {
          category: 'General',
          keywords: ['Professional skills', 'Industry experience'],
          placement: 'Throughout resume sections'
        }
      ],
      structuralChanges: [
        {
          change: 'Improve bullet point structure',
          reason: 'Better readability and ATS parsing',
          impact: 'Increased callback rates'
        }
      ],
      atsImprovements: [
        {
          issue: 'Optimization parsing failed',
          solution: 'Please try again with clearer resume content',
          priority: 'medium'
        }
      ],
      overallScore: 50,
      improvementSummary: ['Resume optimization parsing failed. Please try again.']
    };
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      success: false, 
      error: { 
        code: 'METHOD_NOT_ALLOWED', 
        message: 'GET method not supported for this endpoint' 
      } 
    },
    { status: 405 }
  );
}