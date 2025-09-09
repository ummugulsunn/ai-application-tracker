import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ContactStats } from '@/types/contact'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get total contacts
    const totalContacts = await prisma.contact.count({
      where: { userId }
    })

    // Get contacts by relationship type
    const relationshipTypeStats = await prisma.contact.groupBy({
      by: ['relationshipType'],
      where: { userId },
      _count: { id: true }
    })

    const byRelationshipType = relationshipTypeStats.reduce((acc, stat) => {
      acc[stat.relationshipType || 'other'] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Get contacts by connection strength
    const connectionStrengthStats = await prisma.contact.groupBy({
      by: ['connectionStrength'],
      where: { userId },
      _count: { id: true }
    })

    const byConnectionStrength = connectionStrengthStats.reduce((acc, stat) => {
      acc[stat.connectionStrength || 'medium'] = stat._count.id
      return acc
    }, {} as Record<string, number>)

    // Get contacts by company
    const companyStats = await prisma.contact.groupBy({
      by: ['company'],
      where: { 
        userId,
        company: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })

    const byCompany = companyStats.reduce((acc, stat) => {
      if (stat.company) {
        acc[stat.company] = stat._count.id
      }
      return acc
    }, {} as Record<string, number>)

    // Get recent contacts (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentContacts = await prisma.contact.count({
      where: {
        userId,
        OR: [
          { createdAt: { gte: thirtyDaysAgo } },
          { lastContactDate: { gte: thirtyDaysAgo } }
        ]
      }
    })

    // Get overdue follow-ups (contacts not contacted in 90+ days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const overdueFollowUps = await prisma.contact.count({
      where: {
        userId,
        OR: [
          { lastContactDate: { lt: ninetyDaysAgo } },
          { 
            lastContactDate: null,
            createdAt: { lt: ninetyDaysAgo }
          }
        ]
      }
    })

    const stats: ContactStats = {
      totalContacts,
      byRelationshipType,
      byConnectionStrength,
      byCompany,
      recentContacts,
      overdueFollowUps
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching contact stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact statistics' },
      { status: 500 }
    )
  }
}