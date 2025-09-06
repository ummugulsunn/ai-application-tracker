/**
 * Data Backup and Version Control Service
 * Implements automated backup, versioning, and data integrity features
 */

import { Application } from '@/types/application'

export interface BackupMetadata {
  id: string
  timestamp: Date
  version: string
  description: string
  dataSize: number
  checksum: string
  type: 'manual' | 'automatic' | 'migration'
  applicationCount: number
  parentVersion?: string // For version history tracking
  changesSummary?: string[] // Summary of changes from previous version
  tags?: string[] // User-defined tags for organization
}

export interface BackupData {
  metadata: BackupMetadata
  applications: Application[]
  userPreferences?: any
  settings?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  repairSuggestions: RepairSuggestion[]
}

export interface ValidationError {
  type: 'missing_field' | 'invalid_format' | 'corrupted_data' | 'duplicate_id'
  message: string
  applicationId?: string
  field?: string
  severity: 'critical' | 'warning'
}

export interface ValidationWarning {
  type: 'outdated_format' | 'missing_optional_field' | 'inconsistent_data'
  message: string
  applicationId?: string
  field?: string
}

export interface RepairSuggestion {
  type: 'auto_fix' | 'manual_fix' | 'data_migration'
  description: string
  action: () => Promise<void>
  applicationId?: string
}

export interface MigrationOptions {
  sourceFormat: 'json' | 'csv' | 'excel' | 'legacy'
  targetFormat: 'json' | 'csv' | 'excel'
  includeMetadata: boolean
  validateData: boolean
}

