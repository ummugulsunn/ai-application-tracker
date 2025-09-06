import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const validateDataSchema = z.object({
  applications: z.array(z.any())
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applications } = validateDataSchema.parse(body)

    const validationResult = await backupService.validateData(applications)

    return NextResponse.json({
      success: true,
      data: validationResult
    })
  } catch (error) {
    console.error('Data validation failed:', error)
    
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
          code: 'DATA_VALIDATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}