import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReminderService } from '@/lib/reminders/reminderService'

// GET /api/reminders/stats - Get reminder statistics for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const stats = await ReminderService.getReminderStats(session.user.id)

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching reminder stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch reminder statistics' 
        } 
      },
      { status: 500 }
    )
  }
}