import { NextResponse } from 'next/server'
import { PostgresAdapter } from '@katasumi/core/dist/postgres-adapter'

export async function GET() {
  try {
    // Get all unique app names from the database using core adapter
    const dbUrl = process.env.DATABASE_URL || 'postgres://katasumi:dev_password@localhost:5432/katasumi_dev'
    const adapter = new PostgresAdapter(dbUrl)
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
