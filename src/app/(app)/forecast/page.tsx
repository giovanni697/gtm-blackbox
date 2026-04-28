import Link from 'next/link'
import { ArrowRight, Calculator, CheckCircle2, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function ForecastGateway() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa, faturamento_atual, forecast_concluido')
    .eq('id', user!.id)
    .single()

  const { data: ultima } = await supabase
    .from('forecast_sessions')
    .select('id, completed_at, hiring_plan')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const concluido = !!ultima?.completed_at
  const viavel = (ultima?.hiring_plan as { viavel?: boolean } | null)?.viavel

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Módulo 04 · Capacity
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Forecast & Capacity Planning
      </h1>
      <p className="mt-4 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        Calculadora multi-motion. Inputs do funil + capacity por função → verdict de capacity por
        (função × motion), hiring plan com flag de viabilidade, e scientific forecast mês a mês.
      </p>

      <div className="mt-8 border border-scient-divider bg-scient-bg p-5">
        <p className="font-sora text-2xs italic leading-relaxed text-scient-dark">
          Esta calculadora usa relações matemáticas e benchmarks canônicos da metodologia SCIENT
          (Pavilion, ICONIQ, constantes de mercado validadas em campo). Os outputs são estimativas
          estruturadas, não promessas. Sua realidade pode divergir — use para orientar conversas com
          o time, não para travar metas.
        </p>
      </div>

      <ol className="mt-12 flex flex-col gap-px bg-scient-divider">
        <Step
          done={!!profile?.faturamento_atual}
          number="01"
          title="Pré-requisito: Onboarding feito"
          description="Sua empresa, faturamento e estágio já foram declarados em Diagnóstico → Onboarding."
          href="/diagnostico/onboarding"
          cta={profile?.empresa ? 'Editar' : 'Fazer'}
        />
        <Step
          done={concluido}
          number="02"
          title="Calcular Capacity"
          description={
            concluido
              ? `Última sessão: ${viavel ? 'plano viável' : 'plano inviável — alternativas geradas'}`
              : 'Wizard de ~15 minutos. Inputs por motion ativo + funil + capacity atual.'
          }
          href="/forecast/wizard"
          cta={concluido ? 'Refazer' : 'Iniciar'}
        />
        <Step
          done={false}
          number="03"
          title="Resultado + Exportar"
          description="Verdict de capacity, hiring plan, scientific forecast, TXT + prompt Claude."
          href={concluido ? '/forecast/resultado' : '#'}
          cta="Ver"
          disabled={!concluido}
        />
      </ol>

      <div className="mt-12 bg-scient-dark px-6 py-8 text-white">
        <Calculator size={20} strokeWidth={1.5} className="text-scient-primary" />
        <p className="mt-3 font-lexend text-3xs uppercase tracking-widest text-white/60">
          Multi-motion suportado
        </p>
        <p className="mt-2 font-sora text-sm leading-relaxed text-white/80">
          Se você opera mais de um modal de fechamento (No-touch, Low, Mid, High-touch ou Canal), a
          calculadora trata cada um separadamente. ACV, ciclo, win rate e capacity são declarados
          por motion.
        </p>
      </div>
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
