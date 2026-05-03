import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = new Set(['giovanni@scient.cc'])

export async function requireAdmin() {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.has(user.email)) {
    redirect('/hub')
  }
  return user
}
