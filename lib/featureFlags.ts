import React from 'react'
import { z } from 'zod'

// Feature flag configuration schema
const FeatureFlagSchema = z.object({
  enabled: z.boolean(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  userGroups: z.array(z.string()).optional(),
  environment: z.array(z.enum(['development', 'staging', 'production'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

export type FeatureFlag = z.infer<typeof FeatureFlagSchema>

// Available feature flags
export const FEATURE_FLAGS = {
  AI_INSIGHTS: 'ai_insights',
  ADVANCED_CSV_IMPORT: 'advanced_csv_import',
  USER_AUTHENTICATION: 'user_authentication',
  BACKUP_SYSTEM: 'backup_system',
  PERFORMANCE_MONITORING: 'performance_monitoring',
  ANALYTICS_TRACKING: 'analytics_tracking',
  PWA_FEATURES: 'pwa_features',
  SMART_SUGGESTIONS: 'smart_suggestions',
  BULK_OPERATIONS: 'bulk_operations',
  EXPORT_SYSTEM: 'export_system'
} as const

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

// Default feature flag configuration
const DEFAULT_FLAGS: Record<FeatureFlagKey, FeatureFlag> = {
  [FEATURE_FLAGS.AI_INSIGHTS]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.ADVANCED_CSV_IMPORT]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.USER_AUTHENTICATION]: {
    enabled: true,
    rolloutPercentage: 50,
    environment: ['development', 'staging']
  },
  [FEATURE_FLAGS.BACKUP_SYSTEM]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.PERFORMANCE_MONITORING]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.ANALYTICS_TRACKING]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['production']
  },
  [FEATURE_FLAGS.PWA_FEATURES]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.SMART_SUGGESTIONS]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.BULK_OPERATIONS]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  },
  [FEATURE_FLAGS.EXPORT_SYSTEM]: {
    enabled: true,
    rolloutPercentage: 100,
    environment: ['development', 'staging', 'production']
  }
}

class FeatureFlagManager {
  private flags: Record<FeatureFlagKey, FeatureFlag>
  private userId?: string
  private environment: string

  constructor() {
    this.flags = { ...DEFAULT_FLAGS }
    this.environment = process.env.NODE_ENV || 'development'
    this.loadFlags()
  }

  private loadFlags() {
    try {
      // Load flags from environment variables
      const envFlags = process.env.FEATURE_FLAGS
      if (envFlags) {
        const parsedFlags = JSON.parse(envFlags)
        this.flags = { ...this.flags, ...parsedFlags }
      }
    } catch (error) {
      console.warn('Failed to load feature flags from environment:', error)
    }
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  isEnabled(flagKey: FeatureFlagKey, userId?: string): boolean {
    const flag = this.flags[flagKey]
    if (!flag) return false

    // Check if flag is enabled
    if (!flag.enabled) return false

    // Check environment
    if (flag.environment && !flag.environment.includes(this.environment as any)) {
      return false
    }

    // Check date range
    const now = new Date()
    if (flag.startDate && new Date(flag.startDate) > now) return false
    if (flag.endDate && new Date(flag.endDate) < now) return false

    // Check user groups
    const currentUserId = userId || this.userId
    if (flag.userGroups && currentUserId) {
      const userGroup = this.getUserGroup(currentUserId)
      if (!flag.userGroups.includes(userGroup)) return false
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const userHash = this.hashUserId(currentUserId || 'anonymous')
      return userHash < flag.rolloutPercentage
    }

    return true
  }

  getAllFlags(userId?: string): Record<FeatureFlagKey, boolean> {
    const result: Record<FeatureFlagKey, boolean> = {} as any
    
    Object.keys(this.flags).forEach(key => {
      result[key as FeatureFlagKey] = this.isEnabled(key as FeatureFlagKey, userId)
    })

    return result
  }

  updateFlag(flagKey: FeatureFlagKey, flag: Partial<FeatureFlag>) {
    this.flags[flagKey] = { ...this.flags[flagKey], ...flag }
  }

  private getUserGroup(userId: string): string {
    // Simple user grouping based on user ID hash
    const hash = this.hashUserId(userId)
    if (hash < 10) return 'early_adopters'
    if (hash < 50) return 'beta_users'
    return 'general_users'
  }

  private hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100
  }
}

// Global feature flag manager instance
export const featureFlags = new FeatureFlagManager()

// React hook for feature flags
export function useFeatureFlag(flagKey: FeatureFlagKey, userId?: string): boolean {
  return featureFlags.isEnabled(flagKey, userId)
}

// Higher-order component for feature flag gating
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  flagKey: FeatureFlagKey,
  fallback?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey)
    
    if (!isEnabled) {
      return fallback ? React.createElement(fallback, props) : null
    }
    
    return React.createElement(Component, props)
  }
}