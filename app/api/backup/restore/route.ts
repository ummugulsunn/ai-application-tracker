import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'
import { z } from 'zod'

const restoreBackupSchema = z.object({
  backupId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { backupId } = restoreBackupSchema.parse(body)

    const applications = await backupService.restoreBackup(backupId)

    return NextResponse.json({
      success: true,
      data: applications
    })
  } catch (error) {
    console.error('Backup restoration failed:', error)
    
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
          code: 'BACKUP_RESTORATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}