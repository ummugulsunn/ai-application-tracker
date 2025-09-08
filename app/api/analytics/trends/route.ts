import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Trends analytics request schema
const TrendsAnalyticsSchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d'),
  granularity: z.enum(['day', 'week', 'month']).default('day'),
  metrics: z.array(z.enum(['applications', 'interviews', 'offers', 'rejections', 'response_time'])).default(['applications']),
  groupBy: z.enum(['status', 'company', 'location', 'date']).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timeframe, granularity, metrics, groupBy } = TrendsAnalyticsSchema.parse(body)

    // Get applications from request body (in real app, this would come from database)
    const applications = body.applications || []

    // Calculate trend analytics
    const trends = calculateTrendAnalytics(applications, timeframe, granularity, metrics, groupBy)

    return NextResponse.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Trends analytics error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TRENDS_REQUEST',
            message: 'Invalid trends request data',
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
          code: 'TRENDS_CALCULATION_ERROR',
          message: 'Failed to calculate trends'
        }
      },
      { status: 500 }
    )
  }
}

function calculateTrendAnalytics(
  applications: any[], 
  timeframe: string, 
  granularity: string, 
  metrics: string[], 
  groupBy?: string
) {
  // Filter applications by timeframe
  const filteredApps = filterByTimeframe(applications, timeframe)

  // Generate time series data based on granularity
  const timeSeriesData = generateTimeSeriesData(filteredApps, granularity, metrics)

  // Calculate trend indicators
  const trendIndicators = calculateTrendIndicators(timeSeriesData, metrics)

  // Generate comparative analysis
  const comparativeAnalysis = generateComparativeAnalysis(filteredApps, timeframe)

  // Calculate seasonal patterns
  const seasonalPatterns = calculateSeasonalPatterns(applications)

  // Generate forecasting data
  const forecasting = generateForecastingData(timeSeriesData, metrics)

  return {
    timeSeriesData,
    trendIndicators,
    comparativeAnalysis,
    seasonalPatterns,
    forecasting,
    summary: generateTrendSummary(trendIndicators, comparativeAnalysis)
  }
}

function filterByTimeframe(applications: any[], timeframe: string) {
  const now = new Date()
  let startDate: Date

  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    case 'all':
    default:
      return applications
  }

  return applications.filter(app => new Date(app.appliedDate) >= startDate)
}

function generateTimeSeriesData(applications: any[], granularity: string, metrics: string[]) {
  const dataPoints = new Map()

  applications.forEach(app => {
    const date = new Date(app.appliedDate)
    let key: string

    switch (granularity) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!dataPoints.has(key)) {
      dataPoints.set(key, {
        date: key,
        applications: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
        response_time: []
      })
    }

    const point = dataPoints.get(key)
    point.applications++

    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      point.interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      point.offers++
    }
    if (app.status === 'Rejected') {
      point.rejections++
    }

    // Calculate response time if available
    if (app.responseDate && app.appliedDate) {
      const applied = new Date(app.appliedDate)
      const response = new Date(app.responseDate)
      const responseTime = Math.ceil((response.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24))
      point.response_time.push(responseTime)
    }
  })

  // Convert response times to averages
  const result = Array.from(dataPoints.values()).map(point => ({
    ...point,
    response_time: point.response_time.length > 0 
      ? point.response_time.reduce((sum: number, time: number) => sum + time, 0) / point.response_time.length
      : 0
  }))

  return result.sort((a, b) => a.date.localeCompare(b.date))
}

function calculateTrendIndicators(timeSeriesData: any[], metrics: string[]) {
  const indicators: any = {}

  metrics.forEach(metric => {
    const values = timeSeriesData.map(point => point[metric] || 0)
    
    if (values.length < 2) {
      indicators[metric] = {
        trend: 'insufficient_data',
        change: 0,
        changePercent: 0,
        direction: 'stable'
      }
      return
    }

    // Calculate trend using simple linear regression
    const n = values.length
    const xSum = (n * (n - 1)) / 2
    const ySum = values.reduce((sum, val) => sum + val, 0)
    const xySum = values.reduce((sum, val, index) => sum + (val * index), 0)
    const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
    
    // Calculate change from first to last period
    const firstValue = values[0]
    const lastValue = values[values.length - 1]
    const change = lastValue - firstValue
    const changePercent = firstValue > 0 ? (change / firstValue) * 100 : 0

    // Determine trend direction
    let direction: string
    if (Math.abs(slope) < 0.1) {
      direction = 'stable'
    } else if (slope > 0) {
      direction = 'increasing'
    } else {
      direction = 'decreasing'
    }

    indicators[metric] = {
      trend: direction,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      direction,
      slope: Math.round(slope * 1000) / 1000,
      correlation: calculateCorrelation(values)
    }
  })

  return indicators
}

