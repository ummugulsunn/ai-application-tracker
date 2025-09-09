import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Contact, CreateContactRequest, ContactFilters } from '@/types/contact'

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  relationshipType: z.enum(['colleague', 'recruiter', 'manager', 'friend', 'mentor', 'other']).optional(),
  connectionStrength: z.enum(['strong', 'medium', 'weak']).optional(),
  lastContactDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const company = searchParams.get('company')
    const relationshipType = searchParams.get('relationshipType')
    const connectionStrength = searchParams.get('connectionStrength')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { position: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    if (relationshipType) {
      where.relationshipType = relationshipType
    }

    if (connectionStrength) {
      where.connectionStrength = connectionStrength
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const orderBy: any = {}
    switch (sortBy) {
      case 'name':
        orderBy.firstName = sortOrder
        break
      case 'company':
        orderBy.company = sortOrder
        break
      case 'lastContact':
        orderBy.lastContactDate = sortOrder
        break
      case 'created':
        orderBy.createdAt = sortOrder
        break
      default:
        orderBy.firstName = 'asc'
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.contact.count({ where })
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Check for duplicate contacts
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: session.user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        OR: [
          { email: validatedData.email || undefined },
          { 
            AND: [
              { company: validatedData.company || undefined },
              { position: validatedData.position || undefined }
            ]
          }
        ]
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'A contact with similar details already exists' },
        { status: 409 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        lastContactDate: validatedData.lastContactDate ? new Date(validatedData.lastContactDate) : null
      }
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}