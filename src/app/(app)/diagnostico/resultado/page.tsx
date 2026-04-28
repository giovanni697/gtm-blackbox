import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RadarMaturidade } from '@/components/diagnostico/RadarMaturidade'
import { GargaloBanner } from '@/components/diagnostico/GargaloBanner'
import { PILARES, NIVEL_LABELS, ESTAGIO_LABEL, type NivelMaturidade } from '@/lib/diagnostico/types'

export default async function ResultadoPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!diag) redirect('/diagnostico')

  const niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade> = {
    1: diag.p1_nivel as NivelMaturidade,
    2: diag.p2_nivel as NivelMaturidade,
    3: diag.p3_nivel as NivelMaturidade,
    4: diag.p4_nivel as NivelMaturidade,
    5: diag.p5_nivel as NivelMaturidade,
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Diagnóstico · Resultado
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Onde sua operação está hoje
      </h1>
      <p className="mt-3 font-sora text-sm text-scient-gray">
        Estágio declarado: <strong>{ESTAGIO_LABEL[diag.estagio as 'ARMV' | 'ARPE' | 'ARE']}</strong>
      </p>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Radar de Maturidade
          </p>
          <div className="mt-3">
            <RadarMaturidade
              niveis={niveis}
              gargaloPilar={diag.gargalo_pilar as 1 | 2 | 3 | 4 | 5}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="border border-scient-divider bg-white p-6">
            <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
              Maturidade geral
            </p>
            <p className="mt-2 font-sora text-4xl font-light text-scient-dark">
              {diag.percentual_maturidade?.toFixed(0)}
              <span className="text-2xl text-scient-gray">%</span>
            </p>
            <p className="mt-2 font-sora text-2xs text-scient-gray">
              {diag.score_total} pontos do total possível
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ReadyBadge label="AI-ready" ok={diag.ai_ready} />
            <ReadyBadge label="ARPE-ready" ok={diag.arpe_ready} />
            <ReadyBadge label="ARE-ready" ok={diag.are_ready} />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <GargaloBanner
          gargaloPilar={diag.gargalo_pilar as 1 | 2 | 3 | 4 | 5}
          nivel={niveis[diag.gargalo_pilar as 1 | 2 | 3 | 4 | 5]}
        />
      </div>

      <div className="mt-10">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Detalhamento por pilar
        </p>
        <ol className="mt-4 flex flex-col gap-px bg-scient-divider">
          {PILARES.map((p) => {
            const n = niveis[p.numero]
            const isGargalo = p.numero === diag.gargalo_pilar
            return (
              <li key={p.numero} className="bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                      P{p.numero}
                      {isGargalo ? ' · GARGALO' : ''}
                    </p>
                    <h3 className="mt-1 font-sora text-base font-medium text-scient-dark">
                      {p.nome}
                    </h3>
                    <p className="mt-1 font-sora text-2xs text-scient-gray">{p.descricao}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sora text-xl font-light text-scient-dark">
                      {n}
                      <span className="text-sm text-scient-gray">/3</span>
                    </p>
                    <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                      {NIVEL_LABELS[n]}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/diagnostico/roadmap"
          className="inline-flex items-center gap-2 bg-scient-primary px-5 py-3 font-sora text-xs text-white hover:bg-scient-primary-hover"
        >
          Ver Roadmap priorizado <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
        <Link
          href="/diagnostico/exportar"
          className="inline-flex items-center gap-2 border border-scient-divider px-5 py-3 font-sora text-xs hover:border-scient-primary"
        >
          Exportar TXT + Prompt Claude
        </Link>
      </div>
    </div>
  )
}

function ReadyBadge({ label, ok }: { label: string; ok: boolean | null }) {
  return (
    <div className="border border-scient-divider bg-white p-3 text-center">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">{label}</p>
      <p
        className={`mt-1 font-sora text-sm font-medium ${
          ok ? 'text-scient-accent' : 'text-scient-armv'
        }`}
      >
        {ok ? 'Sim' : 'Ainda não'}
      </p>
    </div>
  )
}
