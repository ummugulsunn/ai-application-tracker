import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const providerSchema = z.enum(['google', 'outlook'])

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  applicationId: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = providerSchema.parse(params.provider)
    const body = await request.json()
    const eventData = createEventSchema.parse(body)
    
    // In a real implementation, this would:
    // 1. Validate user authentication and calendar API tokens
    // 2. Create the event in the respective calendar service
    // 3. Return the created event with the external ID
    
    // For now, create a mock event
    const createdEvent = {
      id: `${provider}_${Date.now()}`,
      title: eventData.title,
      description: eventData.description,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      location: eventData.location,
      attendees: eventData.attendees || [],
      applicationId: eventData.applicationId
    }
    
    // Simulate API call time
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json({
      success: true,
      data: createdEvent
    })
  } catch (error) {
    console.error(`Calendar event creation error for ${params.provider}:`, error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid event data',
          details: error.errors
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
    
    // In a real implementation, this would fetch events from the calendar API
    // For now, return mock events
    const mockEvents = [
      {
        id: `${provider}_event_1`,
        title: 'Interview Reminder',
        description: 'Technical interview preparation',
        startTime: new Date('2024-02-15T09:00:00Z'),
        endTime: new Date('2024-02-15T10:00:00Z'),
        location: 'Video call',
        attendees: ['interviewer@company.com'],
        applicationId: applicationId || 'app_123'
      }
    ]
    
    const filteredEvents = applicationId 
      ? mockEvents.filter(event => event.applicationId === applicationId)
      : mockEvents
    
    return NextResponse.json({
      success: true,
      data: filteredEvents,
      count: filteredEvents.length
    })
  } catch (error) {
    console.error(`Calendar events fetch error for ${params.provider}:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}