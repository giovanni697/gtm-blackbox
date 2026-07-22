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

  // Cancela todos os drip emails ainda na fila
  const { error: queueError } = await service
    .from('email_queue')
    .update({ status: 'cancelled' })
    .eq('user_id', user.id)
    .eq('status', 'queued')

  if (queueError) return { ok: false, error: queueError.message }

  // Marca perfil como opted_out para bloquear e-mails futuros (weekly dispatch)
  const { error: profileError } = await service
    .from('profiles')
    .update({ email_opted_out: true })
    .eq('id', user.id)

  return profileError ? { ok: false, error: profileError.message } : { ok: true }
}
