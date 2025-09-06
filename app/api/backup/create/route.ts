import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const createBackupSchema = z.object({
  applications: z.array(z.any()),
  description: z.string().optional().default('Manual backup'),
  type: z.enum(['manual', 'automatic', 'migration']).optional().default('manual')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applications, description, type } = createBackupSchema.parse(body)

    const metadata = await backupService.createBackup(applications, description, type)

    return NextResponse.json({
      success: true,
      data: metadata
    })
  } catch (error) {
    console.error('Backup creation failed:', error)
    
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
          code: 'BACKUP_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}