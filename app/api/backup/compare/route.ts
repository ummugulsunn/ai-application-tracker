import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const compareVersionsSchema = z.object({
  versionA: z.string(),
  versionB: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { versionA, versionB } = compareVersionsSchema.parse(body)

    const comparison = await backupService.compareVersions(versionA, versionB)

    return NextResponse.json({
      success: true,
      data: comparison
    })
  } catch (error) {
    console.error('Version comparison failed:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
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
          code: 'VERSION_COMPARISON_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}