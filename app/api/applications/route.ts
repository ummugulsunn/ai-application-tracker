import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { applicationSchema, updateApplicationSchema } from "@/lib/validations"

const createApplicationSchema = z.object({
  company: z.string().min(1, "Company is required").max(255, "Company name must be less than 255 characters"),
  position: z.string().min(1, "Position is required").max(255, "Position must be less than 255 characters"),
  location: z.string().max(255, "Location must be less than 255 characters").optional(),
  jobType: z.enum(["Full-time", "Part-time", "Internship", "Contract", "Freelance"]).optional(),
  salaryRange: z.string().max(100, "Salary range must be less than 100 characters").optional(),
  status: z.enum(["Pending", "Applied", "Interviewing", "Offered", "Rejected", "Accepted", "Withdrawn"]),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  appliedDate: z.string().transform(str => new Date(str)),
  responseDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  interviewDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  offerDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  rejectionDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  notes: z.string().max(5000, "Notes must be less than 5000 characters").optional(),
  jobDescription: z.string().max(10000, "Job description must be less than 10000 characters").optional(),
  requirements: z.array(z.string().max(500, "Requirement must be less than 500 characters")).max(50, "Maximum 50 requirements").optional(),
  contactPerson: z.string().max(255, "Contact person must be less than 255 characters").optional(),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  companyWebsite: z.string().url("Invalid URL format").optional().or(z.literal("")),
  jobUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  tags: z.array(z.string().max(50, "Tag must be less than 50 characters")).max(20, "Maximum 20 tags").optional(),
  followUpDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  userId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const company = searchParams.get('company')
    const position = searchParams.get('position')

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status) {
      where.status = status
    }
    if (company) {
      where.company = {
        contains: company,
        mode: 'insensitive'
      }
    }
    if (position) {
      where.position = {
        contains: position,
        mode: 'insensitive'
      }
    }

    // Get applications with pagination
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Applications fetch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

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
    const applicationData = createApplicationSchema.parse(body)

    // Ensure the application belongs to the authenticated user
    const dataToCreate = {
      ...applicationData,
      userId: session.user.id,
      appliedDate: new Date(applicationData.appliedDate),
      responseDate: applicationData.responseDate ? new Date(applicationData.responseDate) : null,
      interviewDate: applicationData.interviewDate ? new Date(applicationData.interviewDate) : null,
      offerDate: applicationData.offerDate ? new Date(applicationData.offerDate) : null,
      rejectionDate: applicationData.rejectionDate ? new Date(applicationData.rejectionDate) : null,
      followUpDate: applicationData.followUpDate ? new Date(applicationData.followUpDate) : null,
      requirements: applicationData.requirements || [],
      tags: applicationData.tags || [],
    }

    const application = await prisma.application.create({
      data: dataToCreate
    })

    return NextResponse.json({
      success: true,
      data: application
    })

  } catch (error) {
    console.error("Application creation error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid application data",
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
          message: "Failed to create application" 
        } 
      },
      { status: 500 }
    )
  }
}