import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'

export async function GET(request: NextRequest) {
  try {
    const statistics = await backupService.getBackupStatistics()

    return NextResponse.json({
      success: true,
      data: statistics
    })
  } catch (error) {
    console.error('Failed to get backup statistics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKUP_STATISTICS_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}