import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient, User } from '@supabase/supabase-js'

// Read env vars directly with server-side fallbacks. During Next's build or
// prerender, `NEXT_PUBLIC_*` variables may not be present in some worker
// contexts; prefer `SUPABASE_URL` when available on the server, but for
// normal requests we'll use the publishable/anon key so RLS applies.

// Returns a server-side supabase client bound to the incoming request's
// cookies so `auth` calls reflect the visitor's session. This client
// uses the public/publishable key (anon) so Row Level Security remains in
// effect for normal user requests.
export async function createServerSupabase(): Promise<SupabaseClient> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const SUPABASE_PUBLISHABLE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL) {
    throw new Error(
      'Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in your environment.'
    )
  }

  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing public Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored when Next.js middleware refreshes user sessions.
        }
      },
    },
  })
}

export async function getServerUser(): Promise<{
  supabase: SupabaseClient | null
  user: User | null
}> {
  try {
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      // Don't leak internal errors to the browser — return null for unauthenticated
      return { supabase, user: null }
    }

    return { supabase, user }
  } catch {
    return { supabase: null, user: null }
  }
}

