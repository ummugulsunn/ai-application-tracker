import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const providerSchema = z.enum(['gmail', 'outlook'])

// Mock email data for demonstration
const mockEmailData = {
  gmail: [
    {
      messageId: 'gmail_msg_1',
      subject: 'Thank you for your application - Tech Corp',
      from: 'hr@techcorp.com',
      to: 'user@example.com',
      date: new Date('2024-01-16T10:30:00Z'),
      body: 'Thank you for applying to the Software Engineer position. We will review your application and get back to you within 5 business days.',
      applicationId: 'app_123',
      isJobRelated: true
    },
    {
      messageId: 'gmail_msg_2',
      subject: 'Interview Invitation - StartupXYZ',
      from: 'recruiter@startupxyz.com',
      to: 'user@example.com',
      date: new Date('2024-01-22T14:15:00Z'),
      body: 'We would like to invite you for an interview for the Frontend Developer position. Please let us know your availability for next week.',
      applicationId: 'app_124',
      isJobRelated: true
    },
    {
      messageId: 'gmail_msg_3',
      subject: 'Follow-up on your application',
      from: 'hiring@bigcompany.com',
      to: 'user@example.com',
      date: new Date('2024-01-25T09:45:00Z'),
      body: 'We wanted to follow up on your application for the Backend Developer position. We are currently reviewing applications and will contact you soon.',
      applicationId: 'app_456',
      isJobRelated: true
    }
  ],
  outlook: [
    {
      messageId: 'outlook_msg_1',
      subject: 'Application Status Update - Enterprise Solutions',
      from: 'jobs@enterprise.com',
      to: 'user@example.com',
      date: new Date('2024-01-24T16:20:00Z'),
      body: 'Your application for the Full Stack Developer position has been received and is under review. We will contact you within 7 business days.',
      applicationId: 'app_789',
      isJobRelated: true
    }
  ]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = providerSchema.parse(params.provider)
    
    // In a real implementation, this would:
    // 1. Validate user authentication and email API tokens
    // 2. Search for job-related emails using keywords and filters
    // 3. Parse email content to extract relevant information
    // 4. Link emails to existing applications based on company/subject
    // 5. Update application status based on email content
    
    // For now, return mock data
    const emails = mockEmailData[provider] || []
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Simulate email analysis and application linking
    let itemsLinked = 0
    let statusUpdates = 0
    
    for (const email of emails) {
      if (email.isJobRelated && email.applicationId) {
        itemsLinked++
        
        // Simulate status updates based on email content
        if (email.subject.toLowerCase().includes('interview')) {
          statusUpdates++
        } else if (email.subject.toLowerCase().includes('thank you')) {
          statusUpdates++
        }
      }
    }
    
    const result = {
      success: true,
      itemsProcessed: emails.length,
      itemsAdded: itemsLinked,
      itemsUpdated: statusUpdates,
      errors: [],
      lastSync: new Date(),
      metadata: {
        emailsAnalyzed: emails.length,
        jobRelatedEmails: emails.filter(e => e.isJobRelated).length,
        applicationsLinked: itemsLinked,
        statusUpdates: statusUpdates
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Email sync error for ${params.provider}:`, error)
    
    return NextResponse.json(
      {
        success: false,
        itemsProcessed: 0,
        itemsAdded: 0,
        itemsUpdated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSync: new Date()
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = providerSchema.parse(params.provider)
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const jobRelatedOnly = searchParams.get('jobRelated') === 'true'
    
    // Return available emails
    let emails = mockEmailData[provider] || []
    
    if (applicationId) {
      emails = emails.filter(email => email.applicationId === applicationId)
    }
    
    if (jobRelatedOnly) {
      emails = emails.filter(email => email.isJobRelated)
    }
    
    return NextResponse.json({
      success: true,
      data: emails,
      count: emails.length,
      metadata: {
        totalEmails: mockEmailData[provider]?.length || 0,
        jobRelatedEmails: emails.filter(e => e.isJobRelated).length,
        filteredCount: emails.length
      }
    })
  } catch (error) {
    console.error(`Email fetch error for ${params.provider}:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}