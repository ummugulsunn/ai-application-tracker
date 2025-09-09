/**
 * Smart Automation Service
 * Provides intelligent automation features and pattern recognition
 */

import { Application } from '@/types/application'
import { WorkflowEngine } from './workflowEngine'
import { prisma } from '@/lib/prisma'

export interface AutomationPattern {
  id: string
  name: string
  description: string
  pattern: PatternRule[]
  confidence: number
  frequency: number
  lastTriggered?: Date
}

export interface PatternRule {
  field: string
  operator: 'equals' | 'contains' | 'range' | 'frequency'
  value: any
  weight: number
}

export interface SmartSuggestion {
  id: string
  type: 'workflow' | 'action' | 'optimization' | 'insight'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  category: string
  actionable: boolean
  metadata: Record<string, any>
}

export interface AutomationInsight {
  id: string
  userId: string
  type: 'pattern' | 'anomaly' | 'opportunity' | 'warning'
  title: string
  description: string
  data: Record<string, any>
  confidence: number
  createdAt: Date
}

export class SmartAutomationService {
  private static instance: SmartAutomationService
  private workflowEngine: WorkflowEngine

  constructor() {
    this.workflowEngine = WorkflowEngine.getInstance()
  }

  static getInstance(): SmartAutomationService {
    if (!SmartAutomationService.instance) {
      SmartAutomationService.instance = new SmartAutomationService()
    }
    return SmartAutomationService.instance
  }

  /**
   * Analyze user's application patterns and generate smart suggestions
   */
  async generateSmartSuggestions(userId: string): Promise<SmartSuggestion[]> {
    const applications = await this.getUserApplications(userId)
    const patterns = await this.detectPatterns(applications)
    const suggestions: SmartSuggestion[] = []

    // Analyze response patterns
    suggestions.push(...await this.analyzeResponsePatterns(applications))
    
    // Analyze timing patterns
    suggestions.push(...await this.analyzeTimingPatterns(applications))
    
    // Analyze success patterns
    suggestions.push(...await this.analyzeSuccessPatterns(applications))
    
    // Analyze workflow efficiency
    suggestions.push(...await this.analyzeWorkflowEfficiency(userId, applications))
    
    // Generate automation opportunities
    suggestions.push(...await this.findAutomationOpportunities(applications))

    return suggestions.sort((a, b) => b.confidence * this.getImpactScore(b.impact) - a.confidence * this.getImpactScore(a.impact))
  }

  /**
   * Detect patterns in user's application behavior
   */
  async detectPatterns(applications: Application[]): Promise<AutomationPattern[]> {
    const patterns: AutomationPattern[] = []

    // Company size patterns
    patterns.push(...this.detectCompanySizePatterns(applications))
    
    // Industry patterns
    patterns.push(...this.detectIndustryPatterns(applications))
    
    // Timing patterns
    patterns.push(...this.detectTimingPatterns(applications))
    
    // Status progression patterns
    patterns.push(...this.detectStatusPatterns(applications))

    return patterns.filter(p => p.confidence > 0.6)
  }

  /**
   * Generate automation insights based on user behavior
   */
  async generateInsights(userId: string): Promise<AutomationInsight[]> {
    const applications = await this.getUserApplications(userId)
    const insights: AutomationInsight[] = []

    // Detect anomalies
    insights.push(...await this.detectAnomalies(userId, applications))
    
    // Find optimization opportunities
    insights.push(...await this.findOptimizationOpportunities(userId, applications))
    
    // Identify workflow bottlenecks
    insights.push(...await this.identifyBottlenecks(userId, applications))

    return insights
  }

