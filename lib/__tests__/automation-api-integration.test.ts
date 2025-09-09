/**
 * Integration Tests for Automation API Endpoints
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as getWorkflows, POST as createWorkflow } from '../../app/api/automation/workflows/route'
import { GET as getSuggestions } from '../../app/api/automation/suggestions/route'
import { GET as getInsights } from '../../app/api/automation/insights/route'
import { GET as getStats } from '../../app/api/automation/stats/route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    workflowRule: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    workflowExecution: {
      count: jest.fn()
    },
    application: {
      findMany: jest.fn()
    },
    reminder: {
      count: jest.fn()
    }
  }
}))

// Mock auth options
jest.mock('../auth', () => ({
  authOptions: {}
}))

describe('Automation API Integration Tests', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'test@example.com'
    }
  }

  beforeEach(() => {
    const { getServerSession } = require('next-auth')
    getServerSession.mockResolvedValue(mockSession)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Workflows API', () => {
    it('should get user workflows', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.findMany.mockResolvedValue([
        {
          id: 'workflow-1',
          userId: 'user-1',
          name: 'Auto Follow-up',
          description: 'Automatically create follow-up reminders',
          trigger: '{"type":"application_created","config":{}}',
          conditions: '[]',
          actions: '[{"type":"create_reminder","config":{}}]',
          isActive: true,
          priority: 1,
          executionCount: 5,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      const request = new NextRequest('http://localhost/api/automation/workflows')
      const response = await getWorkflows(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.workflows).toHaveLength(1)
      expect(data.workflows[0].name).toBe('Auto Follow-up')
      expect(data.workflows[0].trigger).toEqual({ type: 'application_created', config: {} })
    })

    it('should create new workflow', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.create.mockResolvedValue({
        id: 'workflow-2',
        userId: 'user-1',
        name: 'Interview Prep',
        description: 'Create prep tasks for interviews',
        trigger: '{"type":"status_changed","config":{"newStatus":"Interviewing"}}',
        conditions: '[]',
        actions: '[{"type":"create_task","config":{}}]',
        isActive: true,
        priority: 2,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const workflowData = {
        name: 'Interview Prep',
        description: 'Create prep tasks for interviews',
        trigger: {
          type: 'status_changed',
          config: { newStatus: 'Interviewing' }
        },
        conditions: [],
        actions: [{
          type: 'create_task',
          config: {}
        }]
      }

      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: JSON.stringify(workflowData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.workflow.name).toBe('Interview Prep')
      expect(prisma.workflowRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Interview Prep',
          description: 'Create prep tasks for interviews'
        })
      })
    })

    it('should validate workflow data', async () => {
      const invalidWorkflowData = {
        // Missing required name field
        description: 'Invalid workflow',
        trigger: { type: 'application_created' },
        actions: []
      }

      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidWorkflowData),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid workflow data')
    })

    it('should require authentication', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/automation/workflows')
      const response = await getWorkflows(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Suggestions API', () => {
    it('should generate smart suggestions', async () => {
      const { prisma } = require('../prisma')
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          userId: 'user-1',
          company: 'Google',
          position: 'Engineer',
          status: 'Applied',
          appliedDate: new Date('2024-01-01'),
          responseDate: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      const request = new NextRequest('http://localhost/api/automation/suggestions')
      const response = await getSuggestions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.suggestions)).toBe(true)
    })

    it('should handle empty application data', async () => {
      const { prisma } = require('../prisma')
      prisma.application.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost/api/automation/suggestions')
      const response = await getSuggestions(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.suggestions)).toBe(true)
    })
  })

  describe('Insights API', () => {
    it('should generate automation insights', async () => {
      const { prisma } = require('../prisma')
      prisma.application.findMany.mockResolvedValue([
        {
          id: 'app-1',
          userId: 'user-1',
          company: 'Google',
          status: 'Applied',
          appliedDate: new Date('2024-01-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      const request = new NextRequest('http://localhost/api/automation/insights')
      const response = await getInsights(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.insights)).toBe(true)
    })
  })

  describe('Stats API', () => {
    it('should return automation statistics', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.count.mockResolvedValue(5)
      prisma.workflowRule.findMany.mockResolvedValue([
        { executionCount: 10 },
        { executionCount: 5 },
        { executionCount: 3 }
      ])
      prisma.workflowExecution.count.mockResolvedValue(18)

      const request = new NextRequest('http://localhost/api/automation/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.stats).toMatchObject({
        totalRules: 5,
        totalExecutions: 18,
        timeSaved: expect.any(Number),
        successRate: expect.any(Number)
      })
    })

    it('should handle missing execution data gracefully', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.count.mockResolvedValue(0)
      prisma.workflowRule.findMany.mockResolvedValue([])
      prisma.workflowExecution.count.mockRejectedValue(new Error('Table not found'))

      const request = new NextRequest('http://localhost/api/automation/stats')
      const response = await getStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.stats.totalRules).toBe(0)
      expect(data.stats.totalExecutions).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost/api/automation/workflows')
      const response = await getWorkflows(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch workflows')
    })

    it('should handle malformed JSON in requests', async () => {
      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should handle missing user session', async () => {
      const { getServerSession } = require('next-auth')
      getServerSession.mockResolvedValue({ user: {} }) // Missing user.id

      const request = new NextRequest('http://localhost/api/automation/workflows')
      const response = await getWorkflows(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Data Validation', () => {
    it('should validate workflow trigger types', async () => {
      const invalidWorkflow = {
        name: 'Test Workflow',
        trigger: {
          type: 'invalid_trigger_type',
          config: {}
        },
        actions: [{
          type: 'create_reminder',
          config: {}
        }]
      }

      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidWorkflow),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid workflow data')
    })

    it('should validate workflow action types', async () => {
      const invalidWorkflow = {
        name: 'Test Workflow',
        trigger: {
          type: 'application_created',
          config: {}
        },
        actions: [{
          type: 'invalid_action_type',
          config: {}
        }]
      }

      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidWorkflow),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid workflow data')
    })

    it('should require at least one action', async () => {
      const invalidWorkflow = {
        name: 'Test Workflow',
        trigger: {
          type: 'application_created',
          config: {}
        },
        actions: [] // Empty actions array
      }

      const request = new NextRequest('http://localhost/api/automation/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidWorkflow),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await createWorkflow(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid workflow data')
    })
  })

  describe('Performance Tests', () => {
    it('should handle large numbers of workflows efficiently', async () => {
      const { prisma } = require('../prisma')
      const largeWorkflowList = Array.from({ length: 100 }, (_, i) => ({
        id: `workflow-${i}`,
        userId: 'user-1',
        name: `Workflow ${i}`,
        description: `Description ${i}`,
        trigger: '{"type":"application_created","config":{}}',
        conditions: '[]',
        actions: '[{"type":"create_reminder","config":{}}]',
        isActive: true,
        priority: 1,
        executionCount: i,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      prisma.workflowRule.findMany.mockResolvedValue(largeWorkflowList)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/automation/workflows')
      const response = await getWorkflows(request)
      const endTime = Date.now()

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workflows).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent requests', async () => {
      const { prisma } = require('../prisma')
      prisma.workflowRule.findMany.mockResolvedValue([])

      const requests = Array.from({ length: 10 }, () =>
        getWorkflows(new NextRequest('http://localhost/api/automation/workflows'))
      )

      const responses = await Promise.all(requests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})