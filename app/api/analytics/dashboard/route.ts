import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Dashboard analytics request schema
const DashboardAnalyticsSchema = z.object({
  dateRange: z.object({
    start: z.string().optional(),
    end: z.string().optional()
  }).optional(),
  filters: z.object({
    status: z.array(z.string()).optional(),
    companies: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dateRange, filters } = DashboardAnalyticsSchema.parse(body)

    // Get applications from request body (in real app, this would come from database)
    const applications = body.applications || []

    // Calculate advanced analytics
    const analytics = calculateAdvancedAnalytics(applications, dateRange, filters)

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dashboard analytics error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ANALYTICS_REQUEST',
            message: 'Invalid analytics request data',
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
          code: 'ANALYTICS_CALCULATION_ERROR',
          message: 'Failed to calculate analytics'
        }
      },
      { status: 500 }
    )
  }
}

function calculateAdvancedAnalytics(applications: Record<string, unknown>[], dateRange?: Record<string, unknown>, filters?: Record<string, unknown>) {
  // Filter applications based on date range and filters
  let filteredApps = applications

  if (dateRange?.start || dateRange?.end) {
    filteredApps = filteredApps.filter(app => {
      const appDate = new Date(app.appliedDate)
      const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01')
      const end = dateRange.end ? new Date(dateRange.end) : new Date()
      return appDate >= start && appDate <= end
    })
  }

  if (filters?.status?.length) {
    filteredApps = filteredApps.filter(app => filters.status.includes(app.status))
  }

  if (filters?.companies?.length) {
    filteredApps = filteredApps.filter(app => filters.companies.includes(app.company))
  }

  if (filters?.locations?.length) {
    filteredApps = filteredApps.filter(app => filters.locations.includes(app.location))
  }

  // Calculate metrics
  const totalApplications = filteredApps.length
  const interviewCount = filteredApps.filter(app => 
    ['Interviewing', 'Offered', 'Accepted'].includes(app.status)
  ).length
  const offerCount = filteredApps.filter(app => 
    ['Offered', 'Accepted'].includes(app.status)
  ).length
  const rejectionCount = filteredApps.filter(app => app.status === 'Rejected').length

  // Calculate rates
  const interviewRate = totalApplications > 0 ? (interviewCount / totalApplications) * 100 : 0
  const offerRate = totalApplications > 0 ? (offerCount / totalApplications) * 100 : 0
  const rejectionRate = totalApplications > 0 ? (rejectionCount / totalApplications) * 100 : 0

  // Calculate response times
  const responseTimes = filteredApps
    .filter(app => app.responseDate && app.appliedDate)
    .map(app => {
      const applied = new Date(app.appliedDate)
      const response = new Date(app.responseDate)
      return Math.ceil((response.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
    })

  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0

  // Time series data for trends
  const timeSeriesData = generateTimeSeriesData(filteredApps)

  // Status distribution
  const statusDistribution = calculateStatusDistribution(filteredApps)

  // Company performance
  const companyPerformance = calculateCompanyPerformance(filteredApps)

  // Location analysis
  const locationAnalysis = calculateLocationAnalysis(filteredApps)

  // Industry benchmarks (mock data - in real app, this would come from aggregated data)
  const industryBenchmarks = {
    averageInterviewRate: 15,
    averageOfferRate: 5,
    averageResponseTime: 14,
    topPerformingIndustries: ['Technology', 'Healthcare', 'Finance'],
    marketTrends: {
      hiring: 'increasing',
      competition: 'moderate',
      salaryTrends: 'stable'
    }
  }

  return {
    overview: {
      totalApplications,
      interviewCount,
      offerCount,
      rejectionCount,
      interviewRate: Math.round(interviewRate * 100) / 100,
      offerRate: Math.round(offerRate * 100) / 100,
      rejectionRate: Math.round(rejectionRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100
    },
    trends: {
      timeSeriesData,
      monthlyStats: calculateMonthlyStats(filteredApps),
      weeklyActivity: calculateWeeklyActivity(filteredApps)
    },
    distributions: {
      statusDistribution,
      companyPerformance,
      locationAnalysis
    },
    benchmarks: industryBenchmarks,
    insights: generateInsights(filteredApps, {
      interviewRate,
      offerRate,
      avgResponseTime,
      industryBenchmarks
    }),
    recommendations: generateRecommendations(filteredApps, {
      interviewRate,
      offerRate,
      avgResponseTime
    })
  }
}

function generateTimeSeriesData(applications: Record<string, unknown>[]) {
  const monthlyData = new Map()

  applications.forEach(app => {
    const date = new Date(app.appliedDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        month: monthKey,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejections: 0
      })
    }

    const monthData = monthlyData.get(monthKey)
    monthData.applications++

    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      monthData.interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      monthData.offers++
    }
    if (app.status === 'Rejected') {
      monthData.rejections++
    }
  })

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month))
}

