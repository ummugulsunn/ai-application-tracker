import { prisma } from '@/lib/prisma'

export interface NotificationChannel {
  type: 'in-app' | 'email' | 'push'
  enabled: boolean
}

export interface NotificationPreferences {
  emailNotifications: boolean
  reminderFrequency: 'Daily' | 'Weekly' | 'Never'
  followUpReminders: boolean
  interviewReminders: boolean
  applicationDeadlines: boolean
  channels: NotificationChannel[]
}

export interface NotificationTemplate {
  subject: string
  body: string
  type: 'reminder' | 'digest' | 'alert'
}

export class NotificationService {
  /**
   * Send individual reminder notification
   */
  static async sendReminderNotification(
    userId: string, 
    reminderId: string,
    channels: string[] = ['in-app']
  ): Promise<boolean> {
    try {
      const reminder = await prisma.reminder.findFirst({
        where: {
          id: reminderId,
          userId,
          isCompleted: false
        },
        include: {
          application: {
            select: {
              company: true,
              position: true,
              status: true
            }
          },
          user: {
            select: {
              email: true,
              firstName: true,
              preferences: true
            }
          }
        }
      })

      if (!reminder) {
        console.warn(`Reminder ${reminderId} not found or already completed`)
        return false
      }

      const preferences = this.parseUserPreferences(reminder.user.preferences)
      
      // Check if user wants this type of reminder
      if (!this.shouldSendReminder(reminder.reminderType, preferences)) {
        return false
      }

      const template = this.generateReminderTemplate(reminder)
      
      // Send through enabled channels
      const results = await Promise.allSettled([
        this.sendInAppNotification(userId, template, reminder),
        preferences.emailNotifications && channels.includes('email') 
          ? this.sendEmailNotification(reminder.user.email, template, reminder)
          : Promise.resolve(true)
      ])

      // Return true if at least one notification was sent successfully
      return results.some(result => result.status === 'fulfilled' && result.value === true)

    } catch (error) {
      console.error('Error sending reminder notification:', error)
      return false
    }
  }

