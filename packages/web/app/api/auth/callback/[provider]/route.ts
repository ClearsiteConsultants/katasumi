import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { generateToken } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Provider token + user-info helpers
// ---------------------------------------------------------------------------

async function exchangeCodeForToken(
  provider: string,
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<string> {
  const tokenUrl =
    provider === 'google'
      ? 'https://oauth2.googleapis.com/token'
      : 'https://github.com/login/oauth/access_token'

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!res.ok) {
    let body = ''
    try { body = await res.text() } catch { /* ignore */ }
    throw new Error(`Token exchange failed: ${res.status} ${res.statusText} — ${body}`)
  }
  const data = await res.json()
  if (!data.access_token) {
    // GitHub returns 200 with error fields on failure (e.g. bad_verification_code)
    const providerError = data.error ? `${data.error}: ${data.error_description ?? ''}` : JSON.stringify(data)
    throw new Error(`No access_token in response — ${providerError}`)
  }
  return data.access_token as string
}

async function fetchGoogleUser(accessToken: string): Promise<{ id: string; email: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    let body = ''
    try { body = await res.text() } catch { /* ignore */ }
    throw new Error(`Failed to fetch Google user info: ${res.status} ${res.statusText} — ${body}`)
  }
  const data = await res.json()
  if (!data.email) throw new Error(`No email in Google user info — sub: ${data.sub ?? 'missing'}`)
  return { id: String(data.sub), email: data.email as string }
}

async function fetchGithubUser(accessToken: string): Promise<{ id: string; email: string }> {
  const [userRes, emailRes] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }),
  ])

  if (!userRes.ok) {
    let body = ''
    try { body = await userRes.text() } catch { /* ignore */ }
    throw new Error(`Failed to fetch GitHub user info: ${userRes.status} ${userRes.statusText} — ${body}`)
  }
  const user = await userRes.json()

  let email: string | null = user.email ?? null
  if (!email && emailRes.ok) {
    const emails: Array<{ email: string; primary: boolean; verified: boolean }> =
      await emailRes.json()
    email = emails.find((e) => e.primary && e.verified)?.email ?? null
  }
  if (!email) throw new Error('No verified primary email found in GitHub account')
  return { id: String(user.id), email }
}

// ---------------------------------------------------------------------------
// Callback handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const PROVIDER_CONFIG = {
    google: { clientIdEnv: 'GOOGLE_CLIENT_ID', clientSecretEnv: 'GOOGLE_CLIENT_SECRET' },
    github: { clientIdEnv: 'GITHUB_CLIENT_ID', clientSecretEnv: 'GITHUB_CLIENT_SECRET' },
  } as const

  const config = PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG]
  if (!config) {
    return NextResponse.redirect(`${baseUrl}/login?error=unknown_provider`)
  }

  // --- Parse and verify state / CSRF ---
  const errorParam = request.nextUrl.searchParams.get('error')
  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/login?error=oauth_denied`)
  }

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_params`)
  }

  const storedCsrf = request.cookies.get('oauth_csrf')?.value
  let action = 'login'
  try {
    const decoded = Buffer.from(state, 'base64url').toString()
    const colonIdx = decoded.indexOf(':')
    const decodedAction = decoded.substring(0, colonIdx)
    const decodedCsrf = decoded.substring(colonIdx + 1)
    if (!storedCsrf || decodedCsrf !== storedCsrf) {
      return NextResponse.redirect(`${baseUrl}/login?error=csrf_mismatch`)
    }
    action = decodedAction
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_state`)
  }

  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]
  if (!clientId || !clientSecret) {
    const dest = action === 'signup' ? 'signup' : 'login'
    return NextResponse.redirect(`${baseUrl}/${dest}?error=oauth_not_configured`)
  }

  // Helper to clear the CSRF cookie on any response
  const clearCsrf = (res: NextResponse) => {
    res.cookies.set('oauth_csrf', '', { maxAge: 0, path: '/', httpOnly: true })
    return res
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback/${provider}`
    const accessToken = await exchangeCodeForToken(
      provider,
      code,
      clientId,
      clientSecret,
      redirectUri
    )

    const { id: oauthId, email } =
      provider === 'google'
        ? await fetchGoogleUser(accessToken)
        : await fetchGithubUser(accessToken)

    // -----------------------------------------------------------------------
    // SIGNUP flow: create pending user → Stripe checkout → redirect to Stripe
    // -----------------------------------------------------------------------
    if (action === 'signup') {
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
        return clearCsrf(
          NextResponse.redirect(`${baseUrl}/signup?error=payment_not_configured`)
        )
      }

      const existing = await prisma.user.findUnique({ where: { email } })

      if (existing && existing.subscriptionStatus !== 'pending') {
        // Already an active account — send them to login instead
        return clearCsrf(
          NextResponse.redirect(`${baseUrl}/login?error=account_exists`)
        )
      }

      let userId: string
      if (existing && existing.subscriptionStatus === 'pending') {
        // Allow restarting checkout — refresh OAuth details
        await prisma.user.update({
          where: { id: existing.id },
          data: { oauthProvider: provider, oauthId },
        })
        userId = existing.id
      } else {
        const newUser = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            email,
            passwordHash: null,
            oauthProvider: provider,
            oauthId,
            tier: 'pending',
            subscriptionStatus: 'pending',
          },
        })
        userId = newUser.id
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        customer_email: email,
        client_reference_id: userId,
        success_url: `${baseUrl}/login?welcome=true`,
        cancel_url: `${baseUrl}/signup?canceled=true`,
      })

      return clearCsrf(NextResponse.redirect(session.url!))
    }

    // -----------------------------------------------------------------------
    // LOGIN flow: find existing user → issue JWT → /auth/complete
    // -----------------------------------------------------------------------
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return clearCsrf(NextResponse.redirect(`${baseUrl}/signup?error=no_account`))
    }
    if (user.subscriptionStatus === 'pending') {
      return clearCsrf(NextResponse.redirect(`${baseUrl}/signup?error=pending_payment`))
    }

    // Backfill OAuth details if the user originally signed up with email/password
    if (!user.oauthProvider) {
      await prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider: provider, oauthId },
      })
    }

    const token = generateToken(user.id, user.email)
    const userPayload = JSON.stringify({
      id: user.id,
      email: user.email,
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
    })

    // Store JWT in a short-lived http-only cookie; user data in a readable cookie.
    // /auth/complete will exchange these via /api/auth/exchange-token.
    const response = NextResponse.redirect(`${baseUrl}/auth/complete`)
    clearCsrf(response)
    response.cookies.set('oauth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    })
    response.cookies.set('oauth_user', userPayload, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60,
      path: '/',
    })
    return response
  } catch (err) {
    console.error(`OAuth callback error (${provider}):`, err)
    const dest = action === 'signup' ? 'signup' : 'login'
    return clearCsrf(NextResponse.redirect(`${baseUrl}/${dest}?error=oauth_failed`))
  }
}
