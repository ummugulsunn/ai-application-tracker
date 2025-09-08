import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jobRecommendationService } from '@/lib/ai/jobRecommendationService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const generateRecommendationsSchema = z.object({
  limit: z.number().min(1).max(50).default(10),
  regenerate: z.boolean().default(false)
});

const getRecommendationsSchema = z.object({
  status: z.enum(['new', 'viewed', 'saved', 'applied', 'dismissed']).optional(),
  limit: z.number().min(1).max(50).default(20)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = {
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '20')
    };

    const validatedParams = getRecommendationsSchema.parse(params);

    const recommendations = await jobRecommendationService.getRecommendations(
      session.user.id,
      validatedParams.status,
      validatedParams.limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Error fetching job recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid parameters',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job recommendations'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = generateRecommendationsSchema.parse(body);

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
      take: 100 // Limit to recent applications for analysis
    });

    // If regenerate is true, delete existing recommendations
    if (validatedBody.regenerate) {
      await prisma.jobRecommendation.deleteMany({
        where: { 
          userId: session.user.id,
          status: 'new' // Only delete unviewed recommendations
        }
      });
    }

    // Generate new recommendations
    const recommendations = await jobRecommendationService.generateRecommendations(
      session.user.id,
      {
        skills: user.skills || [],
        experienceLevel: user.experienceLevel || 'Mid',
        industries: user.industries || [],
        jobTypes: user.jobTypes || [],
        preferredLocations: user.preferredLocations || [],
        desiredSalaryMin: user.desiredSalaryMin || undefined,
        desiredSalaryMax: user.desiredSalaryMax || undefined
      },
      applications,
      validatedBody.limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      message: `Generated ${recommendations.length} new job recommendations`
    });

  } catch (error) {
    console.error('Error generating job recommendations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to generate job recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}