function calculateStatusDistribution(applications: Record<string, unknown>[]) {
  const distribution = new Map()
  
  applications.forEach(app => {
    const count = distribution.get(app.status) || 0
    distribution.set(app.status, count + 1)
  })

  return Array.from(distribution.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: Math.round((count / applications.length) * 100 * 100) / 100
  }))
}

function calculateCompanyPerformance(applications: Record<string, unknown>[]) {
  const companyStats = new Map()

  applications.forEach(app => {
    if (!companyStats.has(app.company)) {
      companyStats.set(app.company, {
        company: app.company,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejections: 0
      })
    }

    const stats = companyStats.get(app.company)
    stats.applications++

    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      stats.interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      stats.offers++
    }
    if (app.status === 'Rejected') {
      stats.rejections++
    }
  })

  return Array.from(companyStats.values())
    .map(stats => ({
      ...stats,
      interviewRate: stats.applications > 0 ? (stats.interviews / stats.applications) * 100 : 0,
      offerRate: stats.applications > 0 ? (stats.offers / stats.applications) * 100 : 0
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10) // Top 10 companies
}

function calculateLocationAnalysis(applications: Record<string, unknown>[]) {
  const locationStats = new Map()

  applications.forEach(app => {
    if (!app.location) return

    if (!locationStats.has(app.location)) {
      locationStats.set(app.location, {
        location: app.location,
        applications: 0,
        interviews: 0,
        offers: 0,
        avgSalary: 0,
        salaries: []
      })
    }

    const stats = locationStats.get(app.location)
    stats.applications++

    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      stats.interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      stats.offers++
    }

    // Extract salary if available
    if (app.salaryRange) {
      const salaryMatch = app.salaryRange.match(/\$?(\d+(?:,\d+)?(?:k|K)?)/g)
      if (salaryMatch) {
        const salary = parseInt(salaryMatch[0].replace(/[$,kK]/g, '')) * 
          (salaryMatch[0].toLowerCase().includes('k') ? 1000 : 1)
        stats.salaries.push(salary)
      }
    }
  })

  return Array.from(locationStats.values())
    .map(stats => ({
      ...stats,
      interviewRate: stats.applications > 0 ? (stats.interviews / stats.applications) * 100 : 0,
      offerRate: stats.applications > 0 ? (stats.offers / stats.applications) * 100 : 0,
      avgSalary: stats.salaries.length > 0 
        ? stats.salaries.reduce((sum: number, sal: number) => sum + sal, 0) / stats.salaries.length 
        : 0
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10) // Top 10 locations
}

function calculateMonthlyStats(applications: Record<string, unknown>[]) {
  const last12Months = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const monthApps = applications.filter(app => {
      const appDate = new Date(app.appliedDate)
      return appDate.getFullYear() === date.getFullYear() && 
             appDate.getMonth() === date.getMonth()
    })

    last12Months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      applications: monthApps.length,
      interviews: monthApps.filter(app => 
        ['Interviewing', 'Offered', 'Accepted'].includes(app.status)
      ).length,
      offers: monthApps.filter(app => 
        ['Offered', 'Accepted'].includes(app.status)
      ).length
    })
  }

  return last12Months
}

