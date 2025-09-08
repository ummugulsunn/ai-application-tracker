import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { advancedAIService } from '@/lib/ai/advancedAIService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const interviewPrepSchema = z.object({
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  applicationId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = interviewPrepSchema.parse(body);

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        skills: true,
        experienceLevel: true,
        industries: true,
        jobTypes: true,
        preferredLocations: true
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
      take: 50 // Limit for analysis
    });

    const preparation = await advancedAIService.generateInterviewPreparation(
      validatedBody.jobDescription,
      validatedBody.companyName,
      user,
      applications
    );

    return NextResponse.json({
      success: true,
      data: preparation,
      message: 'Interview preparation materials generated successfully'
    });

  } catch (error) {
    console.error('Error generating interview preparation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate interview preparation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}