import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/openapi/config';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI specification for the AI Application Tracker API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0.3 specification
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(swaggerSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SPEC_GENERATION_ERROR',
          message: 'Failed to generate OpenAPI specification',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}