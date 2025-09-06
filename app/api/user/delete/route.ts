import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Delete all user data in the correct order (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete reminders first (they reference applications)
      await tx.reminder.deleteMany({
        where: { userId }
      })

      // Delete applications
      await tx.application.deleteMany({
        where: { userId }
      })

      // Delete AI analyses
      await tx.aIAnalysis.deleteMany({
        where: { userId }
      })

      // Delete job recommendations
      await tx.jobRecommendation.deleteMany({
        where: { userId }
      })

      // Delete contacts
      await tx.contact.deleteMany({
        where: { userId }
      })

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId }
      })

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId }
      })

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      })
    })

    return NextResponse.json({
      success: true,
      message: "All user data has been permanently deleted"
    })

  } catch (error) {
    console.error("Data deletion error:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete user data" } },
      { status: 500 }
    )
  }
}