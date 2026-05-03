'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getMigrationStatus } from '@/lib/auth/email-migration'

const LoginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
  next: z.string().optional(),
})

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  // Bloquear login após cutoff date para users com e-mail pessoal
  const migration = getMigrationStatus(parsed.data.email)
  if (migration.needsMigration && migration.expired) {
    await supabase.auth.signOut()
    return {
      error:
        'Seu prazo de migração expirou. Crie uma nova conta com seu e-mail corporativo em /signup ou entre em contato com giovanni@scient.cc.',
    }
  }

  revalidatePath('/', 'layout')
  redirect(parsed.data.next && parsed.data.next.startsWith('/') ? parsed.data.next : '/hub')
}
