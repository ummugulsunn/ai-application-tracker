import { NextRequest, NextResponse } from 'next/server'
import { featureFlags } from '@/lib/featureFlags'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    
    const flags = featureFlags.getAllFlags(userId || undefined)
    
    return NextResponse.json({
      success: true,
      data: flags,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Feature flags API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEATURE_FLAGS_ERROR',
          message: 'Failed to retrieve feature flags'
        }
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint would be used by admin users to update feature flags
    // For now, we'll just return the current flags
    const body = await request.json()
    const { userId } = body
    
    const flags = featureFlags.getAllFlags(userId)
    
    return NextResponse.json({
      success: true,
      data: flags,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Feature flags update error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FEATURE_FLAGS_UPDATE_ERROR',
          message: 'Failed to update feature flags'
        }
      },
      { status: 500 }
    )
  }
}