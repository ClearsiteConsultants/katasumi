import { NextRequest, NextResponse } from 'next/server'
import { PostgresAdapter } from '@katasumi/core/dist/postgres-adapter'
import { extractToken, verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check for authentication (optional - apps list works for both logged in and anonymous users)
    let userId: string | undefined = undefined
    const authHeader = request.headers.get('Authorization')
    if (authHeader) {
      const token = extractToken(authHeader)
      if (token) {
        const payload = verifyToken(token)
        if (payload) {
          userId = payload.userId
          console.log('[API /api/apps] Authenticated user:', userId)
        }
      }
    }

    // Get all unique app names from the database using core adapter
    // If userId is provided, adapter will also include apps from user_shortcuts table
    const dbUrl = process.env.DATABASE_URL || 'postgres://katasumi:dev_password@localhost:5432/katasumi_dev'
    const adapter = new PostgresAdapter(dbUrl, undefined, userId)
    const apps = await adapter.getApps()

    return NextResponse.json({ apps })
  } catch (error) {
    console.error('Error fetching apps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    )
  }
}
