"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import getBrowserSupabase from '../../lib/supabase/browser'

interface SignupErrorState {
  message: string
  status?: number
  code?: string
  isExistingUser?: boolean
}

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<SignupErrorState | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const supabase = getBrowserSupabase()

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        setError({
          message: 'An account with this email address already exists. Please sign in instead.',
          status: 400,
          code: 'user_already_exists',
          isExistingUser: true,
        })
        return
      }

      if (data?.user && data?.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      if (data?.user && !data?.session) {
        setMessage(
          'Account created successfully! Please check your email inbox to confirm your account before signing in.'
        )
        return
      }

      if (authError && (authError.message || typeof authError === 'string')) {
        const errMsg = typeof authError === 'string' ? authError : authError.message
        setError({
          message: errMsg,
          status: authError.status,
          code: (authError as { code?: string })?.code,
          isExistingUser:
            errMsg.toLowerCase().includes('already registered') ||
            (authError as { code?: string })?.code === 'user_already_exists',
        })
        return
      }

      if (!data?.user) {
        setError({
          message:
            authError?.message ||
            'Unable to complete account registration. Please verify your information and try again.',
          status: authError?.status,
        })
      }
    } catch (err: unknown) {
      const caughtMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred during signup. Please try again.'

      setError({
        message: caughtMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
            +
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Start consolidating your health records in a secure, unified timeline.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-300 text-xs space-y-1">
              <div className="font-semibold text-red-700 dark:text-red-400 flex items-center justify-between">
                <span>Signup Error:</span>
                {error.isExistingUser && (
                  <Link
                    href="/login"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign in instead →
                  </Link>
                )}
              </div>
              <div className="text-xs break-words">{error.message}</div>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 text-xs space-y-1">
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                Account Created
              </div>
              <p className="text-xs leading-relaxed">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow-md transition disabled:opacity-50"
          >
            {loading ? 'Creating Account…' : 'Create Free Account'}
          </button>
        </form>

        <div className="pt-1 text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
