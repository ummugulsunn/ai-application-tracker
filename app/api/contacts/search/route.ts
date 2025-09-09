import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'companies', 'positions', 'tags'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const userId = session.user.id

    switch (type) {
      case 'companies':
        const companies = await prisma.contact.findMany({
          where: {
            userId,
            company: {
              contains: query,
              mode: 'insensitive'
            }
          },
          select: { company: true },
          distinct: ['company'],
          take: limit
        })
        return NextResponse.json(
          companies.map(c => c.company).filter(Boolean)
        )

      case 'positions':
        const positions = await prisma.contact.findMany({
          where: {
            userId,
            position: {
              contains: query,
              mode: 'insensitive'
            }
          },
          select: { position: true },
          distinct: ['position'],
          take: limit
        })
        return NextResponse.json(
          positions.map(p => p.position).filter(Boolean)
        )

      case 'tags':
        const contacts = await prisma.contact.findMany({
          where: {
            userId,
            tags: {
              hasSome: [query]
            }
          },
          select: { tags: true }
        })
        
        const allTags = contacts.flatMap(c => c.tags)
        const uniqueTags = [...new Set(allTags)]
        const filteredTags = uniqueTags
          .filter(tag => tag.toLowerCase().includes(query.toLowerCase()))
          .slice(0, limit)
        
        return NextResponse.json(filteredTags)

      default:
        // General search across contacts
        const searchResults = await prisma.contact.findMany({
          where: {
            userId,
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { company: { contains: query, mode: 'insensitive' } },
              { position: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            position: true
          },
          take: limit
        })
        return NextResponse.json(searchResults)
    }
  } catch (error) {
    console.error('Error searching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    )
  }
}