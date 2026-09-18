import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerUser } from '../../lib/supabase/ssrClient'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  let user = null
  try {
    const result = await getServerUser()
    user = result.user
  } catch {
    user = null
  }

  if (!user) redirect('/login')

  return <>{children}</>
}
