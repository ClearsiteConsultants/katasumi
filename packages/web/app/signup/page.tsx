import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign Up for Premium - Katasumi',
  description: 'Sign up for Katasumi Premium and get cloud sync, built-in AI, and multi-device access.',
}

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up for Premium</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
          Get cloud sync, built-in AI (100 queries/day), and multi-device access.
        </p>
        
        <div className="bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <p className="text-center text-blue-900 dark:text-blue-100 font-semibold">
            🚧 Premium sign-up coming soon!
          </p>
          <p className="text-center text-blue-700 dark:text-blue-300 mt-2 text-sm">
            We&apos;re working on bringing you cloud sync and built-in AI features.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-semibold mb-2">Premium includes:</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Cloud sync across all devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Built-in AI (100 queries/day)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>Multi-device sync</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">✓</span>
                <span>No API key setup required</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Want to start using Katasumi now?
            </p>
            <Link
              href="https://github.com/joshpitkin/katasumi#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full text-center px-6 py-3 font-semibold text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
            >
              Try Free Version
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
