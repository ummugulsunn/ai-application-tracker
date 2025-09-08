import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Prisma first, before importing anything else
const mockPrisma = {
  reminder: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Now import the services after mocking
import { ReminderService } from '@/lib/reminders/reminderService'
import { NotificationService } from '@/lib/reminders/notificationService'
import { Application } from '@/types/application'

const mockApplication: Application = {
  id: 'test-app-1',
  company: 'Test Company',
  position: 'Software Engineer',
  location: 'San Francisco, CA',
  type: 'Full-time',
  salary: '$100,000 - $120,000',
  status: 'Applied',
  appliedDate: new Date().toISOString(),
  responseDate: null,
  interviewDate: null,
  notes: 'Test application',
  contactPerson: 'John Doe',
  contactEmail: 'john@testcompany.com',
  website: 'https://testcompany.com',
  tags: ['tech', 'startup'],
  priority: 'High',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user-1',
}

describe('Reminder System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset all mock functions
    Object.values(mockPrisma.reminder).forEach(mock => {
      if (typeof mock === 'function') {
        (mock as jest.Mock).mockReset()
      }
    })
    Object.values(mockPrisma.user).forEach(mock => {
      if (typeof mock === 'function') {
        (mock as jest.Mock).mockReset()
      }
    })
  })

  describe('ReminderService', () => {
    describe('createAutomaticReminders', () => {
      it('should create follow-up reminders for applied applications', async () => {
        mockPrisma.reminder.createMany.mockResolvedValue({ count: 2 })

        await ReminderService.createAutomaticReminders('test-user-1', mockApplication)

        expect(mockPrisma.reminder.createMany).toHaveBeenCalledWith({
          data: expect.arrayContaining([
            expect.objectContaining({
              userId: 'test-user-1',
              applicationId: 'test-app-1',
              reminderType: 'follow_up',
              title: expect.stringContaining('Test Company'),
            }),
          ]),
        })
      })

      it('should create interview reminders when status is interviewing', async () => {
        mockPrisma.reminder.createMany.mockResolvedValue({ count: 3 })

        const interviewApp = {
          ...mockApplication,
          status: 'Interviewing',
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        }

        await ReminderService.createAutomaticReminders('test-user-1', interviewApp)

        expect(mockPrisma.reminder.createMany).toHaveBeenCalled()
      })

      it('should handle errors gracefully', async () => {
        mockPrisma.reminder.createMany.mockRejectedValue(new Error('Database error'))

        // Should not throw error
        await expect(
          ReminderService.createAutomaticReminders('test-user-1', mockApplication)
        ).resolves.toBeUndefined()
      })
    })

    describe('updateRemindersForStatusChange', () => {
      it('should cancel reminders when application is rejected', async () => {
        mockPrisma.reminder.updateMany.mockResolvedValue({ count: 2 })

        await ReminderService.updateRemindersForStatusChange(
          'test-user-1',
          'test-app-1',
          'Applied',
          'Rejected',
          { ...mockApplication, status: 'Rejected' }
        )

        expect(mockPrisma.reminder.updateMany).toHaveBeenCalledWith({
          where: {
            userId: 'test-user-1',
            applicationId: 'test-app-1',
            isCompleted: false,
          },
          data: {
            isCompleted: true,
          },
        })
      })

      it('should create interview reminders when status changes to interviewing', async () => {
        mockPrisma.reminder.updateMany.mockResolvedValue({ count: 0 })
        mockPrisma.reminder.createMany.mockResolvedValue({ count: 3 })

        const interviewApp = {
          ...mockApplication,
          status: 'Interviewing',
          interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        }

        await ReminderService.updateRemindersForStatusChange(
          'test-user-1',
          'test-app-1',
          'Applied',
          'Interviewing',
          interviewApp
        )

        expect(mockPrisma.reminder.createMany).toHaveBeenCalled()
      })
    })

    describe('getUpcomingReminders', () => {
      it('should fetch upcoming reminders within specified days', async () => {
        const mockReminders = [
          {
            id: 'reminder-1',
            title: 'Follow up - Test Company',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            application: { company: 'Test Company' },
          },
        ]

        mockPrisma.reminder.findMany.mockResolvedValue(mockReminders)

        const result = await ReminderService.getUpcomingReminders('test-user-1', 7)

        expect(mockPrisma.reminder.findMany).toHaveBeenCalledWith({
          where: {
            userId: 'test-user-1',
            isCompleted: false,
            dueDate: {
              lte: expect.any(Date),
            },
          },
          include: {
            application: {
              select: {
                id: true,
                company: true,
                position: true,
                status: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        })

        expect(result).toEqual(mockReminders)
      })
    })

    describe('completeReminder', () => {
      it('should mark reminder as completed', async () => {
        mockPrisma.reminder.updateMany.mockResolvedValue({ count: 1 })

        const result = await ReminderService.completeReminder('test-user-1', 'reminder-1')

        expect(mockPrisma.reminder.updateMany).toHaveBeenCalledWith({
          where: {
            id: 'reminder-1',
            userId: 'test-user-1',
            isCompleted: false,
          },
          data: {
            isCompleted: true,
          },
        })

        expect(result).toBe(true)
      })

      it('should return false if reminder not found', async () => {
        mockPrisma.reminder.updateMany.mockResolvedValue({ count: 0 })

        const result = await ReminderService.completeReminder('test-user-1', 'nonexistent')

        expect(result).toBe(false)
      })
    })

    describe('snoozeReminder', () => {
      it('should update reminder due date', async () => {
        mockPrisma.reminder.findFirst.mockResolvedValue({
          id: 'reminder-1',
          dueDate: new Date(),
        })
        mockPrisma.reminder.update.mockResolvedValue({})

        const result = await ReminderService.snoozeReminder('test-user-1', 'reminder-1', 4)

        expect(mockPrisma.reminder.findFirst).toHaveBeenCalled()
        expect(mockPrisma.reminder.update).toHaveBeenCalledWith({
          where: { id: 'reminder-1' },
          data: { dueDate: expect.any(Date) },
        })

        expect(result).toBe(true)
      })
    })

    describe('getReminderStats', () => {
      it('should calculate reminder statistics', async () => {
        const mockCounts = [10, 7, 2, 3] // total, completed, overdue, upcoming
        mockPrisma.reminder.count
          .mockResolvedValueOnce(mockCounts[0])
          .mockResolvedValueOnce(mockCounts[1])
          .mockResolvedValueOnce(mockCounts[2])
          .mockResolvedValueOnce(mockCounts[3])

        const stats = await ReminderService.getReminderStats('test-user-1')

        expect(stats).toEqual({
          total: 10,
          completed: 7,
          overdue: 2,
          upcoming: 3,
          completionRate: 70,
        })
      })
    })
  })

  describe('NotificationService', () => {
    describe('sendReminderNotification', () => {
      it('should send notification for valid reminder', async () => {
        const mockReminder = {
          id: 'reminder-1',
          title: 'Follow up - Test Company',
          description: 'Send follow-up email',
          reminderType: 'follow_up',
          dueDate: new Date(),
          application: { company: 'Test Company' },
          user: {
            email: 'test@example.com',
            firstName: 'Test',
            preferences: { emailNotifications: true, followUpReminders: true },
          },
        }

        mockPrisma.reminder.findFirst.mockResolvedValue(mockReminder)

        const result = await NotificationService.sendReminderNotification(
          'test-user-1',
          'reminder-1',
          ['in-app', 'email']
        )

        expect(mockPrisma.reminder.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'reminder-1',
            userId: 'test-user-1',
            isCompleted: false,
          },
          include: expect.any(Object),
        })

        expect(result).toBe(true)
      })

      it('should return false for non-existent reminder', async () => {
        mockPrisma.reminder.findFirst.mockResolvedValue(null)

        const result = await NotificationService.sendReminderNotification(
          'test-user-1',
          'nonexistent',
          ['in-app']
        )

        expect(result).toBe(false)
      })
    })

    describe('sendDailyDigest', () => {
      it('should send daily digest for users with daily frequency', async () => {
        const mockUser = {
          email: 'test@example.com',
          firstName: 'Test',
          preferences: { reminderFrequency: 'Daily', emailNotifications: true },
        }

        const mockUpcomingReminders = [
          {
            id: 'reminder-1',
            title: 'Follow up - Test Company',
            dueDate: new Date(),
            application: { company: 'Test Company' },
          },
        ]

        mockPrisma.user.findUnique.mockResolvedValue(mockUser)
        mockPrisma.reminder.findMany.mockResolvedValue(mockUpcomingReminders)

        const result = await NotificationService.sendDailyDigest('test-user-1')

        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'test-user-1' },
          select: expect.any(Object),
        })

        expect(result).toBe(true)
      })

      it('should return false for users with non-daily frequency', async () => {
        const mockUser = {
          email: 'test@example.com',
          firstName: 'Test',
          preferences: { reminderFrequency: 'Weekly' },
        }

        mockPrisma.user.findUnique.mockResolvedValue(mockUser)

        const result = await NotificationService.sendDailyDigest('test-user-1')

        expect(result).toBe(false)
      })
    })
  })

  describe('Integration Scenarios', () => {
    it('should create reminders and send notifications for new application', async () => {
      // Mock reminder creation
      mockPrisma.reminder.createMany.mockResolvedValue({ count: 2 })

      // Create automatic reminders
      await ReminderService.createAutomaticReminders('test-user-1', mockApplication)

      expect(mockPrisma.reminder.createMany).toHaveBeenCalled()

      // Mock notification sending
      const mockReminder = {
        id: 'reminder-1',
        title: 'Follow up - Test Company',
        reminderType: 'follow_up',
        user: {
          email: 'test@example.com',
          firstName: 'Test',
          preferences: { emailNotifications: true, followUpReminders: true },
        },
      }

      mockPrisma.reminder.findFirst.mockResolvedValue(mockReminder)

      const notificationResult = await NotificationService.sendReminderNotification(
        'test-user-1',
        'reminder-1'
      )

      expect(notificationResult).toBe(true)
    })

    it('should handle status changes and update reminders accordingly', async () => {
      // Mock canceling old reminders
      mockPrisma.reminder.updateMany.mockResolvedValue({ count: 2 })

      // Mock creating new reminders
      mockPrisma.reminder.createMany.mockResolvedValue({ count: 3 })

      const interviewApp = {
        ...mockApplication,
        status: 'Interviewing',
        interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      }

      await ReminderService.updateRemindersForStatusChange(
        'test-user-1',
        'test-app-1',
        'Applied',
        'Interviewing',
        interviewApp
      )

      // Should create interview-specific reminders
      expect(mockPrisma.reminder.createMany).toHaveBeenCalled()
    })
  })
})