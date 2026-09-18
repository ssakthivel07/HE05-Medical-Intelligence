import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

// Lazily create the browser client when first used.
// Uses `@supabase/ssr` createBrowserClient so authentication sessions are
// saved to `document.cookie`, allowing Next.js 16 Server Components and
// proxy middleware to authenticate incoming requests seamlessly.
export function getBrowserSupabase(): SupabaseClient {
	if (supabase) return supabase

	const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
	const SUPABASE_PUBLISHABLE_KEY =
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

	if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
		throw new Error(
			'Missing public Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
		)
	}

	supabase = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
	return supabase
}

export default getBrowserSupabase
