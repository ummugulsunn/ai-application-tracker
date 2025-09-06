import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * GET /api/csv/templates/[id]/download
 * Download a CSV template file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeExamples = searchParams.get('examples') !== 'false'
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

    const csvContent = CSVTemplateSystem.generateTemplateCSV(resolvedParams.id, includeExamples)
    
    // Create filename
    const filename = `${resolvedParams.id}_template.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('Error downloading template:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_DOWNLOAD_ERROR',
          message: 'Failed to download template',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}