import { createClient, SupabaseClient } from '@supabase/supabase-js'

// This file exposes an explicit factory for creating a service-role Supabase
// client. Do NOT use this for normal user-request handling — use the
// SSR cookie-aware client (`lib/supabase/ssrClient.ts`) which uses the
// publishable/anon key and preserves Row Level Security.

// The service-role client should only be created in isolated server-only
// code paths that truly require elevated privileges. Creating the service
// client requires `SUPABASE_SERVICE_ROLE_KEY` to be set in your deployment
// environment; this function will throw if it's missing when called.

export function createSupabaseServiceRoleClient(): SupabaseClient {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL) {
    throw new Error(
      'Missing server environment variable "SUPABASE_URL". Set this in your deployment environment.'
    )
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing server environment variable "SUPABASE_SERVICE_ROLE_KEY". This key is server-only and must NOT be exposed to the browser.'
    )
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}
