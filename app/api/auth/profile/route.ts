import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  experienceLevel: z.enum(["Entry", "Mid", "Senior", "Executive"]).optional(),
  desiredSalaryMin: z.number().optional(),
  desiredSalaryMax: z.number().optional(),
  preferredLocations: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  jobTypes: z.array(z.string()).optional(),
  resumeUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        experienceLevel: true,
        desiredSalaryMin: true,
        desiredSalaryMax: true,
        preferredLocations: true,
        skills: true,
        industries: true,
        jobTypes: true,
        resumeUrl: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const updateData = updateProfileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        experienceLevel: true,
        desiredSalaryMin: true,
        desiredSalaryMax: true,
        preferredLocations: true,
        skills: true,
        industries: true,
        jobTypes: true,
        resumeUrl: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        preferences: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error("Profile update error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid input data",
            details: error.errors 
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}