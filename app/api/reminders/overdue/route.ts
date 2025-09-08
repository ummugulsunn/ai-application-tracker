import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/reminders/reminderService'

// GET /api/reminders/overdue - Get overdue reminders for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const overdueReminders = await ReminderService.getOverdueReminders(session.user.id)

    return NextResponse.json({
      success: true,
      data: overdueReminders,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching overdue reminders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch overdue reminders' 
        } 
      },
      { status: 500 }
    )
  }
}