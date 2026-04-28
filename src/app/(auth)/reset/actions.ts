'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ResetSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type ResetState = { error?: string; sent?: boolean }

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = ResetSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'E-mail inválido' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/hub`,
  })

  if (error) {
    return { error: error.message }
  }

  return { sent: true }
}
