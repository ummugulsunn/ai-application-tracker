import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ErrorReportSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  context: z.record(z.any()).optional(),
  timestamp: z.number(),
  sessionId: z.string(),
  url: z.string(),
  userAgent: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const errorReport = ErrorReportSchema.parse(body)

    // In a real implementation, you would:
    // 1. Store error in database for analysis
    // 2. Send to external error tracking service (Sentry, Bugsnag, etc.)
    // 3. Alert on critical errors
    // 4. Aggregate errors for monitoring dashboards

    // Log error (in production, use proper logging service)
    console.error('Client error reported:', {
      message: errorReport.message,
      url: errorReport.url,
      timestamp: new Date(errorReport.timestamp).toISOString(),
      sessionId: errorReport.sessionId,
      context: errorReport.context
    })

    // Store error report
    await storeErrorReport(errorReport)

    // Check if this is a critical error that needs immediate attention
    if (isCriticalError(errorReport)) {
      await alertOnCriticalError(errorReport)
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error processing error report:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ERROR_REPORT',
            message: 'Invalid error report data',
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
          code: 'ERROR_PROCESSING_FAILED',
          message: 'Failed to process error report'
        }
      },
      { status: 500 }
    )
  }
}

async function storeErrorReport(errorReport: any) {
  // In a real implementation, store in database
  // For now, we'll simulate storage
  const storedReport = {
    ...errorReport,
    id: generateErrorId(),
    processed_at: new Date().toISOString(),
    severity: calculateSeverity(errorReport),
    fingerprint: generateFingerprint(errorReport)
  }

  // Simulate async storage
  await new Promise(resolve => setTimeout(resolve, 10))
  
  return storedReport
}

function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateSeverity(errorReport: any): 'low' | 'medium' | 'high' | 'critical' {
  const message = errorReport.message.toLowerCase()
  
  // Critical errors
  if (message.includes('chunk') && message.includes('failed')) return 'critical'
  if (message.includes('network') && message.includes('error')) return 'high'
  if (message.includes('script') && message.includes('error')) return 'high'
  if (message.includes('uncaught')) return 'high'
  
  // Medium severity
  if (message.includes('warning')) return 'medium'
  if (message.includes('deprecated')) return 'low'
  
  return 'medium'
}

function generateFingerprint(errorReport: any): string {
  // Create a fingerprint to group similar errors
  const key = `${errorReport.message}_${errorReport.stack?.split('\n')[0] || ''}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function isCriticalError(errorReport: any): boolean {
  const severity = calculateSeverity(errorReport)
  return severity === 'critical'
}

async function alertOnCriticalError(errorReport: any) {
  // In a real implementation, send alerts via:
  // - Email
  // - Slack
  // - PagerDuty
  // - SMS
  
  console.error('CRITICAL ERROR ALERT:', {
    message: errorReport.message,
    url: errorReport.url,
    timestamp: new Date(errorReport.timestamp).toISOString()
  })
  
  // Simulate alert sending
  await new Promise(resolve => setTimeout(resolve, 100))
}