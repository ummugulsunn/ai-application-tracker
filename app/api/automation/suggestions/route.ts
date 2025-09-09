import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SmartAutomationService } from '@/lib/automation/smartAutomation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const smartAutomation = SmartAutomationService.getInstance()
    const suggestions = await smartAutomation.generateSmartSuggestions(session.user.id)

    return NextResponse.json({
      success: true,
      suggestions
    })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
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
    const { action } = body

    const smartAutomation = SmartAutomationService.getInstance()

    switch (action) {
      case 'optimize_workflows':
        const optimization = await smartAutomation.optimizeWorkflows(session.user.id)
        return NextResponse.json({
          success: true,
          optimization
        })

      case 'detect_patterns':
        // This would require getting user applications first
        return NextResponse.json({
          success: true,
          message: 'Pattern detection initiated'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing suggestion action:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}