import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const preferencesSchema = z.object({
  // Notification preferences
  emailNotifications: z.boolean().default(true),
  reminderFrequency: z.enum(["Daily", "Weekly", "Never"]).default("Daily"),
  aiRecommendations: z.boolean().default(true),
  followUpReminders: z.boolean().default(true),
  interviewReminders: z.boolean().default(true),
  applicationDeadlines: z.boolean().default(true),
  
  // Dashboard customization
  dashboardLayout: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
  defaultView: z.enum(["table", "cards", "kanban"]).default("table"),
  itemsPerPage: z.number().min(5).max(100).default(25),
  showCompletedApplications: z.boolean().default(true),
  defaultSortBy: z.enum(["appliedDate", "company", "position", "status", "priority"]).default("appliedDate"),
  defaultSortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // Privacy controls
  dataRetention: z.enum(["1year", "2years", "5years", "indefinite"]).default("2years"),
  shareAnalytics: z.boolean().default(false),
  allowDataExport: z.boolean().default(true),
  
  // UI preferences
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("MM/DD/YYYY"),
  currency: z.string().default("USD"),
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
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    // Return default preferences if none are set
    const preferences = user.preferences || preferencesSchema.parse({})

    return NextResponse.json({
      success: true,
      data: preferences
    })

  } catch (error) {
    console.error("Preferences fetch error:", error)
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
    const preferences = preferencesSchema.parse(body)

    // Update user preferences
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        preferences: preferences as any // Prisma Json type
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error("Preferences update error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "VALIDATION_ERROR", 
            message: "Invalid preferences data",
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