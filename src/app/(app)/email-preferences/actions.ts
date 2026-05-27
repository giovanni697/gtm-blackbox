'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function unsubscribeEmails(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service
    .from('email_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'queued')

  return error ? { ok: false, error: error.message } : { ok: true }
}
