import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerguntasByPilar } from '@/lib/content/readPerguntas'
import { PILARES } from '@/lib/diagnostico/types'
import type { Estagio, Resposta } from '@/lib/diagnostico/types'
import { WizardForm } from './WizardForm'

export default async function WizardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa, faturamento_atual, estagio')
    .eq('id', user!.id)
    .single()

  if (!profile?.faturamento_atual) {
    redirect('/diagnostico/onboarding')
  }

  const estagio = (profile.estagio ?? 'ARMV') as Estagio
  const perguntasMap = await getPerguntasByPilar(estagio)

  const { data: session } = await supabase
    .from('wizard_sessions')
    .select('respostas')
    .eq('user_id', user!.id)
    .maybeSingle()

  const respostasIniciais = (session?.respostas ?? {}) as Record<string, Resposta>

  const grupos = PILARES.map((p) => ({
    pilar: p,
    perguntas: perguntasMap.get(p.numero) ?? [],
  }))

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Diagnóstico · Wizard
      </p>
      <h1 className="mt-2 font-sora text-2xl font-light leading-tight text-scient-dark md:text-3xl">
        Os 5 pilares
      </h1>
      <p className="mt-3 font-sora text-sm leading-relaxed text-scient-gray">
        Para cada pergunta: <strong>Sim</strong> (já implementado), <strong>Parcial</strong> (em
        construção), <strong>Não</strong> (ainda não fizemos). Suas respostas salvam automaticamente
        — pode pausar e voltar.
      </p>
      <p className="mt-3 font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Estágio: {estagio} · {profile.empresa}
      </p>

      <WizardForm grupos={grupos} respostasIniciais={respostasIniciais} />
    </div>
  )
}
