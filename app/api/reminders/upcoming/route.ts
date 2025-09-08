import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/reminders/reminderService'

// GET /api/reminders/upcoming - Get upcoming reminders for the current user
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
    const days = parseInt(searchParams.get('days') || '7')

    const upcomingReminders = await ReminderService.getUpcomingReminders(session.user.id, days)

    return NextResponse.json({
      success: true,
      data: upcomingReminders,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching upcoming reminders:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch upcoming reminders' 
        } 
      },
      { status: 500 }
    )
  }
}