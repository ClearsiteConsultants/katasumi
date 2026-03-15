'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

/**
 * /auth/complete
 *
 * Landing page after a successful OAuth login. It calls the exchange-token
 * endpoint to retrieve the JWT from the short-lived http-only cookie set by
 * the OAuth callback, stores it in localStorage (mirroring the email/password
 * login flow), and redirects to the search page.
 */
export default function AuthCompletePage() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)

  useEffect(() => {
    async function complete() {
      try {
        const res = await fetch('/api/auth/exchange-token', { method: 'POST' })

        if (!res.ok) {
          router.replace('/login?error=oauth_session_expired')
          return
        }

        const { token, user } = await res.json()

        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)

        router.replace('/search')
      } catch {
        router.replace('/login?error=oauth_failed')
      }
    }

    complete()
  }, [router, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Completing sign-in…</p>
    </div>
  )
}
