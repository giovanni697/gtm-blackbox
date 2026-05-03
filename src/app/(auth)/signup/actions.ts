'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { isPersonalEmail } from '@/lib/auth/personal-email-domains'
import { createClient } from '@/lib/supabase/server'

const SignupSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(80, 'Nome muito longo'),
  email: z
    .string()
    .email('E-mail inválido')
    .refine(
      (e) => !isPersonalEmail(e),
      'Use seu e-mail corporativo (ex: nome@suaempresa.com.br). E-mails pessoais não são aceitos.',
    ),
  password: z.string().min(8, 'Senha precisa ter pelo menos 8 caracteres'),
})

export type SignupState = { error?: string; needsConfirmation?: boolean }

export async function signup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = SignupSchema.safeParse({
    nome: formData.get('nome'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { nome: parsed.data.nome },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Esse e-mail já está cadastrado. Tente fazer login.' }
    }
    return { error: error.message }
  }

  // Se confirmação de e-mail estiver desabilitada no Supabase, vem session direto.
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/hub')
  }

  // Caso contrário (e-mail confirmation ON), mostra mensagem.
  return { needsConfirmation: true }
}
