/**
 * Advanced Workflow Engine for Job Application Automation
 * Provides intelligent automation, workflow orchestration, and smart triggers
 */

import { Application } from '@/types/application'
import { ReminderService } from '@/lib/reminders/reminderService'
import { prisma } from '@/lib/prisma'

export interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: WorkflowTrigger
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  isActive: boolean
  priority: number
  createdAt: Date
  updatedAt: Date
}

export interface WorkflowTrigger {
  type: 'application_created' | 'status_changed' | 'date_reached' | 'no_response' | 'manual'
  config: Record<string, any>
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'days_since'
  value: any
}

export interface WorkflowAction {
  type: 'create_reminder' | 'send_notification' | 'update_status' | 'create_task' | 'send_email' | 'log_activity'
  config: Record<string, any>
}

export interface WorkflowExecution {
  id: string
  workflowRuleId: string
  applicationId: string
  userId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  executedAt: Date
}

export interface AutomationTask {
  id: string
  userId: string
  applicationId?: string
  type: 'follow_up' | 'research_company' | 'prepare_interview' | 'update_status' | 'custom'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  dueDate?: Date
  estimatedDuration?: number // in minutes
  dependencies?: string[] // task IDs this task depends on
  tags: string[]
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export class WorkflowEngine {
  private static instance: WorkflowEngine
  private rules: Map<string, WorkflowRule> = new Map()
  private isInitialized = false

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine()
    }
    return WorkflowEngine.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Load default workflow rules
    await this.loadDefaultRules()
    
    // Load custom user rules from database
    await this.loadUserRules()
    
