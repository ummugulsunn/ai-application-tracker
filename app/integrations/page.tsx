'use client'

import React, { useState } from 'react'
import { IntegrationManager } from '@/components/integrations/IntegrationManager'
import { PrivacySettings } from '@/components/integrations/PrivacySettings'
import { SyncStatus } from '@/components/integrations/SyncStatus'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useIntegrations } from '@/lib/hooks/useIntegrations'

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'privacy' | 'sync'>('overview')
  const {
    integrations,
    syncResults,
    isLoading,
    isSyncing,
    errors,
    lastSync,
    syncAll,
    clearErrors,
    isIntegrationEnabled,
    getIntegrationStatus,
    getPendingChanges
  } = useIntegrations()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'sync', label: 'Sync Status', icon: '🔄' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' }
  ] as const

  const getOverviewStats = () => {
    const enabledCount = Object.values(integrations).filter(config => config.enabled).length
    const totalCount = Object.keys(integrations).length
    const pendingChanges = getPendingChanges()
    const errorCount = errors.length

    return {
      enabledCount,
      totalCount,
      pendingChanges,
      errorCount,
      lastSync
    }
  }

  const stats = getOverviewStats()

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.enabledCount}</div>
          <div className="text-sm text-gray-600">Active Integrations</div>
          <div className="text-xs text-gray-500 mt-1">of {stats.totalCount} available</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {Object.values(syncResults).reduce((sum, result) => sum + result.itemsProcessed, 0)}
          </div>
          <div className="text-sm text-gray-600">Items Synced</div>
          <div className="text-xs text-gray-500 mt-1">across all platforms</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.pendingChanges}</div>
          <div className="text-sm text-gray-600">Pending Changes</div>
          <div className="text-xs text-gray-500 mt-1">waiting to sync</div>
        </Card>
        <Card className="p-4 text-center">
          <div className={`text-3xl font-bold ${stats.errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {stats.errorCount}
          </div>
          <div className="text-sm text-gray-600">Sync Errors</div>
          <div className="text-xs text-gray-500 mt-1">need attention</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            onClick={() => syncAll()}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <span>🔄</span>
            <span>{isSyncing ? 'Syncing...' : 'Sync All Platforms'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('integrations')}
            className="flex items-center justify-center space-x-2"
          >
            <span>⚙️</span>
            <span>Manage Integrations</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab('privacy')}
            className="flex items-center justify-center space-x-2"
          >
            <span>🔒</span>
            <span>Privacy Settings</span>
          </Button>
        </div>
      </Card>

      {/* Integration Status Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
        <div className="space-y-3">
          {Object.entries(integrations).map(([platform, config]) => {
            const status = getIntegrationStatus(platform)
            const statusColors = {
              connected: 'bg-green-500',
              disconnected: 'bg-gray-300',
              error: 'bg-red-500',
              syncing: 'bg-yellow-500'
            }
            
            return (
              <div key={platform} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {platform.replace(/_/g, ' ')}
                    </div>
                    {config.lastSync && (
                      <div className="text-sm text-gray-500">
                        Last sync: {config.lastSync.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 capitalize">{status}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Recent Activity */}
      {Object.keys(syncResults).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h3>
          <div className="space-y-2">
            {Object.entries(syncResults).slice(0, 5).map(([platform, result]) => (
              <div key={platform} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="capitalize">{platform.replace(/_/g, ' ')}</span>
                  <span className="text-gray-600">
                    {result.itemsProcessed} items processed
                  </span>
                </div>
                <span className="text-gray-500">
                  {result.lastSync.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-red-600">❌</div>
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Sync Errors</h4>
                <div className="mt-2 space-y-1">
                  {errors.slice(0, 3).map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      • {error}
                    </p>
                  ))}
                  {errors.length > 3 && (
                    <p className="text-sm text-red-600">
                      ... and {errors.length - 3} more errors
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={clearErrors}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Clear
            </Button>
          </div>
        </Card>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multi-Platform Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your job search tools and sync data across platforms seamlessly
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
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

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'integrations' && (
            <IntegrationManager onSyncComplete={(results) => console.log('Sync completed:', results)} />
          )}
          {activeTab === 'sync' && (
            <SyncStatus onRefresh={() => console.log('Refreshing sync status')} />
          )}
          {activeTab === 'privacy' && (
            <PrivacySettings onSettingsChange={(settings) => console.log('Privacy settings changed:', settings)} />
          )}
        </div>
      </div>
    </div>
  )
}