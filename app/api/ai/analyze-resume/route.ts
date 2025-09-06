import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, withErrorHandling } from '@/lib/ai';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeResumeSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
  jobDescription: z.string().optional(),
  targetRole: z.string().optional(),
});

interface ResumeAnalysis {
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
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(session.user.id)) {
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
    const validatedData = analyzeResumeSchema.parse(body);

    const { resumeText, jobDescription, targetRole } = validatedData;

    const analysisResult = await withErrorHandling(
      () => analyzeResumeWithAI(resumeText, jobDescription, targetRole),
      {
        overallScore: 50,
        strengths: ['Resume submitted for analysis'],
        weaknesses: ['Analysis temporarily unavailable'],
        suggestions: ['Please try again later'],
        keywordMatch: {
          matched: [],
          missing: [],
          score: 0
        },
        sections: []
      },
      'Failed to analyze resume'
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in resume analysis endpoint:', error);

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

async function analyzeResumeWithAI(
  resumeText: string, 
  jobDescription?: string, 
  targetRole?: string
): Promise<ResumeAnalysis> {
  const prompt = buildResumeAnalysisPrompt(resumeText, jobDescription, targetRole);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert resume reviewer and career coach. Analyze resumes and provide detailed, actionable feedback to help job seekers improve their applications.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI service');
  }

  return parseResumeAnalysis(response);
}

function buildResumeAnalysisPrompt(
  resumeText: string, 
  jobDescription?: string, 
  targetRole?: string
): string {
  return `
Analyze this resume and provide detailed feedback:

RESUME TEXT:
${resumeText}

${jobDescription ? `
TARGET JOB DESCRIPTION:
${jobDescription}
` : ''}

${targetRole ? `
TARGET ROLE: ${targetRole}
` : ''}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "overallScore": number (0-100),
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "keywordMatch": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["missing1", "missing2"],
    "score": number (0-100)
  },
  "sections": [
    {
      "name": "Contact Information",
      "score": number (0-100),
      "feedback": "detailed feedback"
    },
    {
      "name": "Professional Summary",
      "score": number (0-100),
      "feedback": "detailed feedback"
    },
    {
      "name": "Work Experience",
      "score": number (0-100),
      "feedback": "detailed feedback"
    },
    {
      "name": "Skills",
      "score": number (0-100),
      "feedback": "detailed feedback"
    },
    {
      "name": "Education",
      "score": number (0-100),
      "feedback": "detailed feedback"
    }
  ]
}

Focus on:
1. ATS compatibility and keyword optimization
2. Quantified achievements and impact
3. Relevance to target role
4. Professional formatting and structure
5. Grammar and clarity
6. Missing critical information
`;
}

function parseResumeAnalysis(response: string): ResumeAnalysis {
  try {
    const parsed = JSON.parse(response);
    
    return {
      overallScore: parsed.overallScore || 50,
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      suggestions: parsed.suggestions || [],
      keywordMatch: {
        matched: parsed.keywordMatch?.matched || [],
        missing: parsed.keywordMatch?.missing || [],
        score: parsed.keywordMatch?.score || 0
      },
      sections: parsed.sections || []
    };
  } catch (error) {
    console.error('Failed to parse resume analysis:', error);
    
    // Fallback analysis
    return {
      overallScore: 50,
      strengths: ['Resume submitted for analysis'],
      weaknesses: ['Unable to parse detailed analysis'],
      suggestions: ['Please ensure resume text is clear and well-formatted'],
      keywordMatch: {
        matched: [],
        missing: [],
        score: 0
      },
      sections: [
        {
          name: 'Overall',
          score: 50,
          feedback: 'Analysis parsing failed. Please try again with a cleaner resume format.'
        }
      ]
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