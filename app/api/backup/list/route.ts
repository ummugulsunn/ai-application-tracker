import { NextRequest, NextResponse } from 'next/server'
import { backupService } from '@/lib/backup/backupService'

export async function GET(request: NextRequest) {
  try {
    const backups = await backupService.getBackupList()

    return NextResponse.json({
      success: true,
      data: backups
    })
  } catch (error) {
    console.error('Failed to get backup list:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKUP_LIST_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      { status: 500 }
    )
  }
}