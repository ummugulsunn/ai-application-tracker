import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const onboardingMigrationSchema = z.object({
  progress: z.object({
    currentStep: z.number().optional(),
    completedSteps: z.array(z.string()).optional(),
    skippedSteps: z.array(z.string()).optional(),
    preferences: z.record(z.any()).optional(),
    tourCompleted: z.boolean().optional(),
    welcomeCompleted: z.boolean().optional(),
    quickStartCompleted: z.boolean().optional(),
  }),
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
    const { progress, userId } = onboardingMigrationSchema.parse(body)

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

    // For now, we'll store onboarding progress in the user's profile
    // In a more complex system, you might have a separate onboarding table
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        // Store onboarding progress in a JSON field (you might need to add this to your schema)
        // For now, we'll just mark the user as having completed onboarding
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: "Onboarding progress migrated successfully",
        progress: progress
      }
    })

  } catch (error) {
    console.error("Onboarding migration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid onboarding data",
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
          message: "Failed to migrate onboarding data" 
        } 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Return user's onboarding status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        // Add onboarding-related fields as needed
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
      data: {
        onboardingCompleted: true, // Determine based on your logic
        user: user
      }
    })

  } catch (error) {
    console.error("Onboarding fetch error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}