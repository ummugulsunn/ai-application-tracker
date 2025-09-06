import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * GET /api/csv/templates/[id]
 * Get a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
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

    return NextResponse.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_ERROR',
          message: 'Failed to fetch template',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}