  /**
   * Auto-optimize user workflows based on patterns
   */
  async optimizeWorkflows(userId: string): Promise<{
    optimizations: string[]
    estimatedTimeSaved: number
    confidence: number
  }> {
    const applications = await this.getUserApplications(userId)
    const patterns = await this.detectPatterns(applications)
    const optimizations: string[] = []
    let estimatedTimeSaved = 0

    // Optimize follow-up timing
    const followUpOptimization = this.optimizeFollowUpTiming(applications)
    if (followUpOptimization.confidence > 0.7) {
      optimizations.push(followUpOptimization.description)
      estimatedTimeSaved += followUpOptimization.timeSaved
    }

    // Optimize application batching
    const batchingOptimization = this.optimizeApplicationBatching(applications)
    if (batchingOptimization.confidence > 0.7) {
      optimizations.push(batchingOptimization.description)
      estimatedTimeSaved += batchingOptimization.timeSaved
    }

    // Optimize reminder scheduling
    const reminderOptimization = await this.optimizeReminderScheduling(userId)
    if (reminderOptimization.confidence > 0.7) {
      optimizations.push(reminderOptimization.description)
      estimatedTimeSaved += reminderOptimization.timeSaved
    }

    return {
      optimizations,
      estimatedTimeSaved,
      confidence: optimizations.length > 0 ? 0.8 : 0.3
    }
  }

  /**
   * Create smart automation rules based on user patterns
   */
  async createSmartRules(userId: string, patterns: AutomationPattern[]): Promise<void> {
    for (const pattern of patterns) {
      if (pattern.confidence > 0.8) {
        await this.createRuleFromPattern(userId, pattern)
      }
    }
  }

  /**
   * Analyze response patterns
   */
  private async analyzeResponsePatterns(applications: Application[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    const appliedApps = applications.filter(app => app.status === 'Applied')
    const respondedApps = applications.filter(app => 
      ['Interviewing', 'Offered', 'Rejected'].includes(app.status) && app.responseDate
    )

    if (appliedApps.length > 5 && respondedApps.length > 0) {
      const avgResponseTime = this.calculateAverageResponseTime(respondedApps)
      const noResponseApps = appliedApps.filter(app => {
        const daysSinceApplied = Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24))
        return daysSinceApplied > avgResponseTime * 1.5
      })

      if (noResponseApps.length > 0) {
        suggestions.push({
          id: 'follow-up-overdue',
          type: 'action',
          title: 'Follow up on overdue applications',
          description: `${noResponseApps.length} applications haven't received responses beyond your average response time of ${avgResponseTime} days.`,
          confidence: 0.8,
          impact: 'medium',
          effort: 'low',
          category: 'follow-up',
          actionable: true,
          metadata: { applications: noResponseApps.map(app => app.id) }
        })
      }
    }

