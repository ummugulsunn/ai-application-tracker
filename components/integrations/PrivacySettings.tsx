'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { integrationService } from '@/lib/integrations/integrationService'

interface PrivacySettingsProps {
  onSettingsChange?: (settings: any) => void
}

interface PrivacySettings {
  allowDataSync: boolean
  allowCloudBackup: boolean
  allowEmailTracking: boolean
  allowCalendarSync: boolean
  dataRetentionDays: number
}

export function PrivacySettings({ onSettingsChange }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    allowDataSync: true,
    allowCloudBackup: false,
    allowEmailTracking: false,
    allowCalendarSync: true,
    dataRetentionDays: 365
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const currentSettings = integrationService.getPrivacySettings()
    setSettings(currentSettings)
  }

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setIsSaved(false)
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      await integrationService.updatePrivacySettings(settings)
      setIsSaved(true)
      onSettingsChange?.(settings)
      
      // Clear saved indicator after 3 seconds
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save privacy settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const privacyOptions = [
    {
      key: 'allowDataSync' as const,
      title: 'Data Synchronization',
      description: 'Allow syncing application data across devices and platforms',
      icon: '🔄',
      enabled: settings.allowDataSync
    },
    {
      key: 'allowCloudBackup' as const,
      title: 'Cloud Backup',
      description: 'Enable automatic backup of application data to cloud storage',
      icon: '☁️',
      enabled: settings.allowCloudBackup
    },
    {
      key: 'allowEmailTracking' as const,
      title: 'Email Integration',
      description: 'Allow tracking job-related emails and automatic status updates',
      icon: '📧',
      enabled: settings.allowEmailTracking
    },
    {
      key: 'allowCalendarSync' as const,
      title: 'Calendar Integration',
      description: 'Sync interview dates and reminders with your calendar apps',
      icon: '📅',
      enabled: settings.allowCalendarSync
    }
  ]

  const retentionOptions = [
    { value: 30, label: '30 days' },
    { value: 90, label: '3 months' },
    { value: 180, label: '6 months' },
    { value: 365, label: '1 year' },
    { value: 730, label: '2 years' },
    { value: 1825, label: '5 years' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
        <p className="text-gray-600 mt-1">
          Control how your data is synced and shared across integrations
        </p>
      </div>

      {/* Privacy Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing Preferences</h3>
        <div className="space-y-4">
          {privacyOptions.map((option) => (
            <div key={option.key} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{option.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={option.enabled}
                  onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  option.enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    option.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keep my data for:
            </label>
            <select
              value={settings.dataRetentionDays}
              onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {retentionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Data older than this period will be automatically deleted from integrated services
            </p>
          </div>
        </div>
      </Card>

      {/* Data Rights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Data Rights</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                // In a real implementation, this would trigger data export
                console.log('Exporting user data...')
              }}
              className="flex items-center justify-center space-x-2"
            >
              <span>📥</span>
              <span>Export My Data</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // In a real implementation, this would show data deletion confirmation
                console.log('Requesting data deletion...')
              }}
              className="flex items-center justify-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              <span>🗑️</span>
              <span>Delete My Data</span>
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            You have the right to export or delete your personal data at any time. 
            Data deletion will remove all your information from integrated services.
          </p>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isSaved && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">Settings saved successfully</span>
            </>
          )}
        </div>
        <Button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Privacy Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600">🔒</div>
          <div>
            <h4 className="font-medium text-blue-900">Privacy Notice</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your privacy is important to us. We only collect and sync data that you explicitly allow. 
              All data is encrypted in transit and at rest. You can revoke permissions at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}