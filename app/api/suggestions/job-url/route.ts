import { NextRequest, NextResponse } from 'next/server'

// Job URL parsing for automatic field population
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Job URL is required'
          }
        },
        { status: 400 }
      )
    }

    // Parse the URL to extract information
    const parsedData = await parseJobUrl(url)

    return NextResponse.json({
      success: true,
      data: parsedData
    })
  } catch (error) {
    console.error('Error parsing job URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PARSING_ERROR',
          message: 'Failed to parse job URL'
        }
      },
      { status: 500 }
    )
  }
}

async function parseJobUrl(url: string): Promise<{
  company?: string
  position?: string
  location?: string
  jobDescription?: string
  requirements?: string[]
  companyWebsite?: string
  source: string
}> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname
    const searchParams = urlObj.searchParams

    // Initialize result object
    const result: any = {
      source: hostname,
      companyWebsite: `https://${hostname}`
    }

    // LinkedIn job parsing
    if (hostname.includes('linkedin.com')) {
      result.source = 'LinkedIn'
      
      // Extract job ID from LinkedIn URL patterns
      const jobIdMatch = pathname.match(/\/jobs\/view\/(\d+)/) || searchParams.get('currentJobId')
      if (jobIdMatch) {
        // In a real implementation, you would fetch job details from LinkedIn API
        // For now, we'll extract what we can from the URL structure
        result.company = extractCompanyFromLinkedInUrl(url)
        result.position = extractPositionFromLinkedInUrl(url)
      }
    }
    
    // Indeed job parsing
    else if (hostname.includes('indeed.com')) {
      result.source = 'Indeed'
      
      // Extract job key from Indeed URL
      const jobKey = searchParams.get('jk')
      if (jobKey) {
        // Extract company and position from URL parameters or path
        result.company = searchParams.get('cmp') || extractCompanyFromIndeedUrl(url)
        result.position = extractPositionFromIndeedUrl(url)
      }
    }
    
    // Glassdoor job parsing
    else if (hostname.includes('glassdoor.com')) {
      result.source = 'Glassdoor'
      
      // Extract job details from Glassdoor URL structure
      const jobMatch = pathname.match(/\/job-listing\/(.+?)\/(\d+)/)
      if (jobMatch && jobMatch[1]) {
        const jobSlug = jobMatch[1]
        result.position = jobSlug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    }
    
    // AngelList/Wellfound job parsing
    else if (hostname.includes('angel.co') || hostname.includes('wellfound.com')) {
      result.source = 'Wellfound'
      
      // Extract startup and role information
      const pathParts = pathname.split('/')
      if (pathParts.includes('jobs')) {
        const jobIndex = pathParts.indexOf('jobs')
        const companySlug = pathParts[jobIndex + 1]
        if (companySlug) {
          result.company = companySlug.replace(/-/g, ' ')
            .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        }
      }
    }
    
    // Company career pages
    else {
      result.source = 'Company Website'
      
      // Try to extract company name from domain
      const domainParts = hostname.split('.')
      if (domainParts.length >= 2) {
        const companyName = domainParts[domainParts.length - 2]
        if (companyName) {
          result.company = companyName.charAt(0).toUpperCase() + companyName.slice(1)
        }
      }
      
      // Try to extract position from URL path
      if (pathname.includes('job') || pathname.includes('career')) {
        result.position = extractPositionFromGenericUrl(pathname)
      }
    }

    // Clean up extracted data
    if (result.company) {
      result.company = cleanCompanyName(result.company)
    }
    
    if (result.position) {
      result.position = cleanPositionTitle(result.position)
    }

    return result
  } catch (error) {
    console.error('Error in parseJobUrl:', error)
    return {
      source: 'Unknown',
      companyWebsite: url
    }
  }
}

function extractCompanyFromLinkedInUrl(url: string): string | undefined {
  // LinkedIn URLs sometimes contain company information in the path or parameters
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  
  // Look for company slug in the URL
  const companyMatch = pathname.match(/\/company\/([^\/]+)/)
  if (companyMatch && companyMatch[1]) {
    return companyMatch[1].replace(/-/g, ' ')
      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
  
  return undefined
}

function extractPositionFromLinkedInUrl(url: string): string | undefined {
  // Extract position information from LinkedIn job URLs
  const urlObj = new URL(url)
  const searchParams = urlObj.searchParams
  
  // Check for position in search parameters
  const keywords = searchParams.get('keywords')
  if (keywords) {
    return cleanPositionTitle(keywords)
  }
  
  return undefined
}

function extractCompanyFromIndeedUrl(url: string): string | undefined {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  
  // Indeed sometimes includes company in the path
  const companyMatch = pathname.match(/\/cmp\/([^\/]+)/)
  if (companyMatch && companyMatch[1]) {
    return companyMatch[1].replace(/-/g, ' ')
      .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }
  
  return undefined
}

function extractPositionFromIndeedUrl(url: string): string | undefined {
  const urlObj = new URL(url)
  const searchParams = urlObj.searchParams
  
  // Check for position in search parameters
  const query = searchParams.get('q')
  if (query) {
    return cleanPositionTitle(query)
  }
  
  return undefined
}

function extractPositionFromGenericUrl(pathname: string): string | undefined {
  // Try to extract position title from generic career page URLs
  const pathParts = pathname.split('/').filter(part => part.length > 0)
  
  // Look for job-related segments
  for (let i = 0; i < pathParts.length; i++) {
    const pathPart = pathParts[i]
    if (pathPart) {
      const part = pathPart.toLowerCase()
      if (part.includes('job') || part.includes('career') || part.includes('position')) {
        // The next part might be the job title
        if (i + 1 < pathParts.length) {
          const jobTitle = pathParts[i + 1]
          if (jobTitle) {
            return cleanPositionTitle(jobTitle.replace(/-/g, ' '))
          }
        }
      }
    }
  }
  
  return undefined
}

function cleanCompanyName(company: string): string {
  return company
    .replace(/[-_]/g, ' ')
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b/gi, '')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function cleanPositionTitle(position: string): string {
  return position
    .replace(/[-_]/g, ' ')
    .replace(/\b(job|position|role|opening)\b/gi, '')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}