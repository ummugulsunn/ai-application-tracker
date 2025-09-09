import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WorkflowEngine } from '@/lib/automation/workflowEngine'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['application_created', 'status_changed', 'date_reached', 'no_response', 'manual']),
    config: z.record(z.any()).optional().default({})
  }),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'days_since']),
    value: z.any()
  })).optional().default([]),
  actions: z.array(z.object({
    type: z.enum(['create_reminder', 'send_notification', 'update_status', 'create_task', 'send_email', 'log_activity']),
    config: z.record(z.any()).optional().default({})
  })),
  isActive: z.boolean().optional().default(true),
  priority: z.number().optional().default(1)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflows = await prisma.workflowRule.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { userId: null } // Global/default workflows
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const formattedWorkflows = workflows.map(workflow => ({
      ...workflow,
      trigger: typeof workflow.trigger === 'string' 
        ? JSON.parse(workflow.trigger) 
        : workflow.trigger,
      conditions: typeof workflow.conditions === 'string' 
        ? JSON.parse(workflow.conditions) 
        : workflow.conditions,
      actions: typeof workflow.actions === 'string' 
        ? JSON.parse(workflow.actions) 
        : workflow.actions,
      executionCount: workflow.executionCount || 0
    }))

    return NextResponse.json({
      success: true,
      workflows: formattedWorkflows
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWorkflowSchema.parse(body)

    const workflow = await prisma.workflowRule.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description || '',
        trigger: JSON.stringify(validatedData.trigger),
        conditions: JSON.stringify(validatedData.conditions),
        actions: JSON.stringify(validatedData.actions),
        isActive: validatedData.isActive,
        priority: validatedData.priority,
        executionCount: 0
      }
    })

    const formattedWorkflow = {
      ...workflow,
      trigger: JSON.parse(workflow.trigger as string),
      conditions: JSON.parse(workflow.conditions as string),
      actions: JSON.parse(workflow.actions as string)
    }

    return NextResponse.json({
      success: true,
      workflow: formattedWorkflow
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid workflow data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 })
    }

    const validatedData = createWorkflowSchema.partial().parse(updateData)

    const workflow = await prisma.workflowRule.update({
      where: {
        id,
        userId: session.user.id
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.trigger && { trigger: JSON.stringify(validatedData.trigger) }),
        ...(validatedData.conditions && { conditions: JSON.stringify(validatedData.conditions) }),
        ...(validatedData.actions && { actions: JSON.stringify(validatedData.actions) }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.priority !== undefined && { priority: validatedData.priority }),
        updatedAt: new Date()
      }
    })

    const formattedWorkflow = {
      ...workflow,
      trigger: JSON.parse(workflow.trigger as string),
      conditions: JSON.parse(workflow.conditions as string),
      actions: JSON.parse(workflow.actions as string)
    }

    return NextResponse.json({
      success: true,
      workflow: formattedWorkflow
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid workflow data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating workflow:', error)
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    )
  }
}