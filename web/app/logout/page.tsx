"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import getBrowserSupabase from '../../lib/supabase/browser'

export default function LogoutPage() {
  const router = useRouter()
  const [loading] = useState(true)

  useEffect(() => {
    async function signOut() {
      try {
        const supabase = getBrowserSupabase()
        await supabase.auth.signOut()
      } catch {
        // Fallback: proceed to login even if network call failed
      } finally {
        router.replace('/login')
        router.refresh()
      }
    }
    signOut()
  }, [router])

  return <div className="py-16 text-center">{loading ? 'Signing out…' : null}</div>
}
