import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReminderService } from '@/lib/reminders/reminderService'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/applications/[id]/reminders - Create automatic reminders for an application
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Get the application
    const application = await prisma.application.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!application) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Application not found' 
          } 
        },
        { status: 404 }
      )
    }

    // Convert Prisma application to our Application type
    const appData = {
      id: application.id,
      company: application.company,
      position: application.position,
      location: application.location || '',
      type: application.jobType || 'Full-time',
      salary: application.salaryRange || '',
      status: application.status,
      appliedDate: application.appliedDate.toISOString(),
      responseDate: application.responseDate?.toISOString() || null,
      interviewDate: application.interviewDate?.toISOString() || null,
      notes: application.notes || '',
      contactPerson: application.contactPerson || '',
      contactEmail: application.contactEmail || '',
      website: application.companyWebsite || '',
      tags: application.tags,
      priority: application.priority,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      userId: application.userId,
      jobDescription: application.jobDescription || '',
      requirements: application.requirements,
      contactPhone: application.contactPhone || '',
      companyWebsite: application.companyWebsite || '',
      jobUrl: application.jobUrl || '',
      aiMatchScore: application.aiMatchScore || undefined,
      aiInsights: application.aiInsights as any,
      followUpDate: application.followUpDate?.toISOString() || undefined,
      offerDate: application.offerDate?.toISOString() || null,
      rejectionDate: application.rejectionDate?.toISOString() || null
    }

    // Create automatic reminders
    await ReminderService.createAutomaticReminders(session.user.id, appData)

    return NextResponse.json({
      success: true,
      data: { message: 'Automatic reminders created successfully' },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creating automatic reminders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create automatic reminders' 
        } 
      },
      { status: 500 }
    )
  }
}