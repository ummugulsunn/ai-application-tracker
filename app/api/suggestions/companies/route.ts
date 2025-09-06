import { NextRequest, NextResponse } from 'next/server'

// Company suggestions with caching
const POPULAR_COMPANIES = [
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'Tesla', 'Spotify',
  'Uber', 'Airbnb', 'Stripe', 'Shopify', 'Slack', 'Zoom', 'Dropbox', 'Adobe',
  'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'AMD', 'Cisco', 'VMware',
  'ServiceNow', 'Workday', 'Atlassian', 'GitHub', 'GitLab', 'Docker', 'MongoDB',
  'Snowflake', 'Databricks', 'Palantir', 'Twilio', 'Square', 'PayPal', 'Coinbase',
  'Robinhood', 'DoorDash', 'Instacart', 'Lyft', 'Pinterest', 'Snapchat', 'Twitter',
  'LinkedIn', 'Reddit', 'Discord', 'Figma', 'Notion', 'Airtable', 'Canva'
]

// In-memory cache for company suggestions
let companyCache: Set<string> = new Set(POPULAR_COMPANIES)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({
        success: true,
        data: Array.from(companyCache).slice(0, limit)
      })
    }

    // Filter companies based on query
    const suggestions = Array.from(companyCache)
      .filter(company => company.toLowerCase().includes(query))
      .sort((a, b) => {
        // Prioritize exact matches and starts-with matches
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        if (aLower === query) return -1
        if (bLower === query) return 1
        if (aLower.startsWith(query)) return -1
        if (bLower.startsWith(query)) return 1
        
        return a.localeCompare(b)
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Error fetching company suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to fetch company suggestions'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { company } = await request.json()
    
    if (!company || typeof company !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Company name is required'
          }
        },
        { status: 400 }
      )
    }

    // Add new company to cache
    companyCache.add(company.trim())

    return NextResponse.json({
      success: true,
      data: { message: 'Company added to suggestions' }
    })
  } catch (error) {
    console.error('Error adding company suggestion:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to add company suggestion'
        }
      },
      { status: 500 }
    )
  }
}