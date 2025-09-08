import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { z } from 'zod';

const resumeAnalysisSchema = z.object({
  resumeText: z.string().min(100, 'Resume text must be at least 100 characters'),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = resumeAnalysisSchema.parse(body);

    const analysis = await advancedAIService.analyzeResume(
      validatedBody.resumeText,
      validatedBody.targetRole,
      validatedBody.targetIndustry
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Resume analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing resume:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}