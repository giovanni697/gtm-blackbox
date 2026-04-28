import { createClient } from '@/lib/supabase/server'
import { ModuleCard } from '@/components/ui/ModuleCard'

export default async function HubPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, empresa, diagnostico_concluido, forecast_concluido')
    .eq('id', user!.id)
    .single()

  const nome = profile?.nome ?? user?.email?.split('@')[0] ?? 'visitante'
  const primeiroNome = nome.split(' ')[0]

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Hub</p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Olá, {primeiroNome}.
      </h1>
      <p className="mt-4 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        A engenharia de Go-to-Market em uma única plataforma. Comece pelo Diagnóstico para entender
        onde você está, ou pelo Ebook para a moldura conceitual.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <ModuleCard
          href="/ebook"
          number="01 · CONHECIMENTO"
          title="Ebook · Metodologia"
          description="12 capítulos top-down: Princípios do Edson, 5 pilares, 4 modais, jornada de maturidade ARMV/ARPE/ARE, AI-Native."
          status="em-construcao"
          meta="~3h leitura"
        />
        <ModuleCard
          href="/diagnostico"
          number="02 · DIAGNÓSTICO"
          title="Mapa de Maturidade"
          description="Avalie os 5 pilares e receba um roadmap priorizado por TOC com gargalo, sprints e exportação para Claude."
          status={profile?.diagnostico_concluido ? 'concluido' : 'em-construcao'}
          meta="~30min"
        />
        <ModuleCard
          href="/templates"
          number="03 · IMPLEMENTAÇÃO"
          title="Templates & Rubricas"
          description="8 templates prontos: Arquitetura de Dados, Workflow GTM, Handbooks, Roadmap, MBR, Gargalos, Planos, Stack."
          status="em-construcao"
          meta="8 prontos"
        />
        <ModuleCard
          href="/forecast"
          number="04 · CAPACITY"
          title="Forecast & Capacity"
          description="Calculadora multi-motion. Inputs do funil + capacity por função → verdict, hiring plan e gap vs meta."
          status={profile?.forecast_concluido ? 'concluido' : 'em-construcao'}
          meta="~15min"
        />
      </div>

      <p className="mt-12 max-w-2xl font-sora text-3xs uppercase tracking-widest text-scient-gray">
        v0.1 · Phase 2 · Layout SCIENT aplicado
      </p>
    </div>
  )
}
