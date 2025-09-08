import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { z } from 'zod';

const marketAnalysisSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  industry: z.string().min(1, 'Industry is required'),
  location: z.string().min(1, 'Location is required'),
  experienceLevel: z.string().min(1, 'Experience level is required')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = marketAnalysisSchema.parse(body);

    const analysis = await advancedAIService.analyzeJobMarket(
      validatedBody.role,
      validatedBody.industry,
      validatedBody.location,
      validatedBody.experienceLevel
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Job market analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing job market:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze job market',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}