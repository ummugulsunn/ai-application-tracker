import { NextRequest, NextResponse } from 'next/server'
import { ExportService, ExportOptions } from '@/lib/export/exportService'
import { Application } from '@/types/application'
import { z } from 'zod'

const exportRequestSchema = z.object({
  applications: z.array(z.any()),
  options: z.object({
    format: z.enum(['csv', 'excel', 'pdf', 'json']),
    fields: z.array(z.object({
      key: z.string(),
      label: z.string(),
      selected: z.boolean(),
      type: z.enum(['string', 'date', 'number', 'array', 'object']),
      formatter: z.function().optional()
    })),
    includeStats: z.boolean().optional(),
    includeAIInsights: z.boolean().optional(),
    dateRange: z.object({
      start: z.string().nullable(),
      end: z.string().nullable()
    }).optional(),
    customFilename: z.string().optional()
  }),
  stats: z.any().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applications, options, stats } = exportRequestSchema.parse(body)

    const result = await ExportService.exportApplications(
      applications as Application[],
      options as ExportOptions,
      stats
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // For server-side export, we return the data as a response
    if (typeof result.data === 'string') {
      // JSON or CSV
      return new NextResponse(result.data, {
        headers: {
          'Content-Type': options.format === 'json' ? 'application/json' : 'text/csv',
          'Content-Disposition': `attachment; filename="${result.filename}"`
        }
      })
    } else if (result.data instanceof Blob) {
      // Excel or PDF
      const buffer = await result.data.arrayBuffer()
      const contentType = options.format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid export data' }, { status: 500 })

  } catch (error) {
    console.error('Export API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for export templates and field definitions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'fields':
        return NextResponse.json({
          fields: ExportService.getDefaultFields()
        })

      case 'formats':
        return NextResponse.json({
          formats: [
            {
              id: 'csv',
              name: 'CSV',
              description: 'Comma-separated values for spreadsheet applications',
              extension: '.csv',
              mimeType: 'text/csv'
            },
            {
              id: 'excel',
              name: 'Excel',
              description: 'Microsoft Excel workbook with formatting',
              extension: '.xlsx',
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            },
            {
              id: 'pdf',
              name: 'PDF Report',
              description: 'Professional report with statistics and formatting',
              extension: '.pdf',
              mimeType: 'application/pdf'
            },
            {
              id: 'json',
              name: 'JSON',
              description: 'Structured data for developers and integrations',
              extension: '.json',
              mimeType: 'application/json'
            }
          ]
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Export API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}