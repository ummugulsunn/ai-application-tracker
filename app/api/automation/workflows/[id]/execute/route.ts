import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { WorkflowEngine } from '@/lib/automation/workflowEngine'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the workflow
    const workflow = await prisma.workflowRule.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true
      }
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or inactive' }, { status: 404 })
    }

    // Get user's applications to test the workflow against
    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10 // Test against recent applications
    })

    if (applications.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No applications found to execute workflow against',
        executions: []
      })
    }

    const workflowEngine = WorkflowEngine.getInstance()
    await workflowEngine.initialize()

    const executions = []

    // Execute workflow against each application
    for (const application of applications) {
      try {
        const trigger = JSON.parse(workflow.trigger as string)
        const workflowExecutions = await workflowEngine.executeWorkflows(
          trigger,
          application as any,
          session.user.id,
          { manual: true }
        )
        executions.push(...workflowExecutions)
      } catch (error) {
        console.error(`Error executing workflow for application ${application.id}:`, error)
      }
    }

    // Update execution count
    await prisma.workflowRule.update({
      where: { id },
      data: {
        executionCount: { increment: executions.length },
        lastExecuted: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Workflow executed successfully. ${executions.length} actions performed.`,
      executions: executions.map(exec => ({
        id: exec.id,
        status: exec.status,
        result: exec.result,
        error: exec.error
      }))
    })
  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}