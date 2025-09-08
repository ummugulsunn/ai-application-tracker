import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reminderSchema } from '@/lib/validations'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/reminders/[id] - Get a specific reminder
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
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

    if (!reminder) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Reminder not found' 
          } 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch reminder' 
        } 
      },
      { status: 500 }
    )
  }
}

// PUT /api/reminders/[id] - Update a reminder
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Allow partial updates, so we'll validate only the fields that are provided
    const updateSchema = reminderSchema.partial().extend({
      isCompleted: reminderSchema.shape.isCompleted.optional()
    })
    
    const validationResult = updateSchema.safeParse(body)
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

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Reminder not found' 
          } 
        },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (validationResult.data.applicationId !== undefined) {
      updateData.applicationId = validationResult.data.applicationId
    }
    if (validationResult.data.reminderType !== undefined) {
      updateData.reminderType = validationResult.data.reminderType
    }
    if (validationResult.data.title !== undefined) {
      updateData.title = validationResult.data.title
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description
    }
    if (validationResult.data.dueDate !== undefined) {
      updateData.dueDate = new Date(validationResult.data.dueDate)
    }
    if (validationResult.data.isCompleted !== undefined) {
      updateData.isCompleted = validationResult.data.isCompleted
    }

    const updatedReminder = await prisma.reminder.update({
      where: { id: params.id },
      data: updateData,
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
      data: updatedReminder,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to update reminder' 
        } 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if reminder exists and belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingReminder) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Reminder not found' 
          } 
        },
        { status: 404 }
      )
    }

    await prisma.reminder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Reminder deleted successfully' },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete reminder' 
        } 
      },
      { status: 500 }
    )
  }
}