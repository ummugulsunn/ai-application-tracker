import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { applicationSchema } from "@/lib/validations"

const migrationSchema = z.object({
  applications: z.array(z.object({
    id: z.string().optional(),
    company: z.string(),
    position: z.string(),
    location: z.string().optional(),
    jobType: z.string().optional(),
    salaryRange: z.string().optional(),
    status: z.string(),
    priority: z.string().default("Medium"),
    appliedDate: z.string().transform(str => new Date(str)),
    responseDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    interviewDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    offerDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    rejectionDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    notes: z.string().optional(),
    jobDescription: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    contactPerson: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    companyWebsite: z.string().optional(),
    jobUrl: z.string().optional(),
    tags: z.array(z.string()).optional(),
    aiMatchScore: z.number().optional(),
    aiInsights: z.any().optional(),
    followUpDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    createdAt: z.string().optional().transform(str => str ? new Date(str) : new Date()),
    updatedAt: z.string().optional().transform(str => str ? new Date(str) : new Date()),
  })),
  userId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { applications, userId } = migrationSchema.parse(body)

    // Ensure the user can only migrate to their own account
    const targetUserId = userId || session.user.id
    if (targetUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Cannot migrate data to another user's account" } },
        { status: 403 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    // Prepare applications for database insertion
    const applicationsToCreate = applications.map(app => ({
      userId: targetUserId,
      company: app.company,
      position: app.position,
      location: app.location || "",
      jobType: app.jobType || "",
      salaryRange: app.salaryRange || "",
      status: app.status,
      priority: app.priority,
      appliedDate: app.appliedDate,
      responseDate: app.responseDate,
      interviewDate: app.interviewDate,
      offerDate: app.offerDate,
      rejectionDate: app.rejectionDate,
      notes: app.notes || "",
      jobDescription: app.jobDescription || "",
      requirements: app.requirements || [],
      contactPerson: app.contactPerson || "",
      contactEmail: app.contactEmail || "",
      contactPhone: app.contactPhone || "",
      companyWebsite: app.companyWebsite || "",
      jobUrl: app.jobUrl || "",
      tags: app.tags || [],
      aiMatchScore: app.aiMatchScore,
      aiInsights: app.aiInsights,
      followUpDate: app.followUpDate,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }))

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing applications to avoid duplicates
      const existingApplications = await tx.application.findMany({
        where: {
          userId: targetUserId,
          OR: applicationsToCreate.map(app => ({
            AND: [
              { company: app.company },
              { position: app.position },
              { appliedDate: app.appliedDate }
            ]
          }))
        },
        select: { company: true, position: true, appliedDate: true }
      })

      // Filter out duplicates
      const uniqueApplications = applicationsToCreate.filter(app => {
        return !existingApplications.some(existing => 
          existing.company === app.company &&
          existing.position === app.position &&
          existing.appliedDate.getTime() === app.appliedDate.getTime()
        )
      })

      // Create applications in batches to avoid timeout
      const batchSize = 50
      const createdApplications = []
      
      for (let i = 0; i < uniqueApplications.length; i += batchSize) {
        const batch = uniqueApplications.slice(i, i + batchSize)
        const batchResult = await tx.application.createMany({
          data: batch,
          skipDuplicates: true
        })
        createdApplications.push(batchResult)
      }

      return {
        totalProvided: applications.length,
        duplicatesSkipped: applications.length - uniqueApplications.length,
        migratedCount: uniqueApplications.length,
        createdApplications
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        migratedCount: result.migratedCount,
        totalProvided: result.totalProvided,
        duplicatesSkipped: result.duplicatesSkipped,
        message: `Successfully migrated ${result.migratedCount} applications${result.duplicatesSkipped > 0 ? ` (${result.duplicatesSkipped} duplicates skipped)` : ''}`
      }
    })

  } catch (error) {
    console.error("Migration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid migration data",
            details: error.errors 
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "INTERNAL_ERROR", 
          message: "Failed to migrate applications" 
        } 
      },
      { status: 500 }
    )
  }
}