function calculateCorrelation(values: number[]) {
  if (values.length < 2) return 0

  const n = values.length
  const indices = Array.from({ length: n }, (_, i) => i)
  
  const meanX = indices.reduce((sum, val) => sum + val, 0) / n
  const meanY = values.reduce((sum, val) => sum + val, 0) / n

  const numerator = indices.reduce((sum, x, i) => {
    return sum + (x - meanX) * (values[i] - meanY)
  }, 0)

  const denominatorX = Math.sqrt(indices.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0))
  const denominatorY = Math.sqrt(values.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0))

  if (denominatorX === 0 || denominatorY === 0) return 0

  return numerator / (denominatorX * denominatorY)
}

function generateComparativeAnalysis(applications: any[], timeframe: string) {
  const currentPeriod = applications
  
  // Calculate previous period for comparison
  const now = new Date()
  let previousStartDate: Date
  let previousEndDate: Date

  switch (timeframe) {
    case '7d':
      previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      previousEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      previousEndDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      previousEndDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
      break
    default:
      // For 'all', compare with first half vs second half
      const allApps = applications.sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime())
      const midPoint = Math.floor(allApps.length / 2)
      const firstHalf = allApps.slice(0, midPoint)
      const secondHalf = allApps.slice(midPoint)
      
      return {
        current: calculatePeriodStats(secondHalf),
        previous: calculatePeriodStats(firstHalf),
        comparison: comparePeriodsStats(calculatePeriodStats(secondHalf), calculatePeriodStats(firstHalf))
      }
  }

  const previousPeriod = applications.filter(app => {
    const appDate = new Date(app.appliedDate)
    return appDate >= previousStartDate && appDate < previousEndDate
  })

  const currentStats = calculatePeriodStats(currentPeriod)
  const previousStats = calculatePeriodStats(previousPeriod)

  return {
    current: currentStats,
    previous: previousStats,
    comparison: comparePeriodsStats(currentStats, previousStats)
  }
}

function calculatePeriodStats(applications: any[]) {
  const total = applications.length
  const interviews = applications.filter(app => 
    ['Interviewing', 'Offered', 'Accepted'].includes(app.status)
  ).length
  const offers = applications.filter(app => 
    ['Offered', 'Accepted'].includes(app.status)
  ).length
  const rejections = applications.filter(app => app.status === 'Rejected').length

  return {
    applications: total,
    interviews,
    offers,
    rejections,
    interviewRate: total > 0 ? (interviews / total) * 100 : 0,
    offerRate: total > 0 ? (offers / total) * 100 : 0,
    rejectionRate: total > 0 ? (rejections / total) * 100 : 0
  }
}

function comparePeriodsStats(current: any, previous: any) {
  const comparison: any = {}

  Object.keys(current).forEach(key => {
    const currentValue = current[key]
    const previousValue = previous[key]
    
    if (typeof currentValue === 'number' && typeof previousValue === 'number') {
      const change = currentValue - previousValue
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0
      
      comparison[key] = {
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      }
    }
  })

  return comparison
}

