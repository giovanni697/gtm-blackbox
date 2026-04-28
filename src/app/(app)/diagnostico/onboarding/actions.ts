'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { FATURAMENTO_TO_ESTAGIO } from '@/lib/diagnostico/types'

const Schema = z.object({
  nome: z.string().min(2),
  empresa: z.string().min(1),
  cargo: z.string().optional(),
  setor: z.string().optional(),
  faturamento_atual: z.enum(['ate_20M_brl', '20M_200M_brl', 'acima_200M_brl']),
})

export type OnboardingState = { error?: string }

export async function saveOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = Schema.safeParse({
    nome: formData.get('nome'),
    empresa: formData.get('empresa'),
    cargo: formData.get('cargo') || undefined,
    setor: formData.get('setor') || undefined,
    faturamento_atual: formData.get('faturamento_atual'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada — faça login novamente' }

  const estagio = FATURAMENTO_TO_ESTAGIO[parsed.data.faturamento_atual]

  const { error } = await supabase
    .from('profiles')
    .update({
      nome: parsed.data.nome,
      empresa: parsed.data.empresa,
      cargo: parsed.data.cargo,
      setor: parsed.data.setor,
      faturamento_atual: parsed.data.faturamento_atual,
      estagio,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/diagnostico')
  redirect('/diagnostico/wizard')
}
