import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Analytics export request schema
const AnalyticsExportSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(false),
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  sections: z.array(z.enum([
    'overview',
    'trends',
    'distributions',
    'benchmarks',
    'insights',
    'recommendations'
  ])).default(['overview', 'trends', 'insights']),
  customFilename: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { format, includeCharts, dateRange, sections, customFilename } = AnalyticsExportSchema.parse(body)

    // Get applications and analytics data from request body
    const applications = body.applications || []
    const analyticsData = body.analyticsData || {}

    // Generate export data based on format
    const exportData = await generateExportData(
      applications,
      analyticsData,
      format,
      sections,
      includeCharts,
      dateRange
    )

    // Generate filename
    const filename = customFilename || generateDefaultFilename(format)

    // Set appropriate headers based on format
    const headers = getExportHeaders(format, filename)

    return new NextResponse(exportData.content, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Analytics export error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EXPORT_REQUEST',
            message: 'Invalid export request data',
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
          code: 'EXPORT_GENERATION_ERROR',
          message: 'Failed to generate analytics export'
        }
      },
      { status: 500 }
    )
  }
}

async function generateExportData(
  applications: any[],
  analyticsData: any,
  format: string,
  sections: string[],
  includeCharts: boolean,
  dateRange?: any
) {
  // Filter applications by date range if specified
  let filteredApps = applications
  if (dateRange?.start || dateRange?.end) {
    filteredApps = applications.filter(app => {
      const appDate = new Date(app.appliedDate)
      const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01')
      const end = dateRange.end ? new Date(dateRange.end) : new Date()
      return appDate >= start && appDate <= end
    })
  }

  // Generate comprehensive analytics if not provided
  const analytics = analyticsData.overview ? analyticsData : generateComprehensiveAnalytics(filteredApps)

  switch (format) {
    case 'json':
      return generateJSONExport(analytics, sections, includeCharts)
    case 'csv':
      return generateCSVExport(analytics, sections, filteredApps)
    case 'pdf':
      return generatePDFExport(analytics, sections, includeCharts, filteredApps)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

function generateJSONExport(analytics: any, sections: string[], includeCharts: boolean) {
  const exportData: any = {
    metadata: {
      exportDate: new Date().toISOString(),
      format: 'json',
      sections: sections,
      includeCharts: includeCharts
    }
  }

  // Include requested sections
  sections.forEach(section => {
    if (analytics[section]) {
      exportData[section] = analytics[section]
    }
  })

  // Add chart data if requested
  if (includeCharts && analytics.trends?.timeSeriesData) {
    exportData.chartData = {
      timeSeries: analytics.trends.timeSeriesData,
      statusDistribution: analytics.distributions?.statusDistribution,
      companyPerformance: analytics.distributions?.companyPerformance?.slice(0, 10),
      locationAnalysis: analytics.distributions?.locationAnalysis?.slice(0, 10)
    }
  }

  return {
    content: JSON.stringify(exportData, null, 2),
    mimeType: 'application/json'
  }
}

function generateCSVExport(analytics: any, sections: string[], applications: any[]) {
  let csvContent = ''

  // Add metadata header
  csvContent += `Analytics Export Report\n`
  csvContent += `Generated: ${new Date().toISOString()}\n`
  csvContent += `Sections: ${sections.join(', ')}\n\n`

  // Overview section
  if (sections.includes('overview') && analytics.overview) {
    csvContent += `OVERVIEW METRICS\n`
    csvContent += `Metric,Value\n`
    csvContent += `Total Applications,${analytics.overview.totalApplications}\n`
    csvContent += `Interview Count,${analytics.overview.interviewCount}\n`
    csvContent += `Offer Count,${analytics.overview.offerCount}\n`
    csvContent += `Rejection Count,${analytics.overview.rejectionCount}\n`
    csvContent += `Interview Rate,${analytics.overview.interviewRate}%\n`
    csvContent += `Offer Rate,${analytics.overview.offerRate}%\n`
    csvContent += `Average Response Time,${analytics.overview.avgResponseTime} days\n\n`
  }

  // Trends section
  if (sections.includes('trends') && analytics.trends?.timeSeriesData) {
    csvContent += `TRENDS DATA\n`
    csvContent += `Date,Applications,Interviews,Offers,Rejections\n`
    analytics.trends.timeSeriesData.forEach((point: any) => {
      csvContent += `${point.date || point.month},${point.applications},${point.interviews},${point.offers},${point.rejections}\n`
    })
    csvContent += `\n`
  }

  // Status distribution
  if (sections.includes('distributions') && analytics.distributions?.statusDistribution) {
    csvContent += `STATUS DISTRIBUTION\n`
    csvContent += `Status,Count,Percentage\n`
    analytics.distributions.statusDistribution.forEach((item: any) => {
      csvContent += `${item.status},${item.count},${item.percentage}%\n`
    })
    csvContent += `\n`
  }

  // Company performance
  if (sections.includes('distributions') && analytics.distributions?.companyPerformance) {
    csvContent += `COMPANY PERFORMANCE\n`
    csvContent += `Company,Applications,Interviews,Offers,Interview Rate,Offer Rate\n`
    analytics.distributions.companyPerformance.slice(0, 20).forEach((company: any) => {
      csvContent += `${company.company},${company.applications},${company.interviews},${company.offers},${company.interviewRate.toFixed(1)}%,${company.offerRate.toFixed(1)}%\n`
    })
    csvContent += `\n`
  }

  // Insights
  if (sections.includes('insights') && analytics.insights) {
    csvContent += `INSIGHTS\n`
    csvContent += `Type,Title,Description,Impact\n`
    analytics.insights.forEach((insight: any) => {
      csvContent += `${insight.type},"${insight.title}","${insight.description}",${insight.impact}\n`
    })
    csvContent += `\n`
  }

  // Recommendations
  if (sections.includes('recommendations') && analytics.recommendations) {
    csvContent += `RECOMMENDATIONS\n`
    csvContent += `Category,Title,Description,Priority\n`
    analytics.recommendations.forEach((rec: any) => {
      csvContent += `${rec.category},"${rec.title}","${rec.description}",${rec.priority}\n`
    })
  }

  return {
    content: csvContent,
    mimeType: 'text/csv'
  }
}

function generatePDFExport(analytics: any, sections: string[], includeCharts: boolean, applications: any[]) {
  // For now, return HTML that can be converted to PDF
  // In a real implementation, you would use a library like Puppeteer or jsPDF
  
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .insight { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 10px 0; }
        .recommendation { background-color: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin: 10px 0; }
        .chart-placeholder { background-color: #f9f9f9; padding: 40px; text-align: center; border: 1px dashed #ccc; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Job Application Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Report Period: ${applications.length > 0 ? 
          `${new Date(Math.min(...applications.map((app: any) => new Date(app.appliedDate).getTime()))).toLocaleDateString()} - ${new Date(Math.max(...applications.map((app: any) => new Date(app.appliedDate).getTime()))).toLocaleDateString()}` 
          : 'No data available'}</p>
      </div>
  `

  // Overview section
  if (sections.includes('overview') && analytics.overview) {
    htmlContent += `
      <div class="section">
        <h2>Overview</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.totalApplications}</div>
            <div class="metric-label">Total Applications</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.interviewCount}</div>
            <div class="metric-label">Interviews</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.offerCount}</div>
            <div class="metric-label">Offers</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.interviewRate.toFixed(1)}%</div>
            <div class="metric-label">Interview Rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.offerRate.toFixed(1)}%</div>
            <div class="metric-label">Offer Rate</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${analytics.overview.avgResponseTime.toFixed(1)}</div>
            <div class="metric-label">Avg Response Time (days)</div>
          </div>
        </div>
      </div>
    `
  }

  // Trends section
  if (sections.includes('trends') && analytics.trends?.timeSeriesData) {
    htmlContent += `
      <div class="section">
        <h2>Trends</h2>
        ${includeCharts ? '<div class="chart-placeholder">Time Series Chart (Chart data available in JSON export)</div>' : ''}
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Applications</th>
              <th>Interviews</th>
              <th>Offers</th>
              <th>Interview Rate</th>
            </tr>
          </thead>
          <tbody>
    `
    
    analytics.trends.timeSeriesData.slice(-12).forEach((point: any) => {
      const interviewRate = point.applications > 0 ? (point.interviews / point.applications * 100).toFixed(1) : '0.0'
      htmlContent += `
        <tr>
          <td>${point.date || point.month}</td>
          <td>${point.applications}</td>
          <td>${point.interviews}</td>
          <td>${point.offers}</td>
          <td>${interviewRate}%</td>
        </tr>
      `
    })
    
    htmlContent += `
          </tbody>
        </table>
      </div>
    `
  }

  // Company performance
  if (sections.includes('distributions') && analytics.distributions?.companyPerformance) {
    htmlContent += `
      <div class="section">
        <h2>Top Company Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Applications</th>
              <th>Interviews</th>
              <th>Offers</th>
              <th>Interview Rate</th>
              <th>Offer Rate</th>
            </tr>
          </thead>
          <tbody>
    `
    
    analytics.distributions.companyPerformance.slice(0, 10).forEach((company: any) => {
      htmlContent += `
        <tr>
          <td>${company.company}</td>
          <td>${company.applications}</td>
          <td>${company.interviews}</td>
          <td>${company.offers}</td>
          <td>${company.interviewRate.toFixed(1)}%</td>
          <td>${company.offerRate.toFixed(1)}%</td>
        </tr>
      `
    })
    
    htmlContent += `
          </tbody>
        </table>
      </div>
    `
  }

  // Insights
  if (sections.includes('insights') && analytics.insights) {
    htmlContent += `
      <div class="section">
        <h2>Key Insights</h2>
    `
    
    analytics.insights.forEach((insight: any) => {
      htmlContent += `
        <div class="insight">
          <h4>${insight.title}</h4>
          <p>${insight.description}</p>
          <small>Impact: ${insight.impact}</small>
        </div>
      `
    })
    
    htmlContent += `</div>`
  }

  // Recommendations
  if (sections.includes('recommendations') && analytics.recommendations) {
    htmlContent += `
      <div class="section">
        <h2>Recommendations</h2>
    `
    
    analytics.recommendations.forEach((rec: any) => {
      htmlContent += `
        <div class="recommendation">
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
          <p><strong>Category:</strong> ${rec.category} | <strong>Priority:</strong> ${rec.priority}</p>
          ${rec.actions ? `
            <ul>
              ${rec.actions.map((action: string) => `<li>${action}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `
    })
    
    htmlContent += `</div>`
  }

  htmlContent += `
    </body>
    </html>
  `

  return {
    content: htmlContent,
    mimeType: 'text/html'
  }
}

function generateComprehensiveAnalytics(applications: any[]) {
  // This is a simplified version - in a real app, you'd call the dashboard analytics function
  const totalApplications = applications.length
  const interviewCount = applications.filter(app => 
    ['Interviewing', 'Offered', 'Accepted'].includes(app.status)
  ).length
  const offerCount = applications.filter(app => 
    ['Offered', 'Accepted'].includes(app.status)
  ).length
  const rejectionCount = applications.filter(app => app.status === 'Rejected').length

  return {
    overview: {
      totalApplications,
      interviewCount,
      offerCount,
      rejectionCount,
      interviewRate: totalApplications > 0 ? (interviewCount / totalApplications) * 100 : 0,
      offerRate: totalApplications > 0 ? (offerCount / totalApplications) * 100 : 0,
      avgResponseTime: 14 // Placeholder
    },
    insights: [
      {
        type: 'info',
        title: 'Application Summary',
        description: `You have submitted ${totalApplications} applications with ${interviewCount} leading to interviews.`,
        impact: 'medium'
      }
    ],
    recommendations: [
      {
        category: 'General',
        title: 'Continue Tracking',
        description: 'Keep tracking your applications to build more comprehensive analytics.',
        priority: 'medium'
      }
    ]
  }
}

function generateDefaultFilename(format: string) {
  const date = new Date().toISOString().split('T')[0]
  return `analytics-report-${date}.${format}`
}

function getExportHeaders(format: string, filename: string) {
  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${filename}"`
  }

  switch (format) {
    case 'json':
      headers['Content-Type'] = 'application/json'
      break
    case 'csv':
      headers['Content-Type'] = 'text/csv'
      break
    case 'pdf':
      headers['Content-Type'] = 'text/html' // Would be application/pdf with proper PDF generation
      break
  }

  return headers
}