function calculateSeasonalPatterns(applications: any[]) {
  const monthlyData = new Array(12).fill(0).map((_, index) => ({
    month: new Date(2024, index, 1).toLocaleDateString('en-US', { month: 'long' }),
    applications: 0,
    interviews: 0,
    offers: 0,
    avgResponseTime: 0,
    responseTimes: []
  }))

  const weeklyData = new Array(7).fill(0).map((_, index) => ({
    day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index],
    applications: 0,
    interviews: 0,
    offers: 0
  }))

  applications.forEach(app => {
    const date = new Date(app.appliedDate)
    const month = date.getMonth()
    const dayOfWeek = date.getDay()

    // Monthly patterns
    monthlyData[month].applications++
    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      monthlyData[month].interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      monthlyData[month].offers++
    }

    if (app.responseDate) {
      const responseTime = Math.ceil((new Date(app.responseDate).getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
      monthlyData[month].responseTimes.push(responseTime)
    }

    // Weekly patterns
    weeklyData[dayOfWeek].applications++
    if (['Interviewing', 'Offered', 'Accepted'].includes(app.status)) {
      weeklyData[dayOfWeek].interviews++
    }
    if (['Offered', 'Accepted'].includes(app.status)) {
      weeklyData[dayOfWeek].offers++
    }
  })

  // Calculate average response times
  monthlyData.forEach(month => {
    month.avgResponseTime = month.responseTimes.length > 0
      ? month.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / month.responseTimes.length
      : 0
    delete month.responseTimes
  })

  return {
    monthly: monthlyData,
    weekly: weeklyData,
    insights: generateSeasonalInsights(monthlyData, weeklyData)
  }
}

function generateSeasonalInsights(monthlyData: any[], weeklyData: any[]) {
  const insights = []

  // Find best performing months
  const bestMonth = monthlyData.reduce((best, current) => 
    current.applications > best.applications ? current : best
  )
  
  const bestDay = weeklyData.reduce((best, current) => 
    current.applications > best.applications ? current : best
  )

  insights.push({
    type: 'seasonal',
    title: 'Peak Application Months',
    description: `${bestMonth.month} is your most active month with ${bestMonth.applications} applications`,
    recommendation: 'Consider increasing activity during historically slower months'
  })

  insights.push({
    type: 'weekly',
    title: 'Best Application Days',
    description: `${bestDay.day} is your most active day with ${bestDay.applications} applications`,
    recommendation: 'Maintain consistent application activity throughout the week'
  })

  return insights
}

function generateForecastingData(timeSeriesData: any[], metrics: string[]) {
  const forecasts: any = {}

  metrics.forEach(metric => {
    const values = timeSeriesData.map(point => point[metric] || 0)
    
    if (values.length < 3) {
      forecasts[metric] = {
        nextPeriod: 0,
        confidence: 'low',
        trend: 'insufficient_data'
      }
      return
    }

    // Simple moving average forecast
    const recentValues = values.slice(-3)
    const forecast = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length

    // Calculate trend
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const trendDirection = secondAvg > firstAvg ? 'increasing' : 
                          secondAvg < firstAvg ? 'decreasing' : 'stable'

    forecasts[metric] = {
      nextPeriod: Math.round(forecast * 100) / 100,
      confidence: values.length > 10 ? 'high' : values.length > 5 ? 'medium' : 'low',
      trend: trendDirection,
      range: {
        min: Math.round(forecast * 0.8 * 100) / 100,
        max: Math.round(forecast * 1.2 * 100) / 100
      }
    }
  })

  return forecasts
}

function generateTrendSummary(trendIndicators: any, comparativeAnalysis: any) {
  const summary = {
    overallTrend: 'stable',
    keyInsights: [],
    recommendations: []
  }

  // Determine overall trend
  const applicationsTrend = trendIndicators.applications?.direction || 'stable'
  const interviewsTrend = trendIndicators.interviews?.direction || 'stable'
  
  if (applicationsTrend === 'increasing' && interviewsTrend === 'increasing') {
    summary.overallTrend = 'positive'
  } else if (applicationsTrend === 'decreasing' || interviewsTrend === 'decreasing') {
    summary.overallTrend = 'concerning'
  }

  // Generate key insights
  if (trendIndicators.applications?.changePercent > 20) {
    summary.keyInsights.push(`Application volume ${trendIndicators.applications.direction} by ${Math.abs(trendIndicators.applications.changePercent).toFixed(1)}%`)
  }

  if (trendIndicators.interviews?.changePercent > 15) {
    summary.keyInsights.push(`Interview rate ${trendIndicators.interviews.direction} by ${Math.abs(trendIndicators.interviews.changePercent).toFixed(1)}%`)
  }

  // Generate recommendations
  if (summary.overallTrend === 'concerning') {
    summary.recommendations.push('Consider reviewing and adjusting your application strategy')
    summary.recommendations.push('Focus on quality over quantity in applications')
  } else if (summary.overallTrend === 'positive') {
    summary.recommendations.push('Continue with your current successful approach')
    summary.recommendations.push('Consider scaling up your application volume')
  }

  return summary
}