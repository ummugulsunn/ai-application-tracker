import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'

export async function GET(request: NextRequest) {
  try {
    const health = await backupService.getBackupHealth()

    return NextResponse.json({
      success: true,
      data: health
    })
  } catch (error) {
    console.error('Failed to get backup health:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKUP_HEALTH_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}