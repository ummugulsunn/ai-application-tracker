import { prisma } from '@/lib/prisma'
import { Application } from '@/types/application'

export interface ReminderTemplate {
  type: 'follow_up' | 'interview_prep' | 'deadline' | 'custom'
  title: string
  description: string
  daysFromNow: number
  condition?: (application: Application) => boolean
}

// Industry best practices for follow-up timing
const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    type: 'follow_up',
    title: 'Follow up on application',
    description: 'Send a polite follow-up email to check on the status of your application.',
    daysFromNow: 7,
    condition: (app) => app.status === 'Applied'
  },
  {
    type: 'follow_up',
    title: 'Second follow-up',
    description: 'Send a second follow-up if you haven\'t heard back after the first one.',
    daysFromNow: 14,
    condition: (app) => app.status === 'Applied'
  },
  {
    type: 'interview_prep',
    title: 'Prepare for interview',
    description: 'Research the company, practice common interview questions, and prepare your questions.',
    daysFromNow: -1, // 1 day before interview
    condition: (app) => app.status === 'Interviewing' && !!app.interviewDate
  },
  {
    type: 'follow_up',
    title: 'Post-interview follow-up',
    description: 'Send a thank-you email and reiterate your interest in the position.',
    daysFromNow: 1, // 1 day after interview
    condition: (app) => app.status === 'Interviewing' && !!app.interviewDate
  },
  {
    type: 'deadline',
    title: 'Application deadline approaching',
    description: 'Complete and submit your application before the deadline.',
    daysFromNow: -3, // 3 days before deadline
    condition: (app) => app.status === 'Pending'
  }
]

export class ReminderService {
  /**
   * Create automatic reminders for a new application
   */
  static async createAutomaticReminders(userId: string, application: Application): Promise<void> {
    try {
      const remindersToCreate = []
      const now = new Date()

      for (const template of REMINDER_TEMPLATES) {
        // Check if the condition is met for this reminder
        if (template.condition && !template.condition(application)) {
          continue
        }

        let dueDate: Date

        if (template.type === 'interview_prep' && application.interviewDate) {
          // Calculate based on interview date
          dueDate = new Date(application.interviewDate)
          dueDate.setDate(dueDate.getDate() + template.daysFromNow)
        } else if (template.type === 'follow_up' && template.title.includes('Post-interview') && application.interviewDate) {
          // Post-interview follow-up
          dueDate = new Date(application.interviewDate)
          dueDate.setDate(dueDate.getDate() + template.daysFromNow)
        } else {
          // Calculate based on application date
          dueDate = new Date(application.appliedDate)
          dueDate.setDate(dueDate.getDate() + template.daysFromNow)
        }

        // Only create reminders for future dates
        if (dueDate > now) {
          remindersToCreate.push({
            userId,
            applicationId: application.id,
            reminderType: template.type,
            title: `${template.title} - ${application.company}`,
            description: template.description,
            dueDate,
            isCompleted: false
          })
        }
      }

      if (remindersToCreate.length > 0) {
        await prisma.reminder.createMany({
          data: remindersToCreate
        })
      }
    } catch (error) {
      console.error('Error creating automatic reminders:', error)
      // Don't throw error to avoid breaking application creation
    }
  }

  /**
   * Update reminders when application status changes
   */
  static async updateRemindersForStatusChange(
    userId: string, 
    applicationId: string, 
    oldStatus: string, 
    newStatus: string,
    application: Application
  ): Promise<void> {
    try {
      // Cancel irrelevant reminders based on status change
      if (newStatus === 'Rejected' || newStatus === 'Accepted' || newStatus === 'Withdrawn') {
        // Cancel all pending reminders for this application
        await prisma.reminder.updateMany({
          where: {
            userId,
            applicationId,
            isCompleted: false
          },
          data: {
            isCompleted: true
          }
        })
      }

      // Create new reminders based on new status
      if (newStatus === 'Interviewing' && application.interviewDate) {
        await this.createInterviewReminders(userId, application)
      }

      if (newStatus === 'Offered') {
        await this.createOfferReminders(userId, application)
      }
    } catch (error) {
      console.error('Error updating reminders for status change:', error)
    }
  }

