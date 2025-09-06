import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const repairDataSchema = z.object({
  applications: z.array(z.any()),
  repairOptions: z.array(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applications, repairOptions } = repairDataSchema.parse(body)

    const repairedApplications = await backupService.repairData(applications)

    return NextResponse.json({
      success: true,
      data: repairedApplications
    })
  } catch (error) {
    console.error('Data repair failed:', error)
    
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
          code: 'DATA_REPAIR_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}