import { NextRequest, NextResponse } from 'next/server'

// Location suggestions with standardized formats
const POPULAR_LOCATIONS = [
  // US Cities
  'San Francisco, CA, USA', 'New York, NY, USA', 'Seattle, WA, USA', 'Austin, TX, USA',
  'Los Angeles, CA, USA', 'Boston, MA, USA', 'Chicago, IL, USA', 'Denver, CO, USA',
  'Atlanta, GA, USA', 'Miami, FL, USA', 'Portland, OR, USA', 'Nashville, TN, USA',
  'Raleigh, NC, USA', 'Salt Lake City, UT, USA', 'Phoenix, AZ, USA', 'Dallas, TX, USA',
  
  // European Cities
  'London, UK', 'Berlin, Germany', 'Amsterdam, Netherlands', 'Stockholm, Sweden',
  'Copenhagen, Denmark', 'Oslo, Norway', 'Helsinki, Finland', 'Zurich, Switzerland',
  'Paris, France', 'Barcelona, Spain', 'Madrid, Spain', 'Milan, Italy', 'Rome, Italy',
  'Dublin, Ireland', 'Edinburgh, UK', 'Vienna, Austria', 'Prague, Czech Republic',
  
  // Canadian Cities
  'Toronto, ON, Canada', 'Vancouver, BC, Canada', 'Montreal, QC, Canada', 'Calgary, AB, Canada',
  
  // Asian Cities
  'Tokyo, Japan', 'Singapore', 'Hong Kong', 'Seoul, South Korea', 'Bangalore, India',
  'Mumbai, India', 'Delhi, India', 'Sydney, Australia', 'Melbourne, Australia',
  
  // Remote Options
  'Remote', 'Remote - US', 'Remote - Europe', 'Remote - Global', 'Hybrid', 'Remote-first'
]

// Location format standardization
const LOCATION_ALIASES: Record<string, string> = {
  'sf': 'San Francisco, CA, USA',
  'san francisco': 'San Francisco, CA, USA',
  'nyc': 'New York, NY, USA',
  'new york': 'New York, NY, USA',
  'la': 'Los Angeles, CA, USA',
  'los angeles': 'Los Angeles, CA, USA',
  'boston': 'Boston, MA, USA',
  'seattle': 'Seattle, WA, USA',
  'austin': 'Austin, TX, USA',
  'chicago': 'Chicago, IL, USA',
  'london': 'London, UK',
  'berlin': 'Berlin, Germany',
  'amsterdam': 'Amsterdam, Netherlands',
  'stockholm': 'Stockholm, Sweden',
  'copenhagen': 'Copenhagen, Denmark',
  'oslo': 'Oslo, Norway',
  'helsinki': 'Helsinki, Finland',
  'zurich': 'Zurich, Switzerland',
  'paris': 'Paris, France',
  'barcelona': 'Barcelona, Spain',
  'madrid': 'Madrid, Spain',
  'toronto': 'Toronto, ON, Canada',
  'vancouver': 'Vancouver, BC, Canada',
  'tokyo': 'Tokyo, Japan',
  'singapore': 'Singapore',
  'sydney': 'Sydney, Australia',
  'melbourne': 'Melbourne, Australia'
}

let locationCache: Set<string> = new Set(POPULAR_LOCATIONS)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({
        success: true,
        data: Array.from(locationCache).slice(0, limit)
      })
    }

    // Check for exact alias match first
    const standardized = LOCATION_ALIASES[query]
    if (standardized) {
      return NextResponse.json({
        success: true,
        data: [standardized, ...Array.from(locationCache)
          .filter(loc => loc.toLowerCase().includes(query) && loc !== standardized)
          .slice(0, limit - 1)]
      })
    }

    // Filter locations based on query
    const suggestions = Array.from(locationCache)
      .filter(location => location.toLowerCase().includes(query))
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        // Prioritize exact matches and starts-with matches
        if (aLower === query) return -1
        if (bLower === query) return 1
        if (aLower.startsWith(query)) return -1
        if (bLower.startsWith(query)) return 1
        
        // Prioritize remote options for remote queries
        if (query.includes('remote')) {
          if (a.toLowerCase().includes('remote') && !b.toLowerCase().includes('remote')) return -1
          if (!a.toLowerCase().includes('remote') && b.toLowerCase().includes('remote')) return 1
        }
        
        return a.localeCompare(b)
      })
      .slice(0, limit)

    return NextResponse.json({
      success: true,
      data: suggestions
    })
  } catch (error) {
    console.error('Error fetching location suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to fetch location suggestions'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()
    
    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Location is required'
          }
        },
        { status: 400 }
      )
    }

    // Add new location to cache
    locationCache.add(location.trim())

    return NextResponse.json({
      success: true,
      data: { message: 'Location added to suggestions' }
    })
  } catch (error) {
    console.error('Error adding location suggestion:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to add location suggestion'
        }
      },
      { status: 500 }
    )
  }
}