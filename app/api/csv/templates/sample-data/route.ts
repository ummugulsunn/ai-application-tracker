import { NextRequest, NextResponse } from 'next/server'
import { CSVTemplateSystem } from '@/lib/csv/templates'

/**
 * POST /api/csv/templates/sample-data
 * Generate sample data for testing and demonstration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, count = 10, format = 'json' } = body

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Template ID is required'
          },
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    const template = CSVTemplateSystem.getTemplate(templateId)
    
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `Template with ID '${templateId}' not found`
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }

    // Validate count
    const sampleCount = Math.min(Math.max(1, parseInt(count)), 100) // Limit between 1-100

    const sampleData = CSVTemplateSystem.generateSampleData(templateId, sampleCount)

    if (format === 'csv') {
      // Return as CSV file
      const headers = template.fieldMappings.map(m => m.csvColumn)
      const csvRows = [headers]
      
      sampleData.forEach(row => {
        const csvRow = headers.map(header => row[header] || '')
        csvRows.push(csvRow)
      })

      const csvContent = csvRows.map(row => 
        row.map(cell => {
          const cellStr = String(cell)
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`
          }
          return cellStr
        }).join(',')
      ).join('\n')

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${templateId}_sample_data.csv"`
        }
      })
    }

    // Return as JSON
    return NextResponse.json({
      success: true,
      data: {
        template,
        sampleData,
        count: sampleData.length,
        headers: template.fieldMappings.map(m => m.csvColumn)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating sample data:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SAMPLE_DATA_ERROR',
          message: 'Failed to generate sample data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}