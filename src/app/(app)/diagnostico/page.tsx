import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function DiagnosticoGateway() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, empresa, faturamento_atual, estagio, diagnostico_concluido')
    .eq('id', user!.id)
    .single()

  const { data: ultimoDiag } = await supabase
    .from('diagnosticos')
    .select('id, percentual_maturidade, gargalo_pilar, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const onboardingFeito = !!(profile?.empresa && profile?.faturamento_atual)
  const diagFeito = !!ultimoDiag

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Módulo 02 · Diagnóstico
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Mapa de Maturidade GTM
      </h1>
      <p className="mt-4 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        Em ~30 minutos: avalia os 5 pilares, identifica seu gargalo via TOC, e gera um roadmap
        priorizado dos próximos 90 dias. Output: TXT + prompt para Claude criar artefato visual com
        a identidade da sua empresa.
      </p>

      <ol className="mt-12 flex flex-col gap-px bg-scient-divider">
        <Step
          done={onboardingFeito}
          number="01"
          title="Onboarding"
          description="Nome, empresa, faturamento, setor. Define seu estágio (ARMV/ARPE/ARE)."
          href={onboardingFeito ? '/diagnostico/onboarding' : '/diagnostico/onboarding'}
          cta={onboardingFeito ? 'Editar' : 'Começar'}
        />
        <Step
          done={diagFeito}
          number="02"
          title="Wizard dos 5 pilares"
          description={
            onboardingFeito
              ? `Perguntas adaptadas para estágio ${profile?.estagio ?? 'declarado'}.`
              : 'Pré-requisito: completar Onboarding.'
          }
          href={onboardingFeito ? '/diagnostico/wizard' : '#'}
          cta={diagFeito ? 'Refazer' : 'Iniciar'}
          disabled={!onboardingFeito}
        />
        <Step
          done={diagFeito}
          number="03"
          title="Resultado + Roadmap"
          description={
            diagFeito
              ? `Maturidade ${ultimoDiag?.percentual_maturidade?.toFixed(0)}% · Gargalo no Pilar ${ultimoDiag?.gargalo_pilar}`
              : 'Pré-requisito: completar Wizard.'
          }
          href={diagFeito ? '/diagnostico/resultado' : '#'}
          cta="Ver"
          disabled={!diagFeito}
        />
        <Step
          done={false}
          number="04"
          title="Exportar (TXT + Prompt Claude)"
          description="Download do roadmap em texto + prompt pronto para gerar artefato visual com a identidade da sua empresa."
          href={diagFeito ? '/diagnostico/exportar' : '#'}
          cta="Exportar"
          disabled={!diagFeito}
        />
      </ol>
    </div>
  )
}

function Step({
  done,
  number,
  title,
  description,
  href,
  cta,
  disabled,
}: {
  done: boolean
  number: string
  title: string
  description: string
  href: string
  cta: string
  disabled?: boolean
}) {
  const Icon = done ? CheckCircle2 : Circle
  const Wrapper = disabled ? 'div' : Link
  return (
    <Wrapper
      href={href}
      className={`group flex items-center gap-6 bg-white px-2 py-5 ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer transition-colors hover:bg-scient-bg'
      }`}
    >
      <Icon
        size={20}
        strokeWidth={1.5}
        className={done ? 'shrink-0 text-scient-accent' : 'shrink-0 text-scient-gray'}
      />
      <div className="min-w-0 flex-1">
        <p className="font-lexend text-3xs tracking-widest text-scient-gray">{number}</p>
        <h2 className="mt-0.5 font-sora text-base font-medium text-scient-dark">{title}</h2>
        <p className="mt-1 font-sora text-2xs leading-relaxed text-scient-gray">{description}</p>
      </div>
      {!disabled ? (
        <span className="inline-flex shrink-0 items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-primary">
          {cta} <ArrowRight size={12} strokeWidth={1.5} />
        </span>
      ) : null}
    </Wrapper>
  )
}
