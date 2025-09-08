import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/reminders/reminderService'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const snoozeSchema = z.object({
  hours: z.number().min(1).max(168) // 1 hour to 1 week
})

// POST /api/reminders/[id]/snooze - Snooze a reminder
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = snoozeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid snooze duration',
            details: validationResult.error.errors
          } 
        },
        { status: 400 }
      )
    }

    const { hours } = validationResult.data
    const success = await ReminderService.snoozeReminder(session.user.id, params.id, hours)

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
      data: { 
        message: `Reminder snoozed for ${hours} hour${hours > 1 ? 's' : ''}`,
        snoozeHours: hours
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error snoozing reminder:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to snooze reminder' 
        } 
      },
      { status: 500 }
    )
  }
}