function calculateWeeklyActivity(applications: Record<string, unknown>[]) {
  const weeklyData = new Array(7).fill(0).map((_, index) => ({
    day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index],
    applications: 0
  }))

  applications.forEach(app => {
    const dayOfWeek = new Date(app.appliedDate as string).getDay()
    if (weeklyData[dayOfWeek]) {
      weeklyData[dayOfWeek].applications++
    }
  })

  return weeklyData
}

function generateInsights(applications: Record<string, unknown>[], metrics: Record<string, unknown>) {
  const insights = []

  // Performance insights
  if (metrics.interviewRate > metrics.industryBenchmarks.averageInterviewRate) {
    insights.push({
      type: 'positive',
      title: 'Above Average Interview Rate',
      description: `Your interview rate of ${metrics.interviewRate.toFixed(1)}% is above the industry average of ${metrics.industryBenchmarks.averageInterviewRate}%`,
      impact: 'high'
    })
  } else if (metrics.interviewRate < metrics.industryBenchmarks.averageInterviewRate * 0.7) {
    insights.push({
      type: 'warning',
      title: 'Low Interview Rate',
      description: `Your interview rate of ${metrics.interviewRate.toFixed(1)}% is below industry average. Consider reviewing your application strategy.`,
      impact: 'high'
    })
  }

  // Response time insights
  if (metrics.avgResponseTime > metrics.industryBenchmarks.averageResponseTime * 1.5) {
    insights.push({
      type: 'info',
      title: 'Longer Response Times',
      description: `Companies are taking ${metrics.avgResponseTime.toFixed(1)} days on average to respond, which is longer than typical.`,
      impact: 'medium'
    })
  }

  // Application volume insights
  const recentApps = applications.filter(app => {
    const appDate = new Date(app.appliedDate)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return appDate >= thirtyDaysAgo
  })

  if (recentApps.length < 5) {
    insights.push({
      type: 'suggestion',
      title: 'Increase Application Volume',
      description: 'Consider applying to more positions to increase your chances of success.',
      impact: 'medium'
    })
  }

  return insights
}

function generateRecommendations(applications: Record<string, unknown>[], metrics: Record<string, unknown>) {
  const recommendations = []

  // Interview rate recommendations
  if (metrics.interviewRate < 10) {
    recommendations.push({
      category: 'Application Strategy',
      title: 'Improve Application Quality',
      description: 'Focus on tailoring your resume and cover letter for each position',
      priority: 'high',
      actions: [
        'Customize your resume for each job application',
        'Write targeted cover letters',
        'Research companies before applying',
        'Ensure your skills match job requirements'
      ]
    })
  }

  // Response time recommendations
  if (metrics.avgResponseTime > 21) {
    recommendations.push({
      category: 'Follow-up Strategy',
      title: 'Implement Follow-up Strategy',
      description: 'Companies are taking longer to respond. Consider following up strategically.',
      priority: 'medium',
      actions: [
        'Send a polite follow-up email after 2 weeks',
        'Connect with hiring managers on LinkedIn',
        'Reach out to employees at target companies',
        'Consider applying to more responsive companies'
      ]
    })
  }

  // Diversification recommendations
  const uniqueCompanies = new Set(applications.map(app => app.company)).size
  if (applications.length > 10 && uniqueCompanies < applications.length * 0.7) {
    recommendations.push({
      category: 'Diversification',
      title: 'Diversify Your Applications',
      description: 'You\'re applying to the same companies multiple times. Consider expanding your search.',
      priority: 'medium',
      actions: [
        'Research new companies in your field',
        'Explore different industries',
        'Consider remote opportunities',
        'Look into startups and smaller companies'
      ]
    })
  }

  return recommendations
}