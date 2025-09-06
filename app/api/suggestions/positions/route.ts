import { NextRequest, NextResponse } from 'next/server'

// Job title suggestions with standardization
const STANDARD_POSITIONS = [
  // Software Engineering
  'Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Principal Software Engineer',
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer',
  'DevOps Engineer', 'Site Reliability Engineer', 'Platform Engineer', 'Cloud Engineer',
  'Software Architect', 'Technical Lead', 'Engineering Manager', 'VP of Engineering',
  
  // Data & Analytics
  'Data Scientist', 'Senior Data Scientist', 'Principal Data Scientist', 'Data Engineer',
  'Machine Learning Engineer', 'AI Engineer', 'Data Analyst', 'Business Intelligence Analyst',
  'Analytics Engineer', 'Research Scientist', 'Applied Scientist', 'Data Architect',
  
  // Product & Design
  'Product Manager', 'Senior Product Manager', 'Principal Product Manager', 'VP of Product',
  'UX Designer', 'UI Designer', 'Product Designer', 'UX Researcher', 'Design Lead',
  'Creative Director', 'Brand Designer', 'Graphic Designer', 'Motion Designer',
  
  // Marketing & Sales
  'Marketing Manager', 'Digital Marketing Manager', 'Content Marketing Manager', 'Growth Manager',
  'Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager',
  'Customer Success Manager', 'Marketing Director', 'VP of Marketing', 'VP of Sales',
  
  // Operations & Finance
  'Operations Manager', 'Program Manager', 'Project Manager', 'Scrum Master', 'Agile Coach',
  'Financial Analyst', 'Accountant', 'Finance Manager', 'Controller', 'CFO',
  'HR Manager', 'Recruiter', 'People Operations', 'Talent Acquisition',
  
  // Security & Compliance
  'Security Engineer', 'Information Security Analyst', 'Cybersecurity Specialist',
  'Compliance Manager', 'Risk Analyst', 'Security Architect', 'Penetration Tester',
  
  // Quality & Testing
  'QA Engineer', 'Test Engineer', 'Automation Engineer', 'QA Manager', 'Test Lead',
  
  // Internships & Entry Level
  'Software Engineering Intern', 'Data Science Intern', 'Product Management Intern',
  'Marketing Intern', 'Design Intern', 'Junior Developer', 'Associate Product Manager',
  'Graduate Software Engineer', 'New Grad Software Engineer'
]

// Position standardization mapping
const POSITION_ALIASES: Record<string, string> = {
  'swe': 'Software Engineer',
  'sde': 'Software Engineer',
  'software dev': 'Software Developer',
  'web developer': 'Frontend Developer',
  'frontend dev': 'Frontend Developer',
  'backend dev': 'Backend Developer',
  'fullstack': 'Full Stack Developer',
  'full-stack': 'Full Stack Developer',
  'ml engineer': 'Machine Learning Engineer',
  'ai engineer': 'AI Engineer',
  'data eng': 'Data Engineer',
  'pm': 'Product Manager',
  'tpm': 'Technical Program Manager',
  'ux/ui': 'UX/UI Designer',
  'ui/ux': 'UX/UI Designer',
  'devops': 'DevOps Engineer',
  'sre': 'Site Reliability Engineer',
  'qa': 'QA Engineer',
  'qe': 'QA Engineer'
}

let positionCache: Set<string> = new Set(STANDARD_POSITIONS)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({
        success: true,
        data: Array.from(positionCache).slice(0, limit)
      })
    }

    // Check for exact alias match first
    const standardized = POSITION_ALIASES[query]
    if (standardized) {
      return NextResponse.json({
        success: true,
        data: [standardized, ...Array.from(positionCache)
          .filter(pos => pos.toLowerCase().includes(query) && pos !== standardized)
          .slice(0, limit - 1)]
      })
    }

    // Filter positions based on query
    const suggestions = Array.from(positionCache)
      .filter(position => position.toLowerCase().includes(query))
      .sort((a, b) => {
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        // Prioritize exact matches and starts-with matches
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
    console.error('Error fetching position suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to fetch position suggestions'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { position } = await request.json()
    
    if (!position || typeof position !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Position title is required'
          }
        },
        { status: 400 }
      )
    }

    // Add new position to cache
    positionCache.add(position.trim())

    return NextResponse.json({
      success: true,
      data: { message: 'Position added to suggestions' }
    })
  } catch (error) {
    console.error('Error adding position suggestion:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUGGESTIONS_ERROR',
          message: 'Failed to add position suggestion'
        }
      },
      { status: 500 }
    )
  }
}