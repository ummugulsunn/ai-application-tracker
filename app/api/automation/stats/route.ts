import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get workflow statistics
    const [totalRules, activeRules, executions] = await Promise.all([
      prisma.workflowRule.count({
        where: { userId }
      }),
      prisma.workflowRule.count({
        where: { userId, isActive: true }
      }),
      prisma.workflowExecution.count({
        where: { userId }
      }).catch(() => 0) // Handle case where table doesn't exist
    ])

    // Calculate total execution count from workflow rules
    const workflowRules = await prisma.workflowRule.findMany({
      where: { userId },
      select: { executionCount: true }
    })

    const totalExecutions = workflowRules.reduce(
      (sum, rule) => sum + (rule.executionCount || 0), 
      0
    )

    // Calculate estimated time saved (rough estimate)
    // Assume each automation saves 5 minutes on average
    const timeSaved = Math.round((totalExecutions * 5) / 60) // Convert to hours

    // Calculate success rate (simplified)
    const successfulExecutions = await prisma.workflowExecution.count({
      where: { 
        userId,
        status: 'completed'
      }
    }).catch(() => totalExecutions) // Fallback if table doesn't exist

    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100)
      : 100

    const stats = {
      totalRules,
      activeRules,
      totalExecutions,
      timeSaved,
      successRate
    }

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching automation stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}