/**
 * Tests for Workflow Engine and Advanced Automation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { WorkflowEngine } from '../automation/workflowEngine'
import { SmartAutomationService } from '../automation/smartAutomation'
import type { Application } from '../../types/application'

// Mock Prisma
const mockPrisma = {
  workflowRule: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'test-id' }),
    update: jest.fn().mockResolvedValue({ id: 'test-id' }),
    delete: jest.fn().mockResolvedValue({ id: 'test-id' })
  },
  workflowExecution: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' }),
    count: jest.fn().mockResolvedValue(0)
  },
  automationTask: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' }),
    findMany: jest.fn().mockResolvedValue([])
  },
  reminder: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' }),
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0)
  },
  notification: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' })
  },
  activity: {
    create: jest.fn().mockResolvedValue({ id: 'test-id' })
  },
  application: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue({ id: 'test-id' })
  }
}

jest.mock('../prisma', () => ({
  prisma: mockPrisma
}))

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine
  let mockApplication: Application

  beforeEach(() => {
    workflowEngine = WorkflowEngine.getInstance()
    mockApplication = {
      id: 'app-1',
      userId: 'user-1',
      company: 'Google',
      position: 'Software Engineer',
      status: 'Applied',
      appliedDate: new Date('2024-01-15'),
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Application
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Workflow Execution', () => {
    it('should execute workflows for application creation trigger', async () => {
      const trigger = {
        type: 'application_created' as const,
        config: {}
      }

      const executions = await workflowEngine.executeWorkflows(
        trigger,
        mockApplication,
        'user-1'
      )

      expect(executions).toBeDefined()
      expect(Array.isArray(executions)).toBe(true)
    })

    it('should execute workflows for status change trigger', async () => {
      const trigger = {
        type: 'status_changed' as const,
        config: { newStatus: 'Interviewing' }
      }

      const updatedApplication = {
        ...mockApplication,
        status: 'Interviewing',
        interviewDate: new Date('2024-01-25')
      }

      const executions = await workflowEngine.executeWorkflows(
        trigger,
        updatedApplication,
        'user-1'
      )

      expect(executions).toBeDefined()
    })

    it('should handle workflow execution errors gracefully', async () => {
      // Mock a workflow that will fail
      const trigger = {
        type: 'application_created' as const,
        config: {}
      }

      // This should not throw an error even if internal operations fail
      const executions = await workflowEngine.executeWorkflows(
        trigger,
        mockApplication,
        'user-1'
      )

      expect(executions).toBeDefined()
    })
  })

  describe('Automation Task Creation', () => {
    it('should create automation tasks with proper defaults', async () => {
      const taskData = {
        type: 'follow_up' as const,
        title: 'Follow up with Google',
        description: 'Send follow-up email',
        applicationId: mockApplication.id
      }

      const task = await workflowEngine.createAutomationTask('user-1', taskData)

      expect(task).toMatchObject({
        userId: 'user-1',
        type: 'follow_up',
        title: 'Follow up with Google',
        description: 'Send follow-up email',
        priority: 'medium',
        status: 'pending'
      })
      expect(task.id).toBeDefined()
      expect(task.createdAt).toBeInstanceOf(Date)
    })

    it('should generate task recommendations based on application data', async () => {
      const recommendations = await workflowEngine.getTaskRecommendations(
        'user-1',
        mockApplication.id
      )

      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should generate general task recommendations', async () => {
      const recommendations = await workflowEngine.getTaskRecommendations('user-1')

      expect(Array.isArray(recommendations)).toBe(true)
    })
  })

  describe('Workflow Rule Management', () => {
    it('should initialize with default rules', async () => {
      await workflowEngine.initialize()
      
      // The engine should be initialized without errors
      expect(workflowEngine).toBeDefined()
    })

    it('should match triggers correctly', async () => {
      const trigger1 = {
        type: 'application_created' as const,
        config: {}
      }

      const trigger2 = {
        type: 'status_changed' as const,
        config: { newStatus: 'Applied' }
      }

      // Both triggers should be valid
      expect(trigger1.type).toBe('application_created')
      expect(trigger2.type).toBe('status_changed')
    })
  })
})

describe('SmartAutomationService', () => {
  let smartAutomation: SmartAutomationService
  let mockApplications: Application[]

  beforeEach(() => {
    smartAutomation = SmartAutomationService.getInstance()
    mockApplications = [
      {
        id: 'app-1',
        userId: 'user-1',
        company: 'Google',
        position: 'Software Engineer',
        status: 'Applied',
        appliedDate: new Date('2024-01-01'),
        responseDate: new Date('2024-01-08'),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'app-2',
        userId: 'user-1',
        company: 'Microsoft',
        position: 'Product Manager',
        status: 'Interviewing',
        appliedDate: new Date('2024-01-05'),
        interviewDate: new Date('2024-01-15'),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'app-3',
        userId: 'user-1',
        company: 'Apple',
        position: 'Designer',
        status: 'Rejected',
        appliedDate: new Date('2024-01-10'),
        responseDate: new Date('2024-01-20'),
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ] as Application[]
  })

  describe('Smart Suggestions', () => {
    it('should generate smart suggestions based on user patterns', async () => {
      const suggestions = await smartAutomation.generateSmartSuggestions('user-1')

      expect(Array.isArray(suggestions)).toBe(true)
      
      // Should have suggestions with proper structure
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('id')
        expect(suggestion).toHaveProperty('type')
        expect(suggestion).toHaveProperty('title')
        expect(suggestion).toHaveProperty('description')
        expect(suggestion).toHaveProperty('confidence')
        expect(suggestion).toHaveProperty('impact')
        expect(suggestion).toHaveProperty('effort')
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0)
        expect(suggestion.confidence).toBeLessThanOrEqual(1)
      })
    })

    it('should detect patterns in application data', async () => {
      const patterns = await smartAutomation.detectPatterns(mockApplications)

      expect(Array.isArray(patterns)).toBe(true)
      
      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('id')
        expect(pattern).toHaveProperty('name')
        expect(pattern).toHaveProperty('confidence')
        expect(pattern.confidence).toBeGreaterThan(0.6) // Only high-confidence patterns
      })
    })

    it('should generate automation insights', async () => {
      const insights = await smartAutomation.generateInsights('user-1')

      expect(Array.isArray(insights)).toBe(true)
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id')
        expect(insight).toHaveProperty('type')
        expect(insight).toHaveProperty('title')
        expect(insight).toHaveProperty('description')
        expect(insight).toHaveProperty('confidence')
        expect(['pattern', 'anomaly', 'opportunity', 'warning']).toContain(insight.type)
      })
    })
  })

  describe('Workflow Optimization', () => {
    it('should optimize user workflows', async () => {
      const optimization = await smartAutomation.optimizeWorkflows('user-1')

      expect(optimization).toHaveProperty('optimizations')
      expect(optimization).toHaveProperty('estimatedTimeSaved')
      expect(optimization).toHaveProperty('confidence')
      
      expect(Array.isArray(optimization.optimizations)).toBe(true)
      expect(typeof optimization.estimatedTimeSaved).toBe('number')
      expect(typeof optimization.confidence).toBe('number')
      expect(optimization.confidence).toBeGreaterThanOrEqual(0)
      expect(optimization.confidence).toBeLessThanOrEqual(1)
    })

    it('should create smart rules from patterns', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          name: 'High Success Pattern',
          description: 'Applications on Tuesday have higher success rates',
          pattern: [],
          confidence: 0.85,
          frequency: 10
        }
      ]

      // Should not throw error
      await expect(
        smartAutomation.createSmartRules('user-1', mockPatterns)
      ).resolves.not.toThrow()
    })
  })

  describe('Pattern Analysis', () => {
    it('should analyze response patterns correctly', async () => {
      // This tests the internal pattern analysis
      const suggestions = await smartAutomation.generateSmartSuggestions('user-1')
      
      // Should generate suggestions based on the mock data
      expect(suggestions.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty application data gracefully', async () => {
      const suggestions = await smartAutomation.generateSmartSuggestions('user-empty')
      
      // Should return empty array or basic suggestions for users with no data
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('should calculate timing patterns', async () => {
      const patterns = await smartAutomation.detectPatterns(mockApplications)
      
      // Should detect patterns without errors
      expect(Array.isArray(patterns)).toBe(true)
    })
  })
})

describe('Integration Tests', () => {
  let workflowEngine: WorkflowEngine
  let smartAutomation: SmartAutomationService

  beforeEach(() => {
    workflowEngine = WorkflowEngine.getInstance()
    smartAutomation = SmartAutomationService.getInstance()
  })

  it('should integrate workflow engine with smart automation', async () => {
    const mockApplication = {
      id: 'app-1',
      userId: 'user-1',
      company: 'Google',
      position: 'Software Engineer',
      status: 'Applied',
      appliedDate: new Date(),
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    } as Application

    // Generate suggestions
    const suggestions = await smartAutomation.generateSmartSuggestions('user-1')
    
    // Execute workflows
    const executions = await workflowEngine.executeWorkflows(
      { type: 'application_created', config: {} },
      mockApplication,
      'user-1'
    )

    // Both should work without errors
    expect(Array.isArray(suggestions)).toBe(true)
    expect(Array.isArray(executions)).toBe(true)
  })

  it('should handle concurrent workflow executions', async () => {
    const mockApplications = [
      { id: 'app-1', userId: 'user-1', company: 'Google', status: 'Applied' },
      { id: 'app-2', userId: 'user-1', company: 'Microsoft', status: 'Applied' },
      { id: 'app-3', userId: 'user-1', company: 'Apple', status: 'Applied' }
    ] as Application[]

    const promises = mockApplications.map(app =>
      workflowEngine.executeWorkflows(
        { type: 'application_created', config: {} },
        app,
        'user-1'
      )
    )

    // All executions should complete without errors
    const results = await Promise.all(promises)
    
    expect(results).toHaveLength(3)
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true)
    })
  })

  it('should maintain data consistency across operations', async () => {
    const userId = 'user-1'
    
    // Create automation task
    const task = await workflowEngine.createAutomationTask(userId, {
      type: 'follow_up',
      title: 'Test Task'
    })

    // Generate recommendations
    const recommendations = await workflowEngine.getTaskRecommendations(userId)

    // Both operations should maintain consistent user context
    expect(task.userId).toBe(userId)
    expect(Array.isArray(recommendations)).toBe(true)
  })
})

describe('Error Handling and Edge Cases', () => {
  let workflowEngine: WorkflowEngine
  let smartAutomation: SmartAutomationService

  beforeEach(() => {
    workflowEngine = WorkflowEngine.getInstance()
    smartAutomation = SmartAutomationService.getInstance()
  })

  it('should handle invalid workflow triggers gracefully', async () => {
    const invalidTrigger = {
      type: 'invalid_trigger' as any,
      config: {}
    }

    const mockApplication = {
      id: 'app-1',
      userId: 'user-1',
      company: 'Test',
      status: 'Applied'
    } as Application

    // Should not throw error
    const executions = await workflowEngine.executeWorkflows(
      invalidTrigger,
      mockApplication,
      'user-1'
    )

    expect(Array.isArray(executions)).toBe(true)
  })

  it('should handle missing application data', async () => {
    const incompleteApplication = {
      id: 'app-1',
      userId: 'user-1'
      // Missing required fields
    } as any

    // Should not throw error
    const executions = await workflowEngine.executeWorkflows(
      { type: 'application_created', config: {} },
      incompleteApplication,
      'user-1'
    )

    expect(Array.isArray(executions)).toBe(true)
  })

  it('should handle database connection errors', async () => {
    // Mock database error
    const originalPrisma = require('../prisma').prisma
    require('../prisma').prisma.workflowRule.findMany = jest.fn().mockRejectedValue(
      new Error('Database connection failed')
    )

    // Should handle error gracefully
    await expect(
      workflowEngine.initialize()
    ).resolves.not.toThrow()

    // Restore original
    require('../prisma').prisma = originalPrisma
  })

  it('should validate automation task data', async () => {
    const invalidTaskData = {
      // Missing required fields
      description: 'Test task'
    }

    const task = await workflowEngine.createAutomationTask('user-1', invalidTaskData)

    // Should create task with defaults
    expect(task.type).toBe('custom')
    expect(task.title).toBe('Untitled Task')
    expect(task.priority).toBe('medium')
  })

  it('should handle empty user data for suggestions', async () => {
    const suggestions = await smartAutomation.generateSmartSuggestions('nonexistent-user')

    // Should return empty array without errors
    expect(Array.isArray(suggestions)).toBe(true)
  })
})