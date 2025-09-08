'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { integrationService, IntegrationConfig, SyncResult } from '@/lib/integrations/integrationService'

interface IntegrationManagerProps {
  onSyncComplete?: (results: any) => void
}

interface IntegrationStatus {
  platform: string
  name: string
  description: string
  enabled: boolean
  lastSync?: Date
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  config?: IntegrationConfig
}

export function IntegrationManager({ onSyncComplete }: IntegrationManagerProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'job-boards' | 'calendar' | 'email' | 'storage'>('job-boards')

  const integrationDefinitions = {
    'job-boards': [
      {
        platform: 'linkedin',
        name: 'LinkedIn',
        description: 'Import applications from LinkedIn job searches and Easy Apply',
        icon: '💼'
      },
      {
        platform: 'indeed',
        name: 'Indeed',
        description: 'Sync applications from Indeed job board',
        icon: '🔍'
      },
      {
        platform: 'glassdoor',
        name: 'Glassdoor',
        description: 'Import applications from Glassdoor job searches',
        icon: '🏢'
      }
    ],
    'calendar': [
      {
        platform: 'calendar_google',
        name: 'Google Calendar',
        description: 'Sync interview dates and reminders with Google Calendar',
        icon: '📅'
      },
      {
        platform: 'calendar_outlook',
        name: 'Outlook Calendar',
        description: 'Sync interview dates and reminders with Outlook Calendar',
        icon: '📆'
      }
    ],
    'email': [
      {
        platform: 'email_gmail',
        name: 'Gmail',
        description: 'Track job-related emails and application responses',
        icon: '📧'
      },
      {
        platform: 'email_outlook',
        name: 'Outlook Email',
        description: 'Track job-related emails from Outlook',
        icon: '📨'
      }
    ],
    'storage': [
      {
        platform: 'storage_google_drive',
        name: 'Google Drive',
        description: 'Backup application data to Google Drive',
        icon: '☁️'
      },
      {
        platform: 'storage_dropbox',
        name: 'Dropbox',
        description: 'Backup application data to Dropbox',
        icon: '📦'
      }
    ]
  }

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = () => {
    const allIntegrations: IntegrationStatus[] = []
    
    Object.entries(integrationDefinitions).forEach(([category, definitions]) => {
      definitions.forEach(def => {
        const config = integrationService.getConfig(def.platform)
        allIntegrations.push({
          platform: def.platform,
          name: def.name,
          description: def.description,
          enabled: config?.enabled || false,
          lastSync: config?.lastSync,
          status: config?.enabled ? 'connected' : 'disconnected',
          config
        })
      })
    })
    
    setIntegrations(allIntegrations)
  }

  const toggleIntegration = async (platform: string, enabled: boolean) => {
    const config: IntegrationConfig = {
      enabled,
      lastSync: enabled ? new Date() : undefined,
      syncInterval: 60 // Default 60 minutes
    }
    
    integrationService.setConfig(platform, config)
    loadIntegrations()
    
    if (enabled) {
      // Simulate initial sync
      setIntegrations(prev => prev.map(integration => 
        integration.platform === platform 
          ? { ...integration, status: 'syncing' as const }
          : integration
      ))
      
      // Simulate sync completion after 2 seconds
      setTimeout(() => {
        setIntegrations(prev => prev.map(integration => 
          integration.platform === platform 
            ? { ...integration, status: 'connected' as const, lastSync: new Date() }
            : integration
        ))
      }, 2000)
    }
  }

  const performSync = async (category?: string) => {
    setIsLoading(true)
    
    try {
      let results: any = {}
      
      if (category === 'job-boards' || !category) {
        const jobBoardResults = await integrationService.syncJobBoards()
        results.jobBoards = jobBoardResults
      }
      
      if (category === 'calendar' || !category) {
        const calendarResults = []
        const googleConfig = integrationService.getConfig('calendar_google')
        const outlookConfig = integrationService.getConfig('calendar_outlook')
        
        if (googleConfig?.enabled) {
          try {
            const result = await integrationService.syncCalendar('google')
            calendarResults.push(result)
          } catch (error) {
            console.error('Google Calendar sync failed:', error)
          }
        }
        
        if (outlookConfig?.enabled) {
          try {
            const result = await integrationService.syncCalendar('outlook')
            calendarResults.push(result)
          } catch (error) {
            console.error('Outlook Calendar sync failed:', error)
          }
        }
        
        results.calendar = calendarResults
      }
      
      if (category === 'email' || !category) {
        const emailResults = []
        const gmailConfig = integrationService.getConfig('email_gmail')
        const outlookEmailConfig = integrationService.getConfig('email_outlook')
        
        if (gmailConfig?.enabled) {
          try {
            const result = await integrationService.syncEmails('gmail')
            emailResults.push(result)
          } catch (error) {
            console.error('Gmail sync failed:', error)
          }
        }
        
        if (outlookEmailConfig?.enabled) {
          try {
            const result = await integrationService.syncEmails('outlook')
            emailResults.push(result)
          } catch (error) {
            console.error('Outlook Email sync failed:', error)
          }
        }
        
        results.email = emailResults
      }
      
      if (category === 'storage' || !category) {
        const storageResults = []
        const googleDriveConfig = integrationService.getConfig('storage_google_drive')
        const dropboxConfig = integrationService.getConfig('storage_dropbox')
        
        if (googleDriveConfig?.enabled) {
          try {
            const result = await integrationService.syncCloudStorage('google-drive')
            storageResults.push(result)
          } catch (error) {
            console.error('Google Drive sync failed:', error)
          }
        }
        
        if (dropboxConfig?.enabled) {
          try {
            const result = await integrationService.syncCloudStorage('dropbox')
            storageResults.push(result)
          } catch (error) {
            console.error('Dropbox sync failed:', error)
          }
        }
        
        results.storage = storageResults
      }
      
      setSyncResults(results)
      onSyncComplete?.(results)
      
      // Update last sync times
      loadIntegrations()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderIntegrationCard = (integration: IntegrationStatus, icon: string) => (
    <Card key={integration.platform} className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
            {integration.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last sync: {integration.lastSync.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            integration.status === 'connected' ? 'bg-green-500' :
            integration.status === 'syncing' ? 'bg-yellow-500' :
            integration.status === 'error' ? 'bg-red-500' :
            'bg-gray-300'
          }`} />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={integration.enabled}
              onChange={(e) => toggleIntegration(integration.platform, e.target.checked)}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              integration.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                integration.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </div>
      </div>
    </Card>
  )

  const tabs = [
    { id: 'job-boards', label: 'Job Boards', icon: '💼' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'email', label: 'Email', icon: '📧' },
    { id: 'storage', label: 'Storage', icon: '☁️' }
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integration Manager</h2>
          <p className="text-gray-600 mt-1">
            Connect your job search tools and sync data across platforms
          </p>
        </div>
        <Button
          onClick={() => performSync()}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {integrationDefinitions[selectedTab].map((def) => {
          const integration = integrations.find(i => i.platform === def.platform)
          return integration ? renderIntegrationCard(integration, def.icon) : null
        })}
      </div>

      {/* Sync Results */}
      {Object.keys(syncResults).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Sync Results</h3>
          <div className="space-y-2">
            {Object.entries(syncResults).map(([category, results]) => (
              <div key={category} className="text-sm">
                <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1')}: </span>
                {Array.isArray(results) ? (
                  <span className="text-gray-600">
                    {results.reduce((total, result) => total + result.itemsProcessed, 0)} items processed
                  </span>
                ) : (
                  <span className="text-gray-600">
                    {results.itemsProcessed} items processed
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="outline"
            onClick={() => performSync(tab.id)}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2"
          >
            <span>{tab.icon}</span>
            <span>Sync {tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}