import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const careerPathSchema = z.object({
  targetRole: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = careerPathSchema.parse(body);

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        skills: true,
        experienceLevel: true,
        industries: true,
        jobTypes: true,
        preferredLocations: true,
        desiredSalaryMin: true,
        desiredSalaryMax: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User profile not found'
      }, { status: 404 });
    }

    // Get user's application history
    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { appliedDate: 'desc' },
      take: 100 // More data for career analysis
    });

    const analysis = await advancedAIService.analyzeCareerPath(
      user,
      applications,
      validatedBody.targetRole
    );

    return NextResponse.json({
      success: true,
      data: analysis,
      message: 'Career path analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing career path:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to analyze career path',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}