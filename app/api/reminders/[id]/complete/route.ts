import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/reminders/reminderService'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/reminders/[id]/complete - Mark a reminder as completed
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const success = await ReminderService.completeReminder(session.user.id, params.id)

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Reminder not found or already completed' 
          } 
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Reminder marked as completed' },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error completing reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to complete reminder' 
        } 
      },
      { status: 500 }
    )
  }
}