  /**
   * Send daily digest of reminders
   */
  static async sendDailyDigest(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          preferences: true
        }
      })

      if (!user) return false

      const preferences = this.parseUserPreferences(user.preferences)
      
      if (preferences.reminderFrequency !== 'Daily') {
        return false
      }

      const now = new Date()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(23, 59, 59, 999)

      const upcomingReminders = await prisma.reminder.findMany({
        where: {
          userId,
          isCompleted: false,
          dueDate: {
            gte: now,
            lte: tomorrow
          }
        },
        include: {
          application: {
            select: {
              company: true,
              position: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      })

      const overdueReminders = await prisma.reminder.findMany({
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
              company: true,
              position: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 5 // Limit to 5 most recent overdue
      })

      if (upcomingReminders.length === 0 && overdueReminders.length === 0) {
        return false // No reminders to send
      }

      const digestTemplate = this.generateDigestTemplate(
        user.firstName,
        upcomingReminders,
        overdueReminders
      )

      // Send digest through enabled channels
      const results = await Promise.allSettled([
        this.sendInAppDigest(userId, digestTemplate),
        preferences.emailNotifications 
          ? this.sendEmailDigest(user.email, digestTemplate)
          : Promise.resolve(true)
      ])

      return results.some(result => result.status === 'fulfilled' && result.value === true)

    } catch (error) {
      console.error('Error sending daily digest:', error)
      return false
    }
  }

  /**
   * Send weekly summary
   */
  static async sendWeeklyDigest(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          preferences: true
        }
      })

      if (!user) return false

      const preferences = this.parseUserPreferences(user.preferences)
      
      if (preferences.reminderFrequency !== 'Weekly') {
        return false
      }

      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const upcomingReminders = await prisma.reminder.findMany({
        where: {
          userId,
          isCompleted: false,
          dueDate: {
            gte: now,
            lte: nextWeek
          }
        },
        include: {
          application: {
            select: {
              company: true,
              position: true,
              status: true
            }
          }
        },
        orderBy: {
          dueDate: 'asc'
        }
      })

      if (upcomingReminders.length === 0) {
        return false
      }

      const weeklyTemplate = this.generateWeeklyTemplate(user.firstName, upcomingReminders)

      const results = await Promise.allSettled([
        this.sendInAppDigest(userId, weeklyTemplate),
        preferences.emailNotifications 
          ? this.sendEmailDigest(user.email, weeklyTemplate)
          : Promise.resolve(true)
      ])

      return results.some(result => result.status === 'fulfilled' && result.value === true)

    } catch (error) {
      console.error('Error sending weekly digest:', error)
      return false
    }
  }

  /**
   * Parse user preferences from JSON
   */
  private static parseUserPreferences(preferences: any): NotificationPreferences {
    const defaultPreferences: NotificationPreferences = {
      emailNotifications: true,
      reminderFrequency: 'Weekly',
      followUpReminders: true,
      interviewReminders: true,
      applicationDeadlines: true,
      channels: [
        { type: 'in-app', enabled: true },
        { type: 'email', enabled: true }
      ]
    }

    if (!preferences) return defaultPreferences

    return {
      ...defaultPreferences,
      ...preferences
    }
  }

  /**
   * Check if user wants this type of reminder
   */
  private static shouldSendReminder(reminderType: string, preferences: NotificationPreferences): boolean {
    switch (reminderType) {
      case 'follow_up':
        return preferences.followUpReminders
      case 'interview_prep':
        return preferences.interviewReminders
      case 'deadline':
        return preferences.applicationDeadlines
      default:
        return true
    }
  }

  /**
   * Generate reminder notification template
   */
  private static generateReminderTemplate(reminder: any): NotificationTemplate {
    const company = reminder.application?.company || 'Unknown Company'
    
    return {
      subject: `Reminder: ${reminder.title}`,
      body: `Hi! You have a reminder for your application at ${company}:\n\n${reminder.description}\n\nDue: ${new Date(reminder.dueDate).toLocaleDateString()}`,
      type: 'reminder'
    }
  }

  /**
   * Generate daily digest template
   */
  private static generateDigestTemplate(
    firstName: string,
    upcomingReminders: any[],
    overdueReminders: any[]
  ): NotificationTemplate {
    let body = `Hi ${firstName}!\n\nHere's your daily job search reminder digest:\n\n`

    if (overdueReminders.length > 0) {
      body += `🚨 OVERDUE REMINDERS (${overdueReminders.length}):\n`
      overdueReminders.forEach(reminder => {
        const company = reminder.application?.company || 'Unknown Company'
        body += `• ${reminder.title} (${company}) - Due: ${new Date(reminder.dueDate).toLocaleDateString()}\n`
      })
      body += '\n'
    }

    if (upcomingReminders.length > 0) {
      body += `📅 TODAY'S REMINDERS (${upcomingReminders.length}):\n`
      upcomingReminders.forEach(reminder => {
        const company = reminder.application?.company || 'Unknown Company'
        body += `• ${reminder.title} (${company}) - Due: ${new Date(reminder.dueDate).toLocaleTimeString()}\n`
      })
    }

    body += '\nStay organized and keep up the great work! 💪'

    return {
      subject: `Daily Job Search Digest - ${upcomingReminders.length + overdueReminders.length} reminders`,
      body,
      type: 'digest'
    }
  }

  /**
   * Generate weekly digest template
   */
  private static generateWeeklyTemplate(firstName: string, upcomingReminders: any[]): NotificationTemplate {
    let body = `Hi ${firstName}!\n\nHere's your weekly job search summary:\n\n`

    body += `📅 UPCOMING THIS WEEK (${upcomingReminders.length}):\n`
    
    const groupedByDay: { [key: string]: any[] } = {}
    upcomingReminders.forEach(reminder => {
      const day = new Date(reminder.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      if (!groupedByDay[day]) groupedByDay[day] = []
      groupedByDay[day].push(reminder)
    })

    Object.entries(groupedByDay).forEach(([day, reminders]) => {
      body += `\n${day}:\n`
      reminders.forEach(reminder => {
        const company = reminder.application?.company || 'Unknown Company'
        body += `  • ${reminder.title} (${company})\n`
      })
    })

    body += '\nPlan your week and stay on top of your job search! 🎯'

    return {
      subject: `Weekly Job Search Digest - ${upcomingReminders.length} reminders`,
      body,
      type: 'digest'
    }
  }

  /**
   * Send in-app notification (store in database for now)
   */
  private static async sendInAppNotification(
    userId: string, 
    template: NotificationTemplate, 
    reminder: any
  ): Promise<boolean> {
    try {
      // For now, we'll just log the notification
      // In a real implementation, you might store this in a notifications table
      console.log(`In-app notification for user ${userId}:`, {
        subject: template.subject,
        body: template.body,
        reminderId: reminder.id,
        timestamp: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error sending in-app notification:', error)
      return false
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    email: string, 
    template: NotificationTemplate, 
    reminder: any
  ): Promise<boolean> {
    try {
      // For now, we'll just log the email
      // In a real implementation, you would integrate with an email service like SendGrid
      console.log(`Email notification to ${email}:`, {
        subject: template.subject,
        body: template.body,
        reminderId: reminder.id,
        timestamp: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error sending email notification:', error)
      return false
    }
  }

  /**
   * Send in-app digest
   */
  private static async sendInAppDigest(userId: string, template: NotificationTemplate): Promise<boolean> {
    try {
      console.log(`In-app digest for user ${userId}:`, {
        subject: template.subject,
        body: template.body,
        timestamp: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error sending in-app digest:', error)
      return false
    }
  }

  /**
   * Send email digest
   */
  private static async sendEmailDigest(email: string, template: NotificationTemplate): Promise<boolean> {
    try {
      console.log(`Email digest to ${email}:`, {
        subject: template.subject,
        body: template.body,
        timestamp: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      console.error('Error sending email digest:', error)
      return false
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string) {
    // This would track notification delivery stats in a real implementation
    return {
      totalSent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0
    }
  }
}