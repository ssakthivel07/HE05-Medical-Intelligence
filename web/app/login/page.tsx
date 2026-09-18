import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '../../lib/supabase/ssrClient'
import LoginForm from '../../components/auth/LoginForm'

export default async function LoginPage() {
  let user = null
  try {
    const result = await getServerUser()
    user = result.user
  } catch {
    user = null
  }

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <span className="text-xs text-zinc-400">Medical Timeline Platform</span>
      </div>

      {/* Main Login Card */}
      <main className="my-auto py-8">
        <LoginForm />
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-400">
        Medical Timeline • Secure Health Records
      </footer>
    </div>
  )
}
