Supabase utilities for the Next.js App Router

Files:
- `env.ts` — small helper to read environment variables and fail with clear errors.
- `browser.ts` — a browser-safe singleton `SupabaseClient` using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `server.ts` — optional server-only factory `createSupabaseServiceRoleClient()` using `SUPABASE_SERVICE_ROLE_KEY` (admin only).

Environment variables (examples; do not commit secrets):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL, exposed to browser.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable (anon) key for client usage.
- `SUPABASE_URL` — same as above, used server-side.
- `SUPABASE_SERVICE_ROLE_KEY` — Service Role key for admin server operations (server-only). Never expose this to the browser.

Usage:
- Import `lib/supabase/browser.ts` in client components or browser code.
- Use `createServerSupabase()` / `getServerUser()` from `lib/supabase/ssrClient.ts` in server components, API routes, or server actions for normal user requests.
- Only use `createSupabaseServiceRoleClient()` from `lib/supabase/server.ts` in isolated server-only admin contexts where elevated privileges are required.

Security:
- Never commit `SUPABASE_SERVICE_ROLE_KEY` or other secrets to source control.
- Only use the service role key in server-only code paths.
