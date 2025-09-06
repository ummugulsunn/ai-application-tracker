import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token?.sub) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "UNAUTHORIZED", 
            message: "Authentication required" 
          } 
        },
        { status: 401 }
      )
    }

    return handler(request, token.sub)
  } catch (error) {
    console.error("Auth middleware error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "AUTH_ERROR", 
          message: "Authentication error" 
        } 
      },
      { status: 500 }
    )
  }
}

export function createAuthHandler(
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return withAuth(request, handler)
  }
}