  /**
   * Create interview-specific reminders
   */
  private static async createInterviewReminders(userId: string, application: Application): Promise<void> {
    if (!application.interviewDate) return

    const interviewDate = new Date(application.interviewDate)
    const now = new Date()

    const interviewReminders = [
      {
        type: 'interview_prep' as const,
        title: `Prepare for interview - ${application.company}`,
        description: 'Research the company, review the job description, and prepare your questions.',
        dueDate: new Date(interviewDate.getTime() - 24 * 60 * 60 * 1000) // 1 day before
      },
      {
        type: 'interview_prep' as const,
        title: `Final interview preparation - ${application.company}`,
        description: 'Review your resume, practice answers, and plan your route to the interview location.',
        dueDate: new Date(interviewDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours before
      },
      {
        type: 'follow_up' as const,
        title: `Send thank-you note - ${application.company}`,
        description: 'Send a personalized thank-you email to your interviewer(s).',
        dueDate: new Date(interviewDate.getTime() + 24 * 60 * 60 * 1000) // 1 day after
      }
    ]

    const remindersToCreate = interviewReminders
      .filter(reminder => reminder.dueDate > now)
      .map(reminder => ({
        userId,
        applicationId: application.id,
        reminderType: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        isCompleted: false
      }))

    if (remindersToCreate.length > 0) {
      await prisma.reminder.createMany({
        data: remindersToCreate
      })
    }
  }

  /**
   * Create offer-specific reminders
   */
  private static async createOfferReminders(userId: string, application: Application): Promise<void> {
    const now = new Date()
    const offerDate = application.offerDate ? new Date(application.offerDate) : now

    const offerReminders = [
      {
        type: 'deadline' as const,
        title: `Review job offer - ${application.company}`,
        description: 'Carefully review the offer details, salary, benefits, and terms.',
        dueDate: new Date(offerDate.getTime() + 24 * 60 * 60 * 1000) // 1 day after offer
      },
      {
        type: 'deadline' as const,
        title: `Respond to job offer - ${application.company}`,
        description: 'Make your decision and respond to the job offer.',
        dueDate: new Date(offerDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week after offer
      }
    ]

    const remindersToCreate = offerReminders
      .filter(reminder => reminder.dueDate > now)
      .map(reminder => ({
        userId,
        applicationId: application.id,
        reminderType: reminder.type,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        isCompleted: false
      }))

    if (remindersToCreate.length > 0) {
      await prisma.reminder.createMany({
        data: remindersToCreate
      })
    }
  }

  /**
   * Get upcoming reminders for a user
   */
  static async getUpcomingReminders(userId: string, days: number = 7) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    return await prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: {
          lte: endDate
        }
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
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
  }

  /**
   * Get overdue reminders for a user
   */
  static async getOverdueReminders(userId: string) {
    const now = new Date()

    return await prisma.reminder.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: {
          lt: now
        }
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
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(userId: string, reminderId: string): Promise<boolean> {
    try {
      const result = await prisma.reminder.updateMany({
        where: {
          id: reminderId,
          userId,
          isCompleted: false
        },
        data: {
          isCompleted: true
        }
      })

      return result.count > 0
    } catch (error) {
      console.error('Error completing reminder:', error)
      return false
    }
  }

  /**
   * Snooze a reminder by a specified number of hours
   */
  static async snoozeReminder(userId: string, reminderId: string, hours: number): Promise<boolean> {
    try {
      const reminder = await prisma.reminder.findFirst({
        where: {
          id: reminderId,
          userId,
          isCompleted: false
        }
      })

      if (!reminder) return false

      const newDueDate = new Date(reminder.dueDate)
      newDueDate.setHours(newDueDate.getHours() + hours)

      await prisma.reminder.update({
        where: { id: reminderId },
        data: { dueDate: newDueDate }
      })

      return true
    } catch (error) {
      console.error('Error snoozing reminder:', error)
      return false
    }
  }

  /**
   * Get reminder statistics for a user
   */
  static async getReminderStats(userId: string) {
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    const [total, completed, overdue, upcoming] = await Promise.all([
      prisma.reminder.count({ where: { userId } }),
      prisma.reminder.count({ where: { userId, isCompleted: true } }),
      prisma.reminder.count({ 
        where: { 
          userId, 
          isCompleted: false, 
          dueDate: { lt: now } 
        } 
      }),
      prisma.reminder.count({ 
        where: { 
          userId, 
          isCompleted: false, 
          dueDate: { gte: now, lte: weekFromNow } 
        } 
      })
    ])

    return {
      total,
      completed,
      overdue,
      upcoming,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }
}