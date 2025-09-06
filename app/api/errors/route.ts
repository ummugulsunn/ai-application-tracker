import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Error report schema for validation
const ErrorReportSchema = z.object({
  error: z.object({
    id: z.string(),
    category: z.string(),
    severity: z.string(),
    code: z.string(),
    message: z.string(),
    userMessage: z.string(),
    timestamp: z.string(),
    context: z.string().optional(),
    recoverable: z.boolean(),
    details: z.any().optional(),
  }),
  userAgent: z.string(),
  url: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  additionalContext: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the error report
    const errorReport = ErrorReportSchema.parse(body)
    
    // In production, you would:
    // 1. Store the error in a database
    // 2. Send to error monitoring service (Sentry, LogRocket, etc.)
    // 3. Alert on critical errors
    // 4. Aggregate error statistics
    
    // For now, we'll just log it
    console.error('Error Report Received:', {
      errorId: errorReport.error.id,
      severity: errorReport.error.severity,
      category: errorReport.error.category,
      code: errorReport.error.code,
      message: errorReport.error.message,
      userAgent: errorReport.userAgent,
      url: errorReport.url,
      userId: errorReport.userId,
      timestamp: errorReport.error.timestamp,
    })

    // Store in a simple in-memory store for development
    // In production, use a proper database
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs').promises
      const path = require('path')
      
      try {
        const errorLogPath = path.join(process.cwd(), 'error-reports.json')
        let existingReports = []
        
        try {
          const existingData = await fs.readFile(errorLogPath, 'utf8')
          existingReports = JSON.parse(existingData)
        } catch (e) {
          // File doesn't exist yet, start with empty array
        }
        
        existingReports.push({
          ...errorReport,
          receivedAt: new Date().toISOString(),
        })
        
        // Keep only last 100 reports
        if (existingReports.length > 100) {
          existingReports = existingReports.slice(-100)
        }
        
        await fs.writeFile(errorLogPath, JSON.stringify(existingReports, null, 2))
      } catch (fileError) {
        console.error('Failed to write error report to file:', fileError)
      }
    }

    // Determine if this is a critical error that needs immediate attention
    const isCritical = errorReport.error.severity === 'critical'
    
    if (isCritical) {
      // In production, send alerts (email, Slack, etc.)
      console.error('🚨 CRITICAL ERROR ALERT:', errorReport.error)
    }

    // Check for error patterns that might indicate systemic issues
    const errorPattern = await checkErrorPatterns(errorReport)
    
    return NextResponse.json({
      success: true,
      errorId: errorReport.error.id,
      acknowledged: true,
      pattern: errorPattern,
    })
    
  } catch (error) {
    console.error('Failed to process error report:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process error report',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Endpoint to retrieve error statistics (for admin/debugging)
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') || '24h'
  const severity = searchParams.get('severity')
  
  try {
    // In production, query your database
    // For development, read from file
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs').promises
      const path = require('path')
      
      try {
        const errorLogPath = path.join(process.cwd(), 'error-reports.json')
        const data = await fs.readFile(errorLogPath, 'utf8')
        const reports = JSON.parse(data)
        
        // Filter by timeframe
        const now = new Date()
        const timeframeMs = parseTimeframe(timeframe)
        const cutoff = new Date(now.getTime() - timeframeMs)
        
        let filteredReports = reports.filter((report: any) => {
          const reportTime = new Date(report.receivedAt)
          return reportTime > cutoff
        })
        
        // Filter by severity if specified
        if (severity) {
          filteredReports = filteredReports.filter((report: any) => 
            report.error.severity === severity
          )
        }
        
        // Generate statistics
        const stats = generateErrorStats(filteredReports)
        
        return NextResponse.json({
          success: true,
          timeframe,
          severity,
          stats,
          recentErrors: filteredReports.slice(-10), // Last 10 errors
        })
        
      } catch (fileError) {
        return NextResponse.json({
          success: true,
          stats: {
            total: 0,
            bySeverity: {},
            byCategory: {},
            byCode: {},
            timeline: [],
          },
          recentErrors: [],
        })
      }
    }
    
    // Production implementation would query database here
    return NextResponse.json({
      success: true,
      message: 'Error statistics not available in production mode',
    })
    
  } catch (error) {
    console.error('Failed to retrieve error statistics:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve error statistics',
      },
      { status: 500 }
    )
  }
}

async function checkErrorPatterns(errorReport: any): Promise<string | null> {
  // Simple pattern detection - in production, use more sophisticated analysis
  
  // Check for repeated errors from same user
  if (errorReport.userId) {
    // This would query your database for recent errors from this user
    // For now, just return null
  }
  
  // Check for widespread errors (same error code from multiple users)
  // This would require aggregating errors across users
  
  // Check for error spikes (sudden increase in error rate)
  // This would require time-series analysis
  
  return null
}

function parseTimeframe(timeframe: string): number {
  const unit = timeframe.slice(-1)
  const value = parseInt(timeframe.slice(0, -1))
  
  switch (unit) {
    case 'h':
      return value * 60 * 60 * 1000
    case 'd':
      return value * 24 * 60 * 60 * 1000
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000 // Default to 24 hours
  }
}

function generateErrorStats(reports: any[]) {
  const stats = {
    total: reports.length,
    bySeverity: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byCode: {} as Record<string, number>,
    timeline: [] as Array<{ time: string; count: number }>,
  }
  
  // Count by severity and category
  reports.forEach(report => {
    const severity = report.error.severity
    const category = report.error.category
    const code = report.error.code
    
    stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    stats.byCode[code] = (stats.byCode[code] || 0) + 1
  })
  
  // Generate timeline (hourly buckets for last 24 hours)
  const now = new Date()
  const hours = []
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - (i * 60 * 60 * 1000))
    const hourStart = new Date(hour.getFullYear(), hour.getMonth(), hour.getDate(), hour.getHours())
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000)
    
    const count = reports.filter(report => {
      const reportTime = new Date(report.receivedAt)
      return reportTime >= hourStart && reportTime < hourEnd
    }).length
    
    hours.push({
      time: hourStart.toISOString(),
      count,
    })
  }
  
  stats.timeline = hours
  
  return stats
}