import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/reminders/notificationService'
import { prisma } from '@/lib/prisma'

// POST /api/notifications/send - Send due notifications (for cron jobs)
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, you'd check auth headers)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
        { status: 401 }
      )
    }

    const now = new Date()
    const results = {
      remindersSent: 0,
      dailyDigestsSent: 0,
      weeklyDigestsSent: 0,
      errors: [] as string[]
    }

    // Get all due reminders (within the next hour)
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
    const dueReminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        dueDate: {
          gte: now,
          lte: nextHour
        }
      },
      include: {
        user: {
          select: {
            id: true,
            preferences: true
          }
        }
      }
    })

    // Send individual reminder notifications
    for (const reminder of dueReminders) {
      try {
        const success = await NotificationService.sendReminderNotification(
          reminder.userId,
          reminder.id,
          ['in-app', 'email']
        )
        
        if (success) {
          results.remindersSent++
        }
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error)
        results.errors.push(`Reminder ${reminder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Send daily digests (run this at a specific time, e.g., 8 AM)
    const hour = now.getHours()
    if (hour === 8) { // 8 AM
      const usersForDailyDigest = await prisma.user.findMany({
        where: {
          preferences: {
            path: ['reminderFrequency'],
            equals: 'Daily'
          }
        },
        select: {
          id: true
        }
      })

      for (const user of usersForDailyDigest) {
        try {
          const success = await NotificationService.sendDailyDigest(user.id)
          if (success) {
            results.dailyDigestsSent++
          }
        } catch (error) {
          console.error(`Error sending daily digest to user ${user.id}:`, error)
          results.errors.push(`Daily digest ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    // Send weekly digests (run this on Mondays at 8 AM)
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday
    if (dayOfWeek === 1 && hour === 8) { // Monday at 8 AM
      const usersForWeeklyDigest = await prisma.user.findMany({
        where: {
          preferences: {
            path: ['reminderFrequency'],
            equals: 'Weekly'
          }
        },
        select: {
          id: true
        }
      })

      for (const user of usersForWeeklyDigest) {
        try {
          const success = await NotificationService.sendWeeklyDigest(user.id)
          if (success) {
            results.weeklyDigestsSent++
          }
        } catch (error) {
          console.error(`Error sending weekly digest to user ${user.id}:`, error)
          results.errors.push(`Weekly digest ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Notifications processed successfully',
        results
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to process notifications' 
        } 
      },
      { status: 500 }
    )
  }
}