    this.isInitialized = true
  }

  /**
   * Execute workflows triggered by application events
   */
  async executeWorkflows(
    trigger: WorkflowTrigger, 
    application: Application, 
    userId: string,
    context: Record<string, any> = {}
  ): Promise<WorkflowExecution[]> {
    await this.initialize()

    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.isActive && this.matchesTrigger(rule.trigger, trigger))
      .sort((a, b) => b.priority - a.priority)

    const executions: WorkflowExecution[] = []

    for (const rule of applicableRules) {
      if (await this.evaluateConditions(rule.conditions, application, context)) {
        const execution = await this.executeRule(rule, application, userId, context)
        executions.push(execution)
      }
    }

    return executions
  }

  /**
   * Create a smart automation task
   */
  async createAutomationTask(
    userId: string,
    taskData: Partial<AutomationTask>
  ): Promise<AutomationTask> {
    const task: AutomationTask = {
      id: crypto.randomUUID(),
      userId,
      type: taskData.type || 'custom',
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: 'pending',
      tags: taskData.tags || [],
      metadata: taskData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData
    }

    // Store in database
    await prisma.automationTask.create({
      data: {
        ...task,
        metadata: JSON.stringify(task.metadata)
      }
    })

    return task
  }

  /**
   * Get smart task recommendations based on application data
   */
  async getTaskRecommendations(userId: string, applicationId?: string): Promise<AutomationTask[]> {
    const recommendations: AutomationTask[] = []
    
    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId }
      })
      
      if (application) {
        recommendations.push(...await this.generateApplicationTasks(userId, application))
      }
    } else {
      // Generate general recommendations
      recommendations.push(...await this.generateGeneralTasks(userId))
    }

    return recommendations
  }

  /**
   * Execute a workflow rule
   */
  private async executeRule(
    rule: WorkflowRule,
    application: Application,
    userId: string,
    context: Record<string, any>
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflowRuleId: rule.id,
      applicationId: application.id,
      userId,
      status: 'running',
      executedAt: new Date()
    }

    try {
      const results = []
      
      for (const action of rule.actions) {
        const result = await this.executeAction(action, application, userId, context)
        results.push(result)
      }

      execution.status = 'completed'
      execution.result = results

      // Log execution
      await prisma.workflowExecution.create({
        data: {
          ...execution,
          result: JSON.stringify(execution.result)
        }
      })

    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error('Workflow execution failed:', error)
    }

    return execution
  }

  /**
   * Execute a workflow action
   */
  private async executeAction(
    action: WorkflowAction,
    application: Application,
    userId: string,
    context: Record<string, any>
  ): Promise<any> {
    switch (action.type) {
      case 'create_reminder':
        return await this.createReminderAction(action.config, application, userId)
      
      case 'send_notification':
        return await this.sendNotificationAction(action.config, application, userId)
      
      case 'update_status':
        return await this.updateStatusAction(action.config, application, userId)
      
      case 'create_task':
        return await this.createTaskAction(action.config, application, userId)
      
      case 'send_email':
        return await this.sendEmailAction(action.config, application, userId)
      
      case 'log_activity':
        return await this.logActivityAction(action.config, application, userId)
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Action implementations
   */
  private async createReminderAction(config: any, application: Application, userId: string) {
    const reminderData = {
      userId,
      applicationId: application.id,
      reminderType: config.type || 'follow_up',
      title: config.title || `Follow up on ${application.company}`,
      description: config.description || 'Follow up on your application',
      dueDate: new Date(Date.now() + (config.daysFromNow || 7) * 24 * 60 * 60 * 1000),
      isCompleted: false
    }

    return await prisma.reminder.create({ data: reminderData })
  }

  private async sendNotificationAction(config: any, application: Application, userId: string) {
    // Implementation for sending notifications
    const notification = {
      userId,
      title: config.title || 'Application Update',
      message: config.message || `Update for ${application.company} - ${application.position}`,
      type: config.notificationType || 'info',
      applicationId: application.id
    }

    return await prisma.notification.create({ data: notification })
  }

  private async updateStatusAction(config: any, application: Application, userId: string) {
    const newStatus = config.status
    
    return await prisma.application.update({
      where: { id: application.id },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    })
  }

  private async createTaskAction(config: any, application: Application, userId: string) {
    return await this.createAutomationTask(userId, {
      applicationId: application.id,
      type: config.taskType || 'custom',
      title: config.title || `Task for ${application.company}`,
      description: config.description || '',
      priority: config.priority || 'medium',
      dueDate: config.dueDate ? new Date(config.dueDate) : undefined,
      tags: config.tags || []
    })
  }

  private async sendEmailAction(config: any, application: Application, userId: string) {
    // Implementation for sending emails (would integrate with email service)
    console.log('Email action:', config, application.company)
    return { sent: true, config, application: application.company }
  }

  private async logActivityAction(config: any, application: Application, userId: string) {
    const activity = {
      userId,
      applicationId: application.id,
      type: config.activityType || 'workflow_action',
      description: config.description || 'Workflow action executed',
      metadata: JSON.stringify(config)
    }

    return await prisma.activity.create({ data: activity })
  }

  /**
   * Generate application-specific task recommendations
   */
  private async generateApplicationTasks(userId: string, application: any): Promise<AutomationTask[]> {
    const tasks: AutomationTask[] = []
    const now = new Date()
    const daysSinceApplied = Math.floor((now.getTime() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24))

    // Follow-up tasks based on status and timing
    if (application.status === 'Applied' && daysSinceApplied >= 7) {
      tasks.push(await this.createAutomationTask(userId, {
        applicationId: application.id,
        type: 'follow_up',
        title: `Follow up with ${application.company}`,
        description: `It's been ${daysSinceApplied} days since you applied. Consider sending a polite follow-up email.`,
        priority: 'medium',
        tags: ['follow-up', 'communication']
      }))
    }

    // Research tasks for new applications
    if (application.status === 'Applied' && daysSinceApplied <= 2) {
      tasks.push(await this.createAutomationTask(userId, {
        applicationId: application.id,
        type: 'research_company',
        title: `Research ${application.company}`,
        description: `Learn more about ${application.company}'s culture, recent news, and key people.`,
        priority: 'low',
        estimatedDuration: 30,
        tags: ['research', 'preparation']
      }))
    }

    // Interview preparation tasks
    if (application.status === 'Interviewing') {
      tasks.push(await this.createAutomationTask(userId, {
        applicationId: application.id,
        type: 'prepare_interview',
        title: `Prepare for ${application.company} interview`,
        description: `Review job requirements, practice common questions, and prepare questions to ask.`,
        priority: 'high',
        estimatedDuration: 120,
        tags: ['interview', 'preparation']
      }))
    }

    return tasks
  }

  /**
   * Generate general task recommendations
   */
  private async generateGeneralTasks(userId: string): Promise<AutomationTask[]> {
    const tasks: AutomationTask[] = []

    // Get user's applications to analyze patterns
    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { appliedDate: 'desc' },
      take: 10
    })

    // Suggest updating old applications
    const staleApplications = applications.filter(app => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      return daysSinceUpdate > 14 && app.status === 'Applied'
    })

    if (staleApplications.length > 0) {
      tasks.push(await this.createAutomationTask(userId, {
        type: 'update_status',
        title: 'Update stale applications',
        description: `You have ${staleApplications.length} applications that haven't been updated in over 2 weeks.`,
        priority: 'medium',
        tags: ['maintenance', 'status-update']
      }))
    }

    return tasks
  }

  /**
   * Load default workflow rules
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: WorkflowRule[] = [
      {
        id: 'auto-follow-up-7-days',
        name: 'Auto Follow-up After 7 Days',
        description: 'Automatically create follow-up reminder 7 days after application',
        trigger: { type: 'application_created', config: {} },
        conditions: [
          { field: 'status', operator: 'equals', value: 'Applied' }
        ],
        actions: [
          {
            type: 'create_reminder',
            config: {
              type: 'follow_up',
              title: 'Follow up on application',
              daysFromNow: 7
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'interview-prep-reminder',
        name: 'Interview Preparation Reminder',
        description: 'Create preparation tasks when status changes to interviewing',
        trigger: { type: 'status_changed', config: { newStatus: 'Interviewing' } },
        conditions: [],
        actions: [
          {
            type: 'create_task',
            config: {
              taskType: 'prepare_interview',
              title: 'Prepare for interview',
              description: 'Research company and practice interview questions',
              priority: 'high'
            }
          },
          {
            type: 'create_reminder',
            config: {
              type: 'interview_prep',
              title: 'Interview preparation',
              daysFromNow: -1
            }
          }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'stale-application-alert',
        name: 'Stale Application Alert',
        description: 'Alert when applications have no updates for 14 days',
        trigger: { type: 'date_reached', config: { checkInterval: 'daily' } },
        conditions: [
          { field: 'status', operator: 'equals', value: 'Applied' },
          { field: 'updatedAt', operator: 'days_since', value: 14 }
        ],
        actions: [
          {
            type: 'send_notification',
            config: {
              title: 'Stale Application',
              message: 'This application hasn\'t been updated in 2 weeks',
              notificationType: 'warning'
            }
          },
          {
            type: 'create_task',
            config: {
              taskType: 'update_status',
              title: 'Update application status',
              priority: 'medium'
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * Load user-specific workflow rules from database
   */
  private async loadUserRules(): Promise<void> {
    try {
      const userRules = await prisma.workflowRule.findMany({
        where: { isActive: true }
      })

      userRules.forEach(rule => {
        this.rules.set(rule.id, {
          ...rule,
          trigger: JSON.parse(rule.trigger as string),
          conditions: JSON.parse(rule.conditions as string),
          actions: JSON.parse(rule.actions as string)
        })
      })
    } catch (error) {
      console.error('Error loading user workflow rules:', error)
    }
  }

  /**
   * Check if a rule's trigger matches the current trigger
   */
  private matchesTrigger(ruleTrigger: WorkflowTrigger, currentTrigger: WorkflowTrigger): boolean {
    if (ruleTrigger.type !== currentTrigger.type) return false

    // Additional trigger-specific matching logic
    switch (ruleTrigger.type) {
      case 'status_changed':
        return !ruleTrigger.config.newStatus || 
               ruleTrigger.config.newStatus === currentTrigger.config.newStatus
      default:
        return true
    }
  }

  /**
   * Evaluate workflow conditions against application data
   */
  private async evaluateConditions(
    conditions: WorkflowCondition[],
    application: Application,
    context: Record<string, any>
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (!await this.evaluateCondition(condition, application, context)) {
        return false
      }
    }
    return true
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: WorkflowCondition,
    application: Application,
    context: Record<string, any>
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, application, context)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'days_since':
        const date = new Date(fieldValue)
        const daysSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince >= Number(condition.value)
      default:
        return false
    }
  }

  /**
   * Get field value from application or context
   */
  private getFieldValue(field: string, application: Application, context: Record<string, any>): any {
    if (field.startsWith('context.')) {
      return context[field.substring(8)]
    }
    return (application as any)[field]
  }
}

export default WorkflowEngine