class BackupService {
  private readonly BACKUP_KEY_PREFIX = 'app_backup_'
  private readonly METADATA_KEY = 'backup_metadata'
  private readonly MAX_BACKUPS = 10
  private readonly AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Create a backup of current application data with version control
   */
  async createBackup(
    applications: Application[],
    description: string = 'Automatic backup',
    type: 'manual' | 'automatic' | 'migration' = 'automatic',
    tags?: string[]
  ): Promise<BackupMetadata> {
    try {
      const timestamp = new Date()
      const version = this.generateVersion()
      const id = `${timestamp.getTime()}_${version}_${Math.random().toString(36).substring(2, 11)}`
      
      // Get previous version for change tracking
      const previousBackups = await this.getBackupList()
      const latestBackup = previousBackups[0]
      const changesSummary = latestBackup ? await this.generateChangesSummary(latestBackup.id) : []
      
      const backupData: BackupData = {
        metadata: {
          id,
          timestamp,
          version,
          description,
          dataSize: 0,
          checksum: '',
          type,
          applicationCount: applications.length,
          parentVersion: latestBackup?.id,
          changesSummary,
          tags
        },
        applications,
        userPreferences: this.getUserPreferences(),
        settings: this.getSettings()
      }

      // Calculate data size and checksum
      const serializedData = JSON.stringify(backupData)
      backupData.metadata.dataSize = new Blob([serializedData]).size
      backupData.metadata.checksum = await this.calculateChecksum(serializedData)

      // Store backup
      await this.storeBackup(id, backupData)
      
      // Update metadata index
      await this.updateBackupMetadata(backupData.metadata)
      
      // Clean up old backups if needed
      await this.cleanupOldBackups()

      console.log(`Backup created successfully: ${id}`)
      return backupData.metadata
    } catch (error) {
      console.error('Failed to create backup:', error)
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Restore data from a backup
   */
  async restoreBackup(backupId: string): Promise<Application[]> {
    try {
      const backupData = await this.getBackup(backupId)
      if (!backupData) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      // Validate backup integrity
      const validation = await this.validateBackupData(backupData)
      if (!validation.isValid) {
        const criticalErrors = validation.errors.filter(e => e.severity === 'critical')
        if (criticalErrors.length > 0) {
          throw new Error(`Backup validation failed: ${criticalErrors.map(e => e.message).join(', ')}`)
        }
      }

      // Create a backup of current state before restore
      const currentApplications = await this.getCurrentApplications()
      if (currentApplications.length > 0) {
        await this.createBackup(currentApplications, 'Pre-restore backup', 'automatic')
      }

      // Restore applications
      await this.restoreApplications(backupData.applications)
      
      // Restore preferences if available
      if (backupData.userPreferences) {
        await this.restoreUserPreferences(backupData.userPreferences)
      }

      console.log(`Backup restored successfully: ${backupId}`)
      return backupData.applications
    } catch (error) {
      console.error('Failed to restore backup:', error)
      throw new Error(`Backup restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get list of available backups
   */
  async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_KEY)
      if (!metadataJson) {
        return []
      }

      const metadata: BackupMetadata[] = JSON.parse(metadataJson)
      return metadata.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error('Failed to get backup list:', error)
      return []
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Remove backup data
      localStorage.removeItem(`${this.BACKUP_KEY_PREFIX}${backupId}`)
      
      // Update metadata
      const metadata = await this.getBackupList()
      const updatedMetadata = metadata.filter(m => m.id !== backupId)
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(updatedMetadata))

      console.log(`Backup deleted: ${backupId}`)
    } catch (error) {
      console.error('Failed to delete backup:', error)
      throw new Error(`Backup deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate data integrity
   */
  async validateData(applications: Application[]): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    const repairSuggestions: RepairSuggestion[] = []

    // Check for required fields
    applications.forEach((app, index) => {
      if (!app.id) {
        errors.push({
          type: 'missing_field',
          message: `Application at index ${index} is missing required field: id`,
          applicationId: app.id,
          field: 'id',
          severity: 'critical'
        })
      }

      if (!app.company || app.company.trim() === '') {
        errors.push({
          type: 'missing_field',
          message: `Application ${app.id} is missing required field: company`,
          applicationId: app.id,
          field: 'company',
          severity: 'critical'
        })
      }

      if (!app.position || app.position.trim() === '') {
        errors.push({
          type: 'missing_field',
          message: `Application ${app.id} is missing required field: position`,
          applicationId: app.id,
          field: 'position',
          severity: 'critical'
        })
      }

      // Validate date formats
      if (app.appliedDate && isNaN(new Date(app.appliedDate).getTime())) {
        errors.push({
          type: 'invalid_format',
          message: `Application ${app.id} has invalid applied date format`,
          applicationId: app.id,
          field: 'appliedDate',
          severity: 'critical'
        })
      }

      // Check for optional fields
      if (!app.location) {
        warnings.push({
          type: 'missing_optional_field',
          message: `Application ${app.id} is missing location information`,
          applicationId: app.id,
          field: 'location'
        })
      }
    })

    // Check for duplicate IDs
    const ids = applications.map(app => app.id).filter(Boolean)
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
    duplicateIds.forEach(id => {
      errors.push({
        type: 'duplicate_id',
        message: `Duplicate application ID found: ${id}`,
        applicationId: id,
        severity: 'critical'
      })
    })

    // Generate repair suggestions
    if (errors.length > 0) {
      repairSuggestions.push({
        type: 'auto_fix',
        description: 'Automatically fix missing IDs and basic validation errors',
        action: async () => {
          await this.autoRepairData(errors)
        }
      })
    }

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      repairSuggestions
    }
  }

  /**
   * Repair data integrity issues
   */
  async repairData(applications: Application[]): Promise<Application[]> {
    const repairedApplications = [...applications]

    // Auto-generate missing IDs
    repairedApplications.forEach(app => {
      if (!app.id) {
        app.id = this.generateId()
      }
    })

    // Fix duplicate IDs
    const seenIds = new Set<string>()
    repairedApplications.forEach(app => {
      if (seenIds.has(app.id)) {
        app.id = this.generateId()
      }
      seenIds.add(app.id)
    })

    // Fix missing required fields
    repairedApplications.forEach(app => {
      if (!app.company || app.company.trim() === '') {
        app.company = 'Unknown Company'
      }
      if (!app.position || app.position.trim() === '') {
        app.position = 'Unknown Position'
      }
    })

    // Fix invalid dates
    repairedApplications.forEach(app => {
      if (app.appliedDate && isNaN(new Date(app.appliedDate).getTime())) {
        (app as any).appliedDate = new Date().toISOString().split('T')[0]
      }
      if (!app.appliedDate) {
        (app as any).appliedDate = new Date().toISOString().split('T')[0]
      }
    })

    return repairedApplications
  }

  /**
   * Export data for migration
   */
  async exportForMigration(
    applications: Application[],
    options: MigrationOptions
  ): Promise<Blob> {
    try {
      let exportData: any

      if (options.validateData) {
        const validation = await this.validateData(applications)
        if (!validation.isValid) {
          throw new Error('Data validation failed. Please repair data before export.')
        }
      }

      switch (options.targetFormat) {
        case 'json':
          exportData = {
            applications,
            metadata: options.includeMetadata ? {
              exportDate: new Date(),
              version: this.generateVersion(),
              applicationCount: applications.length
            } : undefined
          }
          return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })

        case 'csv':
          const csvContent = this.convertToCSV(applications)
          return new Blob([csvContent], { type: 'text/csv' })

        case 'excel':
          // For now, export as CSV (Excel support would require additional library)
          const excelCsvContent = this.convertToCSV(applications)
          return new Blob([excelCsvContent], { type: 'application/vnd.ms-excel' })

        default:
          throw new Error(`Unsupported export format: ${options.targetFormat}`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Import data from migration
   */
  async importFromMigration(
    file: File,
    options: MigrationOptions
  ): Promise<Application[]> {
    try {
      const content = await this.readFileContent(file)
      let applications: Application[]

      switch (options.sourceFormat) {
        case 'json':
          const jsonData = JSON.parse(content)
          applications = jsonData.applications || jsonData
          break

        case 'csv':
          applications = await this.parseCSVContent(content)
          break

        default:
          throw new Error(`Unsupported import format: ${options.sourceFormat}`)
      }

      if (options.validateData) {
        const validation = await this.validateData(applications)
        if (!validation.isValid) {
          const repairedApplications = await this.repairData(applications)
          return repairedApplications
        }
      }

      return applications
    } catch (error) {
      console.error('Import failed:', error)
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get version history for rollback capabilities
   */
  async getVersionHistory(limit: number = 20): Promise<BackupMetadata[]> {
    try {
      const backups = await this.getBackupList()
      return backups.slice(0, limit)
    } catch (error) {
      console.error('Failed to get version history:', error)
      return []
    }
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(versionId: string): Promise<Application[]> {
    try {
      // Create a backup of current state before rollback
      const currentApplications = await this.getCurrentApplications()
      if (currentApplications.length > 0) {
        await this.createBackup(currentApplications, `Pre-rollback backup (rolling back to ${versionId})`, 'automatic')
      }

      // Restore the specified version
      return await this.restoreBackup(versionId)
    } catch (error) {
      console.error('Rollback failed:', error)
      throw new Error(`Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Compare two backup versions
   */
  async compareVersions(versionA: string, versionB: string): Promise<{
    added: Application[]
    removed: Application[]
    modified: Application[]
  }> {
    try {
      const backupA = await this.getBackup(versionA)
      let applicationsB: Application[]

      if (versionB === 'current') {
        applicationsB = await this.getCurrentApplications()
      } else {
        const backupB = await this.getBackup(versionB)
        if (!backupB) {
          throw new Error('Backup version B not found')
        }
        applicationsB = backupB.applications
      }

      if (!backupA) {
        throw new Error('Backup version A not found')
      }

      const appsA = new Map(backupA.applications.map(app => [app.id, app]))
      const appsB = new Map(applicationsB.map(app => [app.id, app]))

      const added: Application[] = []
      const removed: Application[] = []
      const modified: Application[] = []

      // Find added applications (in B but not in A)
      for (const [id, app] of appsB) {
        if (!appsA.has(id)) {
          added.push(app)
        }
      }

      // Find removed applications (in A but not in B)
      for (const [id, app] of appsA) {
        if (!appsB.has(id)) {
          removed.push(app)
        }
      }

      // Find modified applications
      for (const [id, appB] of appsB) {
        const appA = appsA.get(id)
        if (appA && JSON.stringify(appA) !== JSON.stringify(appB)) {
          modified.push(appB)
        }
      }

      return { added, removed, modified }
    } catch (error) {
      console.error('Version comparison failed:', error)
      throw new Error(`Version comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get backup statistics and health metrics
   */
  async getBackupHealth(): Promise<{
    totalBackups: number
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
    corruptedBackups: string[]
    recommendations: string[]
  }> {
    try {
      const backups = await this.getBackupList()
      let totalSize = 0
      const corruptedBackups: string[] = []
      const recommendations: string[] = []

      // Check each backup for corruption
      for (const backup of backups) {
        totalSize += backup.dataSize
        
        try {
          const backupData = await this.getBackup(backup.id)
          if (backupData) {
            const validation = await this.validateBackupData(backupData)
            if (!validation.isValid) {
              corruptedBackups.push(backup.id)
            }
          }
        } catch (error) {
          corruptedBackups.push(backup.id)
        }
      }

      // Generate recommendations
      if (backups.length === 0) {
        recommendations.push('Create your first backup to protect your data')
      } else if (backups.length < 3) {
        recommendations.push('Consider creating more frequent backups for better data protection')
      }

      if (corruptedBackups.length > 0) {
        recommendations.push(`${corruptedBackups.length} corrupted backup(s) found - consider cleaning up`)
      }

      const now = new Date()
      const latestBackup = backups[0]
      if (latestBackup && (now.getTime() - new Date(latestBackup.timestamp).getTime()) > 7 * 24 * 60 * 60 * 1000) {
        recommendations.push('Latest backup is over a week old - consider creating a new backup')
      }

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups.length > 0 ? new Date(backups[backups.length - 1]?.timestamp || Date.now()) : undefined,
        newestBackup: backups.length > 0 ? new Date(backups[0]?.timestamp || Date.now()) : undefined,
        corruptedBackups,
        recommendations
      }
    } catch (error) {
      console.error('Failed to get backup health:', error)
      return {
        totalBackups: 0,
        totalSize: 0,
        corruptedBackups: [],
        recommendations: ['Failed to analyze backup health - check system integrity']
      }
    }
  }

  /**
   * Clean up corrupted or invalid backups
   */
  async cleanupCorruptedBackups(): Promise<string[]> {
    try {
      const backups = await this.getBackupList()
      const corruptedIds: string[] = []

      for (const backup of backups) {
        try {
          const backupData = await this.getBackup(backup.id)
          if (!backupData) {
            corruptedIds.push(backup.id)
            continue
          }

          const validation = await this.validateBackupData(backupData)
          if (!validation.isValid) {
            const criticalErrors = validation.errors.filter(e => e.severity === 'critical')
            if (criticalErrors.length > 0) {
              corruptedIds.push(backup.id)
            }
          }
        } catch (error) {
          corruptedIds.push(backup.id)
        }
      }

      // Delete corrupted backups
      for (const id of corruptedIds) {
        await this.deleteBackup(id)
      }

      return corruptedIds
    } catch (error) {
      console.error('Cleanup failed:', error)
      throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Setup automatic backup
   */
  setupAutomaticBackup(): void {
    // Check if automatic backup is already running
    const existingInterval = localStorage.getItem('auto_backup_interval')
    if (existingInterval) {
      clearInterval(parseInt(existingInterval))
    }

    const intervalId = setInterval(async () => {
      try {
        const applications = await this.getCurrentApplications()
        if (applications.length > 0) {
          await this.createBackup(applications, 'Automatic scheduled backup', 'automatic')
        }
      } catch (error) {
        console.error('Automatic backup failed:', error)
      }
    }, this.AUTO_BACKUP_INTERVAL)

    localStorage.setItem('auto_backup_interval', intervalId.toString())
  }

  /**
   * Stop automatic backup
   */
  stopAutomaticBackup(): void {
    const existingInterval = localStorage.getItem('auto_backup_interval')
    if (existingInterval) {
      clearInterval(parseInt(existingInterval))
      localStorage.removeItem('auto_backup_interval')
    }
  }

  /**
   * Check if automatic backup is running
   */
  isAutomaticBackupRunning(): boolean {
    return localStorage.getItem('auto_backup_interval') !== null
  }

  /**
   * Get backup statistics for monitoring
   */
  async getBackupStatistics(): Promise<{
    totalBackups: number
    totalSize: number
    averageSize: number
    backupsByType: Record<string, number>
    oldestBackup?: Date
    newestBackup?: Date
    backupFrequency: {
      daily: number
      weekly: number
      monthly: number
    }
  }> {
    try {
      const backups = await this.getBackupList()
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          averageSize: 0,
          backupsByType: {},
          backupFrequency: { daily: 0, weekly: 0, monthly: 0 }
        }
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.dataSize, 0)
      const averageSize = totalSize / backups.length

      const backupsByType = backups.reduce((acc, backup) => {
        acc[backup.type] = (acc[backup.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const backupFrequency = {
        daily: backups.filter(b => new Date(b.timestamp) > oneDayAgo).length,
        weekly: backups.filter(b => new Date(b.timestamp) > oneWeekAgo).length,
        monthly: backups.filter(b => new Date(b.timestamp) > oneMonthAgo).length
      }

      return {
        totalBackups: backups.length,
        totalSize,
        averageSize,
        backupsByType,
        oldestBackup: new Date(backups[backups.length - 1]?.timestamp || Date.now()),
        newestBackup: new Date(backups[0]?.timestamp || Date.now()),
        backupFrequency
      }
    } catch (error) {
      console.error('Failed to get backup statistics:', error)
      return {
        totalBackups: 0,
        totalSize: 0,
        averageSize: 0,
        backupsByType: {},
        backupFrequency: { daily: 0, weekly: 0, monthly: 0 }
      }
    }
  }

  // Private helper methods

  private generateVersion(): string {
    return `v${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private generateId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  private async calculateChecksum(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      // Fallback for environments without crypto.subtle
      let hash = 0
      const timestamp = Date.now()
      const randomSalt = Math.random().toString(36)
      const saltedData = data + timestamp + randomSalt
      
      for (let i = 0; i < saltedData.length; i++) {
        const char = saltedData.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return Math.abs(hash).toString(16).padStart(16, '0')
    }
  }

  private async storeBackup(id: string, backupData: BackupData): Promise<void> {
    const key = `${this.BACKUP_KEY_PREFIX}${id}`
    localStorage.setItem(key, JSON.stringify(backupData))
  }

  private async getBackup(id: string): Promise<BackupData | null> {
    const key = `${this.BACKUP_KEY_PREFIX}${id}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }

  private async updateBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const existingMetadata = await this.getBackupList()
    const updatedMetadata = [...existingMetadata, metadata]
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(updatedMetadata))
  }

  private async cleanupOldBackups(): Promise<void> {
    const metadata = await this.getBackupList()
    if (metadata.length > this.MAX_BACKUPS) {
      const toDelete = metadata.slice(this.MAX_BACKUPS)
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id)
      }
    }
  }

  private async validateBackupData(backupData: BackupData): Promise<ValidationResult> {
    return this.validateData(backupData.applications)
  }

  private async getCurrentApplications(): Promise<Application[]> {
    // This would integrate with the existing application store
    const data = localStorage.getItem('applications')
    return data ? JSON.parse(data) : []
  }

  private async restoreApplications(applications: Application[]): Promise<void> {
    localStorage.setItem('applications', JSON.stringify(applications))
  }

  private getUserPreferences(): any {
    const prefs = localStorage.getItem('user_preferences')
    return prefs ? JSON.parse(prefs) : null
  }

  private getSettings(): any {
    const settings = localStorage.getItem('app_settings')
    return settings ? JSON.parse(settings) : null
  }

  private async restoreUserPreferences(preferences: any): Promise<void> {
    localStorage.setItem('user_preferences', JSON.stringify(preferences))
  }

  private async generateChangesSummary(previousBackupId: string): Promise<string[]> {
    try {
      const previousBackup = await this.getBackup(previousBackupId)
      if (!previousBackup) {
        return ['Initial backup - no previous version to compare']
      }

      const comparison = await this.compareVersions(previousBackupId, 'current')
      const changes: string[] = []

      if (comparison.added.length > 0) {
        changes.push(`Added ${comparison.added.length} new application(s)`)
      }
      if (comparison.removed.length > 0) {
        changes.push(`Removed ${comparison.removed.length} application(s)`)
      }
      if (comparison.modified.length > 0) {
        changes.push(`Modified ${comparison.modified.length} application(s)`)
      }

      if (changes.length === 0) {
        changes.push('No changes detected')
      }

      return changes
    } catch (error) {
      return ['Unable to generate changes summary']
    }
  }

  private async autoRepairData(errors: ValidationError[]): Promise<void> {
    // Implementation for automatic data repair
    console.log('Auto-repairing data...', errors)
  }

  private convertToCSV(applications: Application[]): string {
    if (applications.length === 0) return ''

    const headers = Object.keys(applications[0] || {})
    const csvRows = [headers.join(',')]

    applications.forEach(app => {
      const values = headers.map(header => {
        const value = (app as any)[header]
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      })
      csvRows.push(values.join(','))
    })

    return csvRows.join('\n')
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  private async parseCSVContent(content: string): Promise<Application[]> {
    // Basic CSV parsing - in production, use a proper CSV parser
    const lines = content.split('\n')
    const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || []
    const applications: Application[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line && line.trim()) {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const app: any = {}
        headers.forEach((header, index) => {
          app[header] = values[index] || ''
        })
        applications.push(app as Application)
      }
    }

    return applications
  }
}

export const backupService = new BackupService()