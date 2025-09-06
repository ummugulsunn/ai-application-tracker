import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'

export async function POST(request: NextRequest) {
  try {
    const cleanedBackups = await backupService.cleanupCorruptedBackups()

    return NextResponse.json({
      success: true,
      data: {
        cleanedBackups,
        message: `Cleaned up ${cleanedBackups.length} corrupted backup(s)`
      }
    })
  } catch (error) {
    console.error('Backup cleanup failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKUP_CLEANUP_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}