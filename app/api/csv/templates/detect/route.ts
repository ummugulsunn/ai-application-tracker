import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * POST /api/csv/templates/detect
 * Auto-detect template based on CSV headers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { headers } = body

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Headers array is required'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    if (headers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_HEADERS',
            message: 'Headers array cannot be empty'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const detection = CSVTemplateSystem.detectTemplate(headers)

    return NextResponse.json({
      success: true,
      data: {
        detectedTemplate: detection.template,
        confidence: detection.confidence,
        matchedFields: detection.matchedFields,
        totalHeaders: headers.length,
        suggestions: detection.template ? [
          `Detected ${detection.template.name} format with ${Math.round(detection.confidence * 100)}% confidence`,
          `Matched ${detection.matchedFields} out of ${detection.template.fieldMappings.length} expected fields`
        ] : [
          'No template matched with high confidence',
          'Consider using the Custom template or manual field mapping'
        ]
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error detecting template:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_DETECTION_ERROR',
          message: 'Failed to detect template',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}