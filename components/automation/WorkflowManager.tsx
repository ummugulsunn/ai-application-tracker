'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Edit, 
  Trash2, 
  Zap, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bot
} from 'lucide-react'

interface WorkflowRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: {
    type: string
    config: Record<string, any>
  }
  conditions: Array<{
    field: string
    operator: string
    value: any
  }>
  actions: Array<{
    type: string
    config: Record<string, any>
  }>
  executionCount: number
  lastExecuted?: Date
  createdAt: Date
}

interface AutomationStats {
  totalRules: number
  activeRules: number
  totalExecutions: number
  timeSaved: number
  successRate: number
}

export default function WorkflowManager() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([])
  const [stats, setStats] = useState<AutomationStats>({
    totalRules: 0,
    activeRules: 0,
    totalExecutions: 0,
    timeSaved: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null)

  useEffect(() => {
    loadWorkflows()
    loadStats()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await fetch('/api/automation/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/automation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, isActive } : w
        ))
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return

    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/automation/workflows/${workflowId}/execute`, {
        method: 'POST'
      })

      if (response.ok) {
        // Refresh workflows to update execution count
        loadWorkflows()
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
    }
  }

  const getTriggerDescription = (trigger: WorkflowRule['trigger']) => {
    switch (trigger.type) {
      case 'application_created':
        return 'When a new application is created'
      case 'status_changed':
        return `When status changes to ${trigger.config.newStatus || 'any'}`
      case 'date_reached':
        return 'On scheduled date/time'
      case 'no_response':
        return 'When no response received'
      default:
        return 'Custom trigger'
    }
  }

  const getActionDescription = (actions: WorkflowRule['actions']) => {
    if (actions.length === 0) return 'No actions'
    if (actions.length === 1) {
      const action = actions[0]
      switch (action.type) {
        case 'create_reminder':
          return 'Create reminder'
        case 'send_notification':
          return 'Send notification'
        case 'update_status':
          return 'Update status'
        case 'create_task':
          return 'Create task'
        default:
          return 'Custom action'
      }
    }
    return `${actions.length} actions`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600">Automate your job search with intelligent workflows</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRules}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeRules}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExecutions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-orange-600">{stats.timeSaved}h</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Workflows</h2>
        
        {workflows.length === 0 ? (
          <Card className="p-8 text-center">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first workflow to automate repetitive tasks in your job search.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Workflow
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {workflow.name}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{workflow.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Trigger: </span>
                        <span className="text-gray-600">
                          {getTriggerDescription(workflow.trigger)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Actions: </span>
                        <span className="text-gray-600">
                          {getActionDescription(workflow.actions)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Executed {workflow.executionCount} times</span>
                      {workflow.lastExecuted && (
                        <span>
                          Last run: {new Date(workflow.lastExecuted).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeWorkflow(workflow.id)}
                      className="flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Run
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWorkflow(workflow.id, !workflow.isActive)}
                      className={`flex items-center gap-1 ${
                        workflow.isActive ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {workflow.isActive ? (
                        <>
                          <Pause className="w-3 h-3" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 p-4 h-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Auto Follow-up</div>
              <div className="text-sm text-gray-600">Create follow-up reminders</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2 p-4 h-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Status Updates</div>
              <div className="text-sm text-gray-600">Auto-update stale applications</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2 p-4 h-auto"
            onClick={() => setShowCreateModal(true)}
          >
            <Clock className="w-5 h-5 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Interview Prep</div>
              <div className="text-sm text-gray-600">Auto-create prep tasks</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Create/Edit Workflow Modal */}
      {(showCreateModal || selectedWorkflow) && (
        <WorkflowEditor
          workflow={selectedWorkflow}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedWorkflow(null)
          }}
          onSave={(workflow) => {
            if (selectedWorkflow) {
              setWorkflows(prev => prev.map(w => 
                w.id === workflow.id ? workflow : w
              ))
            } else {
              setWorkflows(prev => [...prev, workflow])
            }
            setShowCreateModal(false)
            setSelectedWorkflow(null)
          }}
        />
      )}
    </div>
  )
}

interface WorkflowEditorProps {
  workflow?: WorkflowRule | null
  onClose: () => void
  onSave: (workflow: WorkflowRule) => void
}

function WorkflowEditor({ workflow, onClose, onSave }: WorkflowEditorProps) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    triggerType: workflow?.trigger.type || 'application_created',
    actionType: workflow?.actions[0]?.type || 'create_reminder'
  })

  const handleSave = async () => {
    try {
      const workflowData = {
        name: formData.name,
        description: formData.description,
        trigger: {
          type: formData.triggerType,
          config: {}
        },
        conditions: [],
        actions: [{
          type: formData.actionType,
          config: {}
        }],
        isActive: true
      }

      const response = await fetch('/api/automation/workflows', {
        method: workflow ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow ? { ...workflowData, id: workflow.id } : workflowData)
      })

      if (response.ok) {
        const savedWorkflow = await response.json()
        onSave(savedWorkflow.workflow)
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {workflow ? 'Edit Workflow' : 'Create Workflow'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter workflow name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this workflow does"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.triggerType}
              onChange={(e) => setFormData(prev => ({ ...prev, triggerType: e.target.value }))}
            >
              <option value="application_created">When application is created</option>
              <option value="status_changed">When status changes</option>
              <option value="date_reached">On scheduled date</option>
              <option value="no_response">When no response received</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.actionType}
              onChange={(e) => setFormData(prev => ({ ...prev, actionType: e.target.value }))}
            >
              <option value="create_reminder">Create reminder</option>
              <option value="send_notification">Send notification</option>
              <option value="update_status">Update status</option>
              <option value="create_task">Create task</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {workflow ? 'Update' : 'Create'} Workflow
          </Button>
        </div>
      </div>
    </div>
  )
}