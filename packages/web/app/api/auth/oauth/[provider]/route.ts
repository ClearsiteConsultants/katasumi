import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

const PROVIDERS = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'read:user user:email',
    clientIdEnv: 'GITHUB_CLIENT_ID',
  },
} as const

type Provider = keyof typeof PROVIDERS

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const config = PROVIDERS[provider as Provider]

  if (!config) {
    return NextResponse.json({ error: 'Unknown OAuth provider' }, { status: 400 })
  }

  const clientId = process.env[config.clientIdEnv]
  if (!clientId) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_not_configured`)
  }

  // action=signup routes the user to Stripe after OAuth; action=login grants access directly
  const action = request.nextUrl.searchParams.get('action') ?? 'login'

  // Generate a CSRF token and encode action + token in the state parameter
  const csrf = crypto.randomBytes(16).toString('hex')
  const state = Buffer.from(`${action}:${csrf}`).toString('base64url')

  const redirectUri = `${baseUrl}/api/auth/callback/${provider}`
  const authUrl = new URL(config.authUrl)
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', config.scope)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')
  if (provider === 'google') {
    authUrl.searchParams.set('access_type', 'online')
    authUrl.searchParams.set('prompt', 'select_account')
  }

  const response = NextResponse.redirect(authUrl.toString())
  // Store CSRF token in short-lived http-only cookie
  response.cookies.set('oauth_csrf', csrf, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  return response
}
