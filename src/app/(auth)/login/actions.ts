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

const MagicLinkSchema = z.object({
  email: z.string().email('E-mail inválido'),
  next: z.string().optional(),
})

export type LoginState = { error?: string }

export type MagicLinkState = { error?: string; sent?: boolean; email?: string }

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

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const parsed = MagicLinkSchema.safeParse({
    email: formData.get('email'),
    next: formData.get('next'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'E-mail inválido' }
  }

  // Bloquear envio para users com e-mail pessoal cujo prazo já expirou
  const migration = getMigrationStatus(parsed.data.email)
  if (migration.needsMigration && migration.expired) {
    return {
      error:
        'Seu prazo de migração expirou. Crie uma nova conta com seu e-mail corporativo em /signup.',
    }
  }

  const next = parsed.data.next && parsed.data.next.startsWith('/') ? parsed.data.next : '/hub'
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false, // só permite OTP para users existentes
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    // Não vazamos se o e-mail existe ou não — sempre dizemos "verifique sua caixa"
    return { sent: true, email: parsed.data.email }
  }

  return { sent: true, email: parsed.data.email }
}
