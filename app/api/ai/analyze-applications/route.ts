import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiService, checkRateLimit, withErrorHandling } from '@/lib/ai';
import { z } from 'zod';

const analyzeApplicationsSchema = z.object({
  applications: z.array(z.object({
    id: z.string(),
    company: z.string(),
    position: z.string(),
    location: z.string().optional(),
    jobType: z.string(),
    status: z.string(),
    appliedDate: z.string(),
    responseDate: z.string().optional(),
    interviewDate: z.string().optional(),
    offerDate: z.string().optional(),
    rejectionDate: z.string().optional(),
    jobDescription: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })),
  analysisType: z.enum(['patterns', 'trends', 'individual']).optional().default('patterns')
});

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

    // Check rate limiting with enhanced feedback
    const rateLimitResult = checkRateLimit(session.user.id);
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetTime ? new Date(rateLimitResult.resetTime).toISOString() : undefined;
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: rateLimitResult.reason || 'Too many AI requests. Please try again later.',
            resetTime
          } 
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = analyzeApplicationsSchema.parse(body);

    const { applications, analysisType } = validatedData;

    if (applications.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          analysisType,
          insights: {
            message: 'No applications to analyze',
            recommendations: ['Start applying to jobs to get AI-powered insights']
          }
        }
      });
    }

    let analysisResult;

    switch (analysisType) {
      case 'patterns':
        analysisResult = await withErrorHandling(
          () => aiService.analyzeApplicationPatterns(applications as any[]),
          {
            successRate: 0,
            responseRate: 0,
            interviewRate: 0,
            averageResponseTime: 0,
            bestPerformingCompanies: [],
            bestPerformingIndustries: [],
            optimalApplicationTiming: { 
              dayOfWeek: 'Tuesday', 
              timeOfDay: 'Morning',
              confidence: 30,
              reasoning: 'Based on general best practices'
            },
            applicationFrequency: {
              recommended: 5,
              current: 0,
              reasoning: 'Balanced approach for quality applications'
            },
            trends: [],
            keyInsights: ['Analysis unavailable - using fallback data'],
            actionableRecommendations: [{
              priority: 'medium' as const,
              action: 'Continue tracking applications for better insights',
              reasoning: 'More data needed for accurate analysis',
              expectedImpact: 'Better recommendations with more data'
            }]
          },
          'Failed to analyze application patterns'
        );
        break;

      case 'trends':
        analysisResult = aiService.calculateSuccessRates(applications as any[]);
        break;

      case 'individual':
        if (applications.length === 1) {
          analysisResult = await withErrorHandling(
            () => aiService.analyzeApplication(applications[0] as any),
            {
              matchScore: 50,
              matchReasons: ['Analysis unavailable'],
              improvementSuggestions: ['Review application details'],
              successProbability: 30,
              recommendedActions: ['Follow up after one week'],
              confidence: 30,
              analysisDate: new Date().toISOString()
            },
            'Failed to analyze individual application'
          );
        } else {
          return NextResponse.json(
            { 
              success: false, 
              error: { 
                code: 'INVALID_REQUEST', 
                message: 'Individual analysis requires exactly one application' 
              } 
            },
            { status: 400 }
          );
        }
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'INVALID_ANALYSIS_TYPE', 
              message: 'Invalid analysis type specified' 
            } 
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisType,
        insights: analysisResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in AI analysis endpoint:', error);

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