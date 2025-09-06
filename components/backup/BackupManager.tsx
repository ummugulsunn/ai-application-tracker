'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  backupService, 
  BackupMetadata, 
  ValidationResult, 
  MigrationOptions 
} from '@/lib/backup/backupService'
import { useApplicationStore } from '@/store/applicationStore'
import { Download, Upload, Shield, AlertTriangle, CheckCircle, Trash2, RotateCcw } from 'lucide-react'

interface BackupManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function BackupManager({ isOpen, onClose }: BackupManagerProps) {
  const [backups, setBackups] = useState<BackupMetadata[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const [activeTab, setActiveTab] = useState<'backups' | 'validation' | 'migration' | 'health'>('backups')
  const [backupHealth, setBackupHealth] = useState<any>(null)
  const [backupStatistics, setBackupStatistics] = useState<any>(null)
  const [migrationFile, setMigrationFile] = useState<File | null>(null)
  
  const { applications, importApplications } = useApplicationStore()

  useEffect(() => {
    if (isOpen) {
      loadBackups()
      setupAutomaticBackup()
      loadBackupHealth()
      loadBackupStatistics()
    }
  }, [isOpen])

  const loadBackups = async () => {
    try {
      const backupList = await backupService.getBackupList()
      setBackups(backupList)
    } catch (error) {
      console.error('Failed to load backups:', error)
    }
  }

  const setupAutomaticBackup = () => {
    backupService.setupAutomaticBackup()
  }

  const loadBackupHealth = async () => {
    try {
      const health = await backupService.getBackupHealth()
      setBackupHealth(health)
    } catch (error) {
      console.error('Failed to load backup health:', error)
    }
  }

  const loadBackupStatistics = async () => {
    try {
      const statistics = await backupService.getBackupStatistics()
      setBackupStatistics(statistics)
    } catch (error) {
      console.error('Failed to load backup statistics:', error)
    }
  }

  const handleCleanupCorruptedBackups = async () => {
    if (!confirm('Are you sure you want to clean up corrupted backups? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const cleanedBackups = await backupService.cleanupCorruptedBackups()
      await loadBackups()
      await loadBackupHealth()
      alert(`Cleaned up ${cleanedBackups.length} corrupted backup(s)`)
    } catch (error) {
      alert(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setIsLoading(true)
    try {
      const metadata = await backupService.createBackup(
        applications,
        'Manual backup',
        'manual'
      )
      await loadBackups()
      alert(`Backup created successfully: ${metadata.id}`)
    } catch (error) {
      alert(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? Current data will be backed up first.')) {
      return
    }

    setIsLoading(true)
    try {
      const restoredApplications = await backupService.restoreBackup(backupId)
      // Clear existing applications and import restored ones
      const store = useApplicationStore.getState()
      store.deleteApplications(applications.map(app => app.id))
      importApplications(restoredApplications)
      await loadBackups()
      alert('Backup restored successfully!')
      onClose()
    } catch (error) {
      alert(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      await backupService.deleteBackup(backupId)
      await loadBackups()
      alert('Backup deleted successfully')
    } catch (error) {
      alert(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleValidateData = async () => {
    setIsLoading(true)
    try {
      const result = await backupService.validateData(applications)
      setValidationResult(result)
    } catch (error) {
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepairData = async () => {
    if (!validationResult) return

    setIsLoading(true)
    try {
      const repairedApplications = await backupService.repairData(applications)
      // Clear existing applications and import repaired ones
      const store = useApplicationStore.getState()
      store.deleteApplications(applications.map(app => app.id))
      importApplications(repairedApplications)
      
      // Re-validate after repair
      const newValidation = await backupService.validateData(repairedApplications)
      setValidationResult(newValidation)
      
      alert('Data repaired successfully!')
    } catch (error) {
      alert(`Data repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async (format: 'json' | 'csv' | 'excel') => {
    setIsLoading(true)
    try {
      const options: MigrationOptions = {
        sourceFormat: 'json',
        targetFormat: format,
        includeMetadata: true,
        validateData: true
      }

      const blob = await backupService.exportForMigration(applications, options)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `applications_export_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportData = async () => {
    if (!migrationFile) return

    setIsLoading(true)
    try {
      const fileExtension = migrationFile.name.split('.').pop()?.toLowerCase()
      const sourceFormat = fileExtension === 'csv' ? 'csv' : 'json'

      const options: MigrationOptions = {
        sourceFormat,
        targetFormat: 'json',
        includeMetadata: false,
        validateData: true
      }

      const importedApplications = await backupService.importFromMigration(migrationFile, options)
      
      if (confirm(`Import ${importedApplications.length} applications? This will replace your current data.`)) {
        // Create backup before import
        await backupService.createBackup(applications, 'Pre-import backup', 'automatic')
        // Clear existing applications and import new ones
        const store = useApplicationStore.getState()
        store.deleteApplications(applications.map(app => app.id))
        importApplications(importedApplications)
        alert('Data imported successfully!')
        onClose()
      }
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setMigrationFile(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Data Backup & Version Control</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'backups' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('backups')}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Backups
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'validation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('validation')}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Data Validation
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'migration' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('migration')}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Data Migration
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'health' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('health')}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            System Health
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Backup Management</h3>
                <Button 
                  onClick={handleCreateBackup} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Automatic Backups:</strong> Your data is automatically backed up every 24 hours. 
                  Manual backups are created before major operations like imports or restores.
                </p>
              </div>

              <div className="space-y-3">
                {backups.length === 0 ? (
                  <Card className="p-6 text-center text-gray-500">
                    No backups found. Create your first backup to get started.
                  </Card>
                ) : (
                  backups.map((backup) => (
                    <Card key={backup.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              backup.type === 'manual' ? 'bg-blue-500' : 
                              backup.type === 'automatic' ? 'bg-green-500' : 'bg-orange-500'
                            }`} />
                            <div>
                              <h4 className="font-medium">{backup.description}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(backup.timestamp).toLocaleString()} • 
                                {backup.applicationCount} applications • 
                                {formatFileSize(backup.dataSize)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={isLoading}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Data Integrity Validation</h3>
                <Button 
                  onClick={handleValidateData} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate Data
                </Button>
              </div>

              {validationResult ? (
                <div className="space-y-4">
                  <Card className={`p-4 ${validationResult.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center space-x-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      <h4 className="font-medium">
                        {validationResult.isValid ? 'Data is valid' : 'Data validation issues found'}
                      </h4>
                    </div>
                  </Card>

                  {validationResult.errors.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium text-red-600 mb-3">Errors ({validationResult.errors.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {validationResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded">
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium text-orange-600 mb-3">Warnings ({validationResult.warnings.length})</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {validationResult.warnings.map((warning, index) => (
                          <div key={index} className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                            {warning.message}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {validationResult.repairSuggestions.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Repair Options</h4>
                      <div className="space-y-2">
                        {validationResult.repairSuggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{suggestion.description}</span>
                            <Button
                              size="sm"
                              onClick={handleRepairData}
                              disabled={isLoading}
                            >
                              Repair
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-6 text-center text-gray-500">
                  Click "Validate Data" to check your application data for integrity issues.
                </Card>
              )}
            </div>
          )}

          {/* Migration Tab */}
          {activeTab === 'migration' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Export Data</h3>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleExportData('json')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    <Download className="w-6 h-6 mb-2" />
                    Export as JSON
                  </Button>
                  <Button
                    onClick={() => handleExportData('csv')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    <Download className="w-6 h-6 mb-2" />
                    Export as CSV
                  </Button>
                  <Button
                    onClick={() => handleExportData('excel')}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    <Download className="w-6 h-6 mb-2" />
                    Export as Excel
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Import Data</h3>
                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select file to import (JSON or CSV)
                      </label>
                      <input
                        type="file"
                        accept=".json,.csv"
                        onChange={(e) => setMigrationFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {migrationFile && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="text-sm">{migrationFile.name}</span>
                        <Button
                          onClick={handleImportData}
                          disabled={isLoading}
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Import
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">System Health & Statistics</h3>
                <Button 
                  onClick={handleCleanupCorruptedBackups} 
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cleanup Corrupted
                </Button>
              </div>

              {backupHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Backup Overview</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Backups:</span>
                        <span className="font-medium">{backupHealth.totalBackups}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Size:</span>
                        <span className="font-medium">{formatFileSize(backupHealth.totalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Corrupted Backups:</span>
                        <span className={`font-medium ${backupHealth.corruptedBackups.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {backupHealth.corruptedBackups.length}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {backupHealth.recommendations.length === 0 ? (
                        <p className="text-sm text-green-600">✓ All systems healthy</p>
                      ) : (
                        backupHealth.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="text-sm text-orange-600 flex items-start">
                            <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {rec}
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {backupStatistics && (
                <Card className="p-4">
                  <h4 className="font-medium mb-3">Backup Statistics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Backup Types</h5>
                      <div className="space-y-1 text-sm">
                        {Object.entries(backupStatistics.backupsByType).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="capitalize">{type}:</span>
                            <span className="font-medium">{String(count)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Backup Frequency</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Last 24h:</span>
                          <span className="font-medium">{backupStatistics.backupFrequency.daily}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last 7 days:</span>
                          <span className="font-medium">{backupStatistics.backupFrequency.weekly}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last 30 days:</span>
                          <span className="font-medium">{backupStatistics.backupFrequency.monthly}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-600 mb-2">Size Information</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Average Size:</span>
                          <span className="font-medium">{formatFileSize(backupStatistics.averageSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span className="font-medium">{formatFileSize(backupStatistics.totalSize)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}