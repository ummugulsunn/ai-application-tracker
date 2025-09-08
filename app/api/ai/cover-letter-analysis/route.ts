import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, withErrorHandling } from '@/lib/ai';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { z } from 'zod';

const analyzeCoverLetterSchema = z.object({
  coverLetterText: z.string().min(50, 'Cover letter text must be at least 50 characters'),
  jobDescription: z.string().min(20, 'Job description is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

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
    const validatedData = analyzeCoverLetterSchema.parse(body);

    const { coverLetterText, jobDescription, companyName } = validatedData;

    const analysisResult = await withErrorHandling(
      () => advancedAIService.analyzeCoverLetter(coverLetterText, jobDescription, companyName),
      {
        overallScore: 50,
        personalization: {
          score: 50,
          companyMentions: 0,
          roleMentions: 0,
          suggestions: ['Analysis temporarily unavailable']
        },
        structure: {
          score: 50,
          hasOpening: true,
          hasBody: true,
          hasClosing: true,
          suggestions: ['Please try again later']
        },
        tone: {
          score: 50,
          assessment: 'Unable to analyze tone',
          suggestions: ['Analysis temporarily unavailable']
        },
        improvements: ['Please try again later']
      },
      'Failed to analyze cover letter'
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in cover letter analysis endpoint:', error);

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