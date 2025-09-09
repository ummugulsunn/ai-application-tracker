import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { jobRecommendationService } from '@/lib/ai/jobRecommendationService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['viewed', 'saved', 'applied', 'dismissed'])
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendation = await prisma.jobRecommendation.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!recommendation) {
      return NextResponse.json({
        success: false,
        error: 'Recommendation not found'
      }, { status: 404 });
    }

    // Mark as viewed if it's new
    if (recommendation.status === 'new') {
      await jobRecommendationService.updateRecommendationStatus(id, 'viewed');
      recommendation.status = 'viewed';
    }

    return NextResponse.json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    console.error('Error fetching job recommendation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch job recommendation'
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedBody = updateStatusSchema.parse(body);

    // Verify the recommendation belongs to the user
    const existingRecommendation = await prisma.jobRecommendation.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingRecommendation) {
      return NextResponse.json({
        success: false,
        error: 'Recommendation not found'
      }, { status: 404 });
    }

    const updatedRecommendation = await jobRecommendationService.updateRecommendationStatus(
      id,
      validatedBody.status
    );

    return NextResponse.json({
      success: true,
      data: updatedRecommendation,
      message: `Recommendation marked as ${validatedBody.status}`
    });

  } catch (error) {
    console.error('Error updating job recommendation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update job recommendation'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the recommendation belongs to the user
    const existingRecommendation = await prisma.jobRecommendation.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingRecommendation) {
      return NextResponse.json({
        success: false,
        error: 'Recommendation not found'
      }, { status: 404 });
    }

    await jobRecommendationService.deleteRecommendation(id);

    return NextResponse.json({
      success: true,
      message: 'Recommendation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting job recommendation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete job recommendation'
    }, { status: 500 });
  }
}