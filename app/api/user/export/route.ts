import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        applications: true,
        aiAnalyses: true,
        jobRecommendations: true,
        contacts: true,
        reminders: true,
      }
    })

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      )
    }

    // Remove sensitive data
    const { password, ...userDataWithoutPassword } = userData

    // Create export data structure
    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      user: userDataWithoutPassword,
      summary: {
        totalApplications: userData.applications.length,
        totalAnalyses: userData.aiAnalyses.length,
        totalRecommendations: userData.jobRecommendations.length,
        totalContacts: userData.contacts.length,
        totalReminders: userData.reminders.length,
      }
    }

    // Return as downloadable JSON file
    const jsonData = JSON.stringify(exportData, null, 2)
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })

  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    )
  }
}