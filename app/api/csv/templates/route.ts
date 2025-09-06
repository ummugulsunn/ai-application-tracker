import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * GET /api/csv/templates
 * Get all available CSV templates
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') as 'linkedin' | 'indeed' | 'glassdoor' | 'custom' | null

    let templates
    if (source) {
      templates = CSVTemplateSystem.getTemplatesBySource(source)
    } else {
      templates = CSVTemplateSystem.getAllTemplates()
    }

    return NextResponse.json({
      success: true,
      data: templates,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_FETCH_ERROR',
          message: 'Failed to fetch templates',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/csv/templates
 * Create a custom template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, mapping, sampleData } = body

    if (!name || !description || !mapping) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name, description, and mapping are required',
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate that company field is mapped
    if (!mapping.company) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELD',
            message: 'Company field mapping is required',
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const template = CSVTemplateSystem.createCustomTemplate(
      name,
      description,
      mapping,
      sampleData
    )

    // Validate the created template
    const validation = CSVTemplateSystem.validateTemplate(template)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TEMPLATE',
            message: 'Template validation failed',
            details: validation.errors
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_CREATION_ERROR',
          message: 'Failed to create template',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}