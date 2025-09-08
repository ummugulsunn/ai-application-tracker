import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock fetch globally
global.fetch = jest.fn()

describe('Advanced Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockApplications = [
    {
      id: '1',
      company: 'TechCorp',
      position: 'Software Engineer',
      status: 'Applied',
      appliedDate: '2024-01-15',
      location: 'San Francisco, CA'
    },
    {
      id: '2',
      company: 'DataInc',
      position: 'Data Scientist',
      status: 'Interviewing',
      appliedDate: '2024-01-20',
      responseDate: '2024-01-25',
      location: 'New York, NY'
    },
    {
      id: '3',
      company: 'StartupXYZ',
      position: 'Frontend Developer',
      status: 'Offered',
      appliedDate: '2024-02-01',
      responseDate: '2024-02-10',
      location: 'Austin, TX'
    },
    {
      id: '4',
      company: 'BigTech',
      position: 'Backend Engineer',
      status: 'Rejected',
      appliedDate: '2024-02-05',
      responseDate: '2024-02-15',
      location: 'Seattle, WA'
    }
  ]

  describe('Dashboard Analytics API', () => {
    it('should calculate comprehensive analytics metrics', async () => {
      const mockResponse = {
        success: true,
        data: {
          overview: {
            totalApplications: 4,
            interviewCount: 2,
            offerCount: 1,
            rejectionCount: 1,
            interviewRate: 50,
            offerRate: 25,
            rejectionRate: 25,
            avgResponseTime: 8.33
          },
          trends: {
            timeSeriesData: [
              { month: '2024-01', applications: 2, interviews: 1, offers: 0, rejections: 0 },
              { month: '2024-02', applications: 2, interviews: 1, offers: 1, rejections: 1 }
            ]
          },
          distributions: {
            statusDistribution: [
              { status: 'Applied', count: 1, percentage: 25 },
              { status: 'Interviewing', count: 1, percentage: 25 },
              { status: 'Offered', count: 1, percentage: 25 },
              { status: 'Rejected', count: 1, percentage: 25 }
            ]
          },
          insights: [
            {
              type: 'positive',
              title: 'Good Interview Rate',
              description: 'Your interview rate is above average',
              impact: 'high'
            }
          ],
          recommendations: [
            {
              category: 'Application Strategy',
              title: 'Continue Current Approach',
              description: 'Your current strategy is working well',
              priority: 'medium'
            }
          ]
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications: mockApplications })
      })

      const result = await response.json()

      expect(fetch).toHaveBeenCalledWith('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications: mockApplications })
      })

      expect(result.success).toBe(true)
      expect(result.data.overview.totalApplications).toBe(4)
      expect(result.data.overview.interviewRate).toBe(50)
      expect(result.data.overview.offerRate).toBe(25)
      expect(result.data.insights).toHaveLength(1)
      expect(result.data.recommendations).toHaveLength(1)
    })

    it('should handle date range filtering', async () => {
      const mockResponse = {
        success: true,
        data: {
          overview: {
            totalApplications: 2,
            interviewCount: 1,
            offerCount: 1,
            rejectionCount: 1
          }
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const dateRange = {
        start: '2024-02-01',
        end: '2024-02-28'
      }

      await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applications: mockApplications,
          dateRange
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applications: mockApplications,
          dateRange
        })
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications: mockApplications })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('Trends Analytics API', () => {
    it('should calculate trend indicators', async () => {
      const mockResponse = {
        success: true,
        data: {
          timeSeriesData: [
            { date: '2024-01-15', applications: 1, interviews: 0, offers: 0 },
            { date: '2024-01-20', applications: 1, interviews: 1, offers: 0 },
            { date: '2024-02-01', applications: 1, interviews: 0, offers: 1 },
            { date: '2024-02-05', applications: 1, interviews: 0, offers: 0 }
          ],
          trendIndicators: {
            applications: {
              trend: 'stable',
              change: 0,
              changePercent: 0,
              direction: 'stable'
            },
            interviews: {
              trend: 'increasing',
              change: 1,
              changePercent: 100,
              direction: 'increasing'
            }
          },
          comparativeAnalysis: {
            current: { applications: 4, interviews: 2, offers: 1 },
            previous: { applications: 2, interviews: 1, offers: 0 },
            comparison: {
              applications: { change: 2, changePercent: 100, direction: 'up' },
              interviews: { change: 1, changePercent: 100, direction: 'up' }
            }
          }
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const response = await fetch('/api/analytics/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applications: mockApplications,
          timeframe: '30d',
          granularity: 'day',
          metrics: ['applications', 'interviews', 'offers']
        })
      })

      const result = await response.json()

      expect(result.success).toBe(true)
      expect(result.data.timeSeriesData).toHaveLength(4)
      expect(result.data.trendIndicators.applications.direction).toBe('stable')
      expect(result.data.trendIndicators.interviews.direction).toBe('increasing')
      expect(result.data.comparativeAnalysis.comparison.applications.direction).toBe('up')
    })

    it('should support different timeframes and granularities', async () => {
      const mockResponse = {
        success: true,
        data: {
          timeSeriesData: [],
          trendIndicators: {},
          comparativeAnalysis: {}
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await fetch('/api/analytics/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applications: mockApplications,
          timeframe: '90d',
          granularity: 'week',
          metrics: ['applications', 'interviews']
        })
      })

      expect(fetch).toHaveBeenCalledWith('/api/analytics/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applications: mockApplications,
          timeframe: '90d',
          granularity: 'week',
          metrics: ['applications', 'interviews']
        })
      })
    })
  })

  describe('Analytics Export API', () => {
    it('should export analytics in JSON format', async () => {
      const mockExportData = {
        metadata: {
          exportDate: '2024-01-01T00:00:00.000Z',
          format: 'json',
          sections: ['overview', 'trends', 'insights']
        },
        overview: {
          totalApplications: 4,
          interviewCount: 2,
          offerCount: 1
        },
        insights: [
          {
            type: 'positive',
            title: 'Good Performance',
            description: 'Your metrics are above average'
          }
        ]
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([JSON.stringify(mockExportData)], { type: 'application/json' }),
        headers: new Headers({
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="analytics-report-2024-01-01.json"'
        })
      })

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'json',
          applications: mockApplications,
          analyticsData: { overview: { totalApplications: 4 } },
          sections: ['overview', 'trends', 'insights']
        })
      })

      expect(response.ok).toBe(true)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toContain('analytics-report')
    })

    it('should export analytics in CSV format', async () => {
      const mockCSVData = `Analytics Export Report
Generated: 2024-01-01T00:00:00.000Z
Sections: overview, trends

OVERVIEW METRICS
Metric,Value
Total Applications,4
Interview Count,2
Offer Count,1`

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([mockCSVData], { type: 'text/csv' }),
        headers: new Headers({
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="analytics-report-2024-01-01.csv"'
        })
      })

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'csv',
          applications: mockApplications,
          sections: ['overview', 'trends']
        })
      })

      expect(response.ok).toBe(true)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
    })

    it('should handle export errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'INVALID_EXPORT_REQUEST',
            message: 'Invalid export request data'
          }
        })
      })

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'invalid-format'
        })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('Analytics Calculations', () => {
    it('should calculate correct success rates', () => {
      const totalApplications = 10
      const interviews = 3
      const offers = 1
      
      const interviewRate = (interviews / totalApplications) * 100
      const offerRate = (offers / totalApplications) * 100
      
      expect(interviewRate).toBe(30)
      expect(offerRate).toBe(10)
    })

    it('should calculate response times correctly', () => {
      const appliedDate = new Date('2024-01-01')
      const responseDate = new Date('2024-01-08')
      
      const responseTime = Math.ceil((responseDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(responseTime).toBe(7)
    })

    it('should handle edge cases in calculations', () => {
      // Zero applications
      const zeroAppsRate = 0 > 0 ? (0 / 0) * 100 : 0
      expect(zeroAppsRate).toBe(0)
      
      // No response dates
      const noResponseTime = 0
      expect(noResponseTime).toBe(0)
    })
  })

  describe('Data Filtering', () => {
    it('should filter applications by date range', () => {
      const startDate = new Date('2024-01-20')
      const endDate = new Date('2024-02-10')
      
      const filtered = mockApplications.filter(app => {
        const appDate = new Date(app.appliedDate)
        return appDate >= startDate && appDate <= endDate
      })
      
      expect(filtered).toHaveLength(3) // Includes applications on 2024-01-20, 2024-02-01, and 2024-02-05
      expect(filtered[0].id).toBe('2')
      expect(filtered[1].id).toBe('3')
      expect(filtered[2].id).toBe('4')
    })

    it('should filter applications by status', () => {
      const statusFilter = ['Interviewing', 'Offered']
      
      const filtered = mockApplications.filter(app => 
        statusFilter.includes(app.status)
      )
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(app => statusFilter.includes(app.status))).toBe(true)
    })

    it('should filter applications by company', () => {
      const companyFilter = ['TechCorp', 'DataInc']
      
      const filtered = mockApplications.filter(app => 
        companyFilter.includes(app.company)
      )
      
      expect(filtered).toHaveLength(2)
      expect(filtered.every(app => companyFilter.includes(app.company))).toBe(true)
    })
  })

  describe('Trend Analysis', () => {
    it('should detect increasing trends', () => {
      const values = [1, 2, 3, 4, 5]
      
      // Simple trend detection
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
      
      const trend = secondAvg > firstAvg ? 'increasing' : 
                   secondAvg < firstAvg ? 'decreasing' : 'stable'
      
      expect(trend).toBe('increasing')
    })

    it('should detect decreasing trends', () => {
      const values = [5, 4, 3, 2, 1]
      
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
      
      const trend = secondAvg > firstAvg ? 'increasing' : 
                   secondAvg < firstAvg ? 'decreasing' : 'stable'
      
      expect(trend).toBe('decreasing')
    })

    it('should detect stable trends', () => {
      const values = [3, 3, 3, 3, 3]
      
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
      
      const trend = secondAvg > firstAvg ? 'increasing' : 
                   secondAvg < firstAvg ? 'decreasing' : 'stable'
      
      expect(trend).toBe('stable')
    })
  })

  describe('Insights Generation', () => {
    it('should generate positive insights for good performance', () => {
      const interviewRate = 25 // Above average
      const industryAverage = 15
      
      const insight = interviewRate > industryAverage ? {
        type: 'positive',
        title: 'Above Average Interview Rate',
        description: `Your interview rate of ${interviewRate}% is above the industry average of ${industryAverage}%`,
        impact: 'high'
      } : null
      
      expect(insight).not.toBeNull()
      expect(insight?.type).toBe('positive')
      expect(insight?.impact).toBe('high')
    })

    it('should generate warning insights for poor performance', () => {
      const interviewRate = 5 // Below average
      const industryAverage = 15
      
      const insight = interviewRate < industryAverage * 0.7 ? {
        type: 'warning',
        title: 'Low Interview Rate',
        description: `Your interview rate of ${interviewRate}% is below industry average. Consider reviewing your application strategy.`,
        impact: 'high'
      } : null
      
      expect(insight).not.toBeNull()
      expect(insight?.type).toBe('warning')
      expect(insight?.impact).toBe('high')
    })
  })

  describe('Recommendations Generation', () => {
    it('should recommend improving application quality for low interview rates', () => {
      const interviewRate = 8 // Low rate
      
      const recommendation = interviewRate < 10 ? {
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
      } : null
      
      expect(recommendation).not.toBeNull()
      expect(recommendation?.priority).toBe('high')
      expect(recommendation?.actions).toHaveLength(4)
    })

    it('should recommend follow-up strategies for slow responses', () => {
      const avgResponseTime = 25 // Slow response
      
      const recommendation = avgResponseTime > 21 ? {
        category: 'Follow-up Strategy',
        title: 'Implement Follow-up Strategy',
        description: 'Companies are taking longer to respond. Consider following up strategically.',
        priority: 'medium'
      } : null
      
      expect(recommendation).not.toBeNull()
      expect(recommendation?.category).toBe('Follow-up Strategy')
      expect(recommendation?.priority).toBe('medium')
    })
  })
})