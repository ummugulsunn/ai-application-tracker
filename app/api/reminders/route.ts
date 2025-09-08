import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reminderSchema } from '@/lib/validations'
import { z } from 'zod'

// GET /api/reminders - Get all reminders for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const includeCompleted = searchParams.get('includeCompleted') === 'true'
    const applicationId = searchParams.get('applicationId')
    const reminderType = searchParams.get('type')

    const where: any = {
      userId: session.user.id,
    }

    if (!includeCompleted) {
      where.isCompleted = false
    }

    if (applicationId) {
      where.applicationId = applicationId
    }

    if (reminderType) {
      where.reminderType = reminderType
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        application: {
          select: {
            id: true,
            company: true,
            position: true,
            status: true,
          }
        }
      },
      orderBy: [
        { isCompleted: 'asc' },
        { dueDate: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: reminders,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch reminders' 
        } 
      },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate the request body
    const validationResult = reminderSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid reminder data',
            details: validationResult.error.errors
          } 
        },
        { status: 400 }
      )
    }

    const { applicationId, reminderType, title, description, dueDate } = validationResult.data

    // Verify the application belongs to the user if applicationId is provided
    if (applicationId) {
      const application = await prisma.application.findFirst({
        where: {
          id: applicationId,
          userId: session.user.id
        }
      })

      if (!application) {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'NOT_FOUND', 
              message: 'Application not found or access denied' 
            } 
          },
          { status: 404 }
        )
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        applicationId: applicationId || null,
        reminderType,
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        isCompleted: false
      },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            position: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create reminder' 
        } 
      },
      { status: 500 }
    )
  }
}