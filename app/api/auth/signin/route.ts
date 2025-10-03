import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// This endpoint redirects to NextAuth signin
// NextAuth handles the actual authentication
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (session) {
        return NextResponse.json({
            success: true,
            data: {
                user: session.user,
                message: "Already signed in"
            }
        })
    }

    // Redirect to NextAuth signin page
    const url = new URL('/api/auth/signin', request.url)
    return NextResponse.redirect(url)
}

export async function POST(request: NextRequest) {
    // For API calls, return instructions to use NextAuth
    return NextResponse.json({
        success: false,
        error: {
            code: "USE_NEXTAUTH",
            message: "Please use NextAuth signin endpoint: /api/auth/signin",
            redirect: "/api/auth/signin"
        }
    }, { status: 400 })
}