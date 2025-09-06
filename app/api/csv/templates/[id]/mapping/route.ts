import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * POST /api/csv/templates/[id]/mapping
 * Generate field mapping based on template and CSV headers
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { headers } = body
    const resolvedParams = await params

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

    const template = CSVTemplateSystem.getTemplate(resolvedParams.id)
    
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template with ID '${resolvedParams.id}' not found`
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    const mappingResult = CSVTemplateSystem.generateMappingFromTemplate(resolvedParams.id, headers)

    // Calculate overall confidence
    const confidenceValues = Object.values(mappingResult.confidence)
    const overallConfidence = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length 
      : 0

    // Generate suggestions
    const suggestions: string[] = []
    
    if (mappingResult.missingFields.length > 0) {
      suggestions.push(`Missing required fields: ${mappingResult.missingFields.join(', ')}`)
    }
    
    if (mappingResult.unmappedHeaders.length > 0) {
      suggestions.push(`Unmapped columns: ${mappingResult.unmappedHeaders.join(', ')}`)
    }
    
    if (overallConfidence < 0.7) {
      suggestions.push('Low confidence mapping detected. Please review and adjust manually.')
    }
    
    if (overallConfidence >= 0.9) {
      suggestions.push('High confidence mapping detected. Ready to import!')
    }

    return NextResponse.json({
      success: true,
      data: {
        template,
        mapping: mappingResult.mapping,
        confidence: mappingResult.confidence,
        overallConfidence,
        unmappedHeaders: mappingResult.unmappedHeaders,
        missingFields: mappingResult.missingFields,
        suggestions,
        canProceed: mappingResult.missingFields.length === 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating mapping:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MAPPING_GENERATION_ERROR',
          message: 'Failed to generate field mapping',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}