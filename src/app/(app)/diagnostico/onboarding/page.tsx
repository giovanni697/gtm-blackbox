import { OnboardingForm } from './OnboardingForm'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, empresa, cargo, setor, faturamento_atual')
    .eq('id', user!.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Diagnóstico · Onboarding
      </p>
      <h1 className="mt-2 font-sora text-2xl font-light leading-tight text-scient-dark md:text-3xl">
        Vamos personalizar seu diagnóstico
      </h1>
      <p className="mt-3 font-sora text-sm leading-relaxed text-scient-gray">
        Suas respostas vão definir quais perguntas o wizard apresenta (perguntas mais profundas para
        estágios mais maduros) e como o roadmap é priorizado.
      </p>

      <OnboardingForm initial={profile ?? null} />
    </div>
  )
}
