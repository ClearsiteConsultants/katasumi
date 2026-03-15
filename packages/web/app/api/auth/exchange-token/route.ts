import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/exchange-token
 *
 * Exchanges the short-lived `oauth_token` / `oauth_user` cookies set by the
 * OAuth callback into a JSON response that the client can store in localStorage.
 * Both cookies are cleared after a single successful exchange.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('oauth_token')?.value
  const userStr = request.cookies.get('oauth_user')?.value

  if (!token || !userStr) {
    return NextResponse.json({ error: 'No pending OAuth session' }, { status: 400 })
  }

  let user: unknown
  try {
    user = JSON.parse(userStr)
  } catch {
    return NextResponse.json({ error: 'Malformed OAuth session' }, { status: 400 })
  }

  const response = NextResponse.json({ token, user })
  // Clear one-time cookies
  response.cookies.set('oauth_token', '', { maxAge: 0, path: '/', httpOnly: true })
  response.cookies.set('oauth_user', '', { maxAge: 0, path: '/' })
  return response
}
