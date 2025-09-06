import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const historyQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit } = historyQuerySchema.parse({
      limit: searchParams.get('limit')
    })

    const history = await backupService.getVersionHistory(limit)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Failed to get version history:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERSION_HISTORY_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}