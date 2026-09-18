export function getEnvVar(name: string, required = true): string {
  const val = process.env[name]
  if (!val && required) {
    throw new Error(
      `Missing environment variable "${name}". Set it in your environment (e.g. .env.local) and do NOT commit secrets to source control.`
    )
  }
  return val ?? ''
}

// Preferred public publishable key name for the app. If the older
// `NEXT_PUBLIC_SUPABASE_ANON_KEY` is present, instruct the deployer to
// migrate to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` rather than silently
// supporting both names to avoid configuration confusion.
export function getPublicPublishableKey(): string {
  const preferred = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const legacy = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (preferred) return preferred

  if (legacy) {
    throw new Error(
      'Found legacy environment variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Please rename it to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for consistency.'
    )
  }

  throw new Error(
    'Missing public Supabase key. Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your environment (do not commit secrets).'
  )
}