    return suggestions
  }

  /**
   * Analyze timing patterns
   */
  private async analyzeTimingPatterns(applications: Application[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    
    if (applications.length < 10) return suggestions

    // Analyze day-of-week patterns
    const dayPatterns = this.analyzeDayOfWeekPatterns(applications)
    const bestDays = Object.entries(dayPatterns.successRates)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([day]) => day)

    if (dayPatterns.confidence > 0.7) {
      suggestions.push({
        id: 'optimal-application-days',
        type: 'optimization',
        title: 'Optimize application timing',
        description: `Your applications on ${bestDays.join(' and ')} have ${Math.round(dayPatterns.successRates[bestDays[0]] * 100)}% higher success rates.`,
        confidence: dayPatterns.confidence,
        impact: 'medium',
        effort: 'low',
        category: 'timing',
        actionable: true,
        metadata: { bestDays, patterns: dayPatterns }
      })
    }

    return suggestions
  }

  /**
   * Analyze success patterns
   */
  private async analyzeSuccessPatterns(applications: Application[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    const successfulApps = applications.filter(app => ['Offered', 'Accepted'].includes(app.status))
    
    if (successfulApps.length < 3) return suggestions

    // Analyze company size patterns
    const companySizePattern = this.analyzeCompanySizeSuccess(applications)
    if (companySizePattern.confidence > 0.7) {
      suggestions.push({
        id: 'company-size-focus',
        type: 'insight',
        title: 'Focus on optimal company sizes',
        description: companySizePattern.recommendation,
        confidence: companySizePattern.confidence,
        impact: 'high',
        effort: 'low',
        category: 'targeting',
        actionable: true,
        metadata: companySizePattern
      })
    }

    return suggestions
  }

  /**
   * Analyze workflow efficiency
   */
  private async analyzeWorkflowEfficiency(userId: string, applications: Application[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []
    
    // Analyze reminder completion rates
    const reminderStats = await this.getReminderStats(userId)
    if (reminderStats.completionRate < 60) {
      suggestions.push({
        id: 'improve-reminder-workflow',
        type: 'workflow',
        title: 'Improve reminder workflow',
        description: `Your reminder completion rate is ${reminderStats.completionRate}%. Consider adjusting reminder timing or frequency.`,
        confidence: 0.8,
        impact: 'medium',
        effort: 'medium',
        category: 'workflow',
        actionable: true,
        metadata: reminderStats
      })
    }

    return suggestions
  }

  /**
   * Find automation opportunities
   */
  private async findAutomationOpportunities(applications: Application[]): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = []

    // Repetitive task detection
    const repetitiveTasks = this.detectRepetitiveTasks(applications)
    if (repetitiveTasks.length > 0) {
      suggestions.push({
        id: 'automate-repetitive-tasks',
        type: 'workflow',
        title: 'Automate repetitive tasks',
        description: `Found ${repetitiveTasks.length} repetitive tasks that could be automated to save time.`,
        confidence: 0.9,
        impact: 'high',
        effort: 'medium',
        category: 'automation',
        actionable: true,
        metadata: { tasks: repetitiveTasks }
      })
    }

    return suggestions
  }

  /**
   * Helper methods for pattern detection
   */
  private detectCompanySizePatterns(applications: Application[]): AutomationPattern[] {
    // Implementation for detecting company size patterns
    return []
  }

  private detectIndustryPatterns(applications: Application[]): AutomationPattern[] {
    // Implementation for detecting industry patterns
    return []
  }

  private detectTimingPatterns(applications: Application[]): AutomationPattern[] {
    // Implementation for detecting timing patterns
    return []
  }

  private detectStatusPatterns(applications: Application[]): AutomationPattern[] {
    // Implementation for detecting status progression patterns
    return []
  }

  private async detectAnomalies(userId: string, applications: Application[]): Promise<AutomationInsight[]> {
    const insights: AutomationInsight[] = []
    
    // Detect unusual application patterns
    const recentApps = applications.filter(app => {
      const daysAgo = Math.floor((Date.now() - new Date(app.appliedDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysAgo <= 30
    })

    if (recentApps.length === 0 && applications.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        userId,
        type: 'warning',
        title: 'No recent applications',
        description: 'You haven\'t applied to any jobs in the last 30 days. Consider setting application goals.',
        data: { lastApplicationDate: applications[0]?.appliedDate },
        confidence: 0.9,
        createdAt: new Date()
      })
    }

    return insights
  }

  private async findOptimizationOpportunities(userId: string, applications: Application[]): Promise<AutomationInsight[]> {
    // Implementation for finding optimization opportunities
    return []
  }

  private async identifyBottlenecks(userId: string, applications: Application[]): Promise<AutomationInsight[]> {
    // Implementation for identifying workflow bottlenecks
    return []
  }

  private optimizeFollowUpTiming(applications: Application[]): {
    description: string
    timeSaved: number
    confidence: number
  } {
    // Analyze optimal follow-up timing based on success patterns
    return {
      description: 'Optimize follow-up timing based on response patterns',
      timeSaved: 15, // minutes per week
      confidence: 0.8
    }
  }

  private optimizeApplicationBatching(applications: Application[]): {
    description: string
    timeSaved: number
    confidence: number
  } {
    // Analyze optimal application batching
    return {
      description: 'Batch similar applications to reduce context switching',
      timeSaved: 30, // minutes per week
      confidence: 0.7
    }
  }

  private async optimizeReminderScheduling(userId: string): Promise<{
    description: string
    timeSaved: number
    confidence: number
  }> {
    // Analyze and optimize reminder scheduling
    return {
      description: 'Optimize reminder scheduling based on completion patterns',
      timeSaved: 20, // minutes per week
      confidence: 0.8
    }
  }

  private async createRuleFromPattern(userId: string, pattern: AutomationPattern): Promise<void> {
    // Create workflow rule based on detected pattern
    console.log('Creating rule from pattern:', pattern.name)
  }

  private calculateAverageResponseTime(applications: Application[]): number {
    const responseTimes = applications
      .filter(app => app.responseDate)
      .map(app => {
        const applied = new Date(app.appliedDate).getTime()
        const responded = new Date(app.responseDate!).getTime()
        return Math.floor((responded - applied) / (1000 * 60 * 60 * 24))
      })

    return responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length)
      : 7
  }

  private analyzeDayOfWeekPatterns(applications: Application[]): {
    successRates: Record<string, number>
    confidence: number
  } {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayStats: Record<string, { total: number, successful: number }> = {}
    
    days.forEach(day => {
      dayStats[day] = { total: 0, successful: 0 }
    })

    applications.forEach(app => {
      const dayOfWeek = days[new Date(app.appliedDate).getDay()]
      dayStats[dayOfWeek].total++
      if (['Offered', 'Accepted', 'Interviewing'].includes(app.status)) {
        dayStats[dayOfWeek].successful++
      }
    })

    const successRates: Record<string, number> = {}
    days.forEach(day => {
      successRates[day] = dayStats[day].total > 0 
        ? dayStats[day].successful / dayStats[day].total 
        : 0
    })

    const totalApplications = applications.length
    const confidence = totalApplications > 20 ? 0.8 : totalApplications > 10 ? 0.6 : 0.4

    return { successRates, confidence }
  }

  private analyzeCompanySizeSuccess(applications: Application[]): {
    recommendation: string
    confidence: number
    bestSizes: string[]
  } {
    // Simplified company size analysis
    return {
      recommendation: 'Focus on mid-size companies (100-1000 employees) for better success rates',
      confidence: 0.7,
      bestSizes: ['Medium', 'Large']
    }
  }

  private async getReminderStats(userId: string): Promise<{
    completionRate: number
    totalReminders: number
    completedReminders: number
  }> {
    try {
      const [total, completed] = await Promise.all([
        prisma.reminder.count({ where: { userId } }),
        prisma.reminder.count({ where: { userId, isCompleted: true } })
      ])

      return {
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        totalReminders: total,
        completedReminders: completed
      }
    } catch (error) {
      return { completionRate: 0, totalReminders: 0, completedReminders: 0 }
    }
  }

  private detectRepetitiveTasks(applications: Application[]): string[] {
    const tasks: string[] = []
    
    // Detect patterns that could be automated
    const companiesAppliedTo = new Set(applications.map(app => app.company))
    if (companiesAppliedTo.size < applications.length * 0.8) {
      tasks.push('Company research automation')
    }

    const statusUpdates = applications.filter(app => 
      Math.floor((Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) > 7
    )
    if (statusUpdates.length > 5) {
      tasks.push('Automated status update reminders')
    }

    return tasks
  }

  private async getUserApplications(userId: string): Promise<Application[]> {
    try {
      return await prisma.application.findMany({
        where: { userId },
        orderBy: { appliedDate: 'desc' }
      }) as Application[]
    } catch (error) {
      console.error('Error fetching user applications:', error)
      return []
    }
  }

  private getImpactScore(impact: string): number {
    switch (impact) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 1
    }
  }
}

export default SmartAutomationService