import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/server'
import type { CapacityStatus, ForecastOutput, ValidationWarning } from '@/lib/forecast/types'
import { MOTION_LABEL } from '@/lib/forecast/benchmarks-por-motion'

const STATUS_COLOR: Record<CapacityStatus, string> = {
  critico: 'border-red-300 bg-red-50 text-red-700',
  falta: 'border-orange-300 bg-orange-50 text-orange-700',
  ok: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  sobra: 'border-yellow-300 bg-yellow-50 text-yellow-700',
}

const STATUS_ICON: Record<CapacityStatus, string> = {
  critico: '🔴',
  falta: '🟠',
  ok: '🟢',
  sobra: '🟡',
}

const FUNCAO_LABEL: Record<string, string> = {
  marketing: 'Marketing',
  pre_vendas: 'Pré-vendas',
  vendas: 'Vendas',
  cs: 'CS',
}

export default async function ForecastResultado() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: session } = await supabase
    .from('forecast_sessions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) redirect('/forecast/wizard')

  const output = session.outputs as ForecastOutput

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Forecast · Resultado
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Capacity diagnóstico
      </h1>

      {/* Verdict textual */}
      <div className="mt-8 bg-scient-dark px-6 py-6 text-white md:px-10 md:py-8">
        <p className="font-lexend text-3xs uppercase tracking-widest text-white/60">Verdict</p>
        <p className="mt-3 font-sora text-base leading-relaxed">{output.verdictTextual}</p>
      </div>

      {/* Warnings */}
      {output.warnings.length > 0 ? (
        <section className="mt-10">
          <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
            Avisos
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {output.warnings.map((w: ValidationWarning, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 border px-3 py-2 ${
                  w.severity === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : w.severity === 'warn'
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-scient-divider bg-scient-bg'
                }`}
              >
                {w.severity === 'critical' ? (
                  <AlertTriangle
                    size={14}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-red-600"
                  />
                ) : w.severity === 'warn' ? (
                  <AlertCircle
                    size={14}
                    strokeWidth={1.5}
                    className="mt-0.5 shrink-0 text-orange-600"
                  />
                ) : (
                  <Info size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-scient-gray" />
                )}
                <div>
                  <p className="font-sora text-2xs leading-relaxed">{w.message}</p>
                  {w.benchmark ? (
                    <p className="mt-1 font-sora text-3xs italic text-scient-gray">
                      Benchmark: {w.benchmark}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Capacity Verdicts */}
      <section className="mt-10">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Capacity por função × motion
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {output.capacityVerdicts.map((v, i) => (
            <div key={i} className={clsx('border px-4 py-3', STATUS_COLOR[v.status])}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-sora text-xs font-medium">
                  {STATUS_ICON[v.status]} {FUNCAO_LABEL[v.funcao] ?? v.funcao}
                  {v.motion !== 'agregado'
                    ? ` · ${MOTION_LABEL[v.motion as keyof typeof MOTION_LABEL]}`
                    : ''}
                </p>
                <p className="font-sora text-3xs uppercase tracking-widest">
                  {v.pctAtendimento}% atendimento · gap {v.gap.toFixed(1)}
                </p>
              </div>
              <p className="mt-1.5 font-sora text-2xs leading-relaxed">{v.message}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hiring Plan */}
      <section className="mt-10">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Hiring plan
        </p>
        <div
          className={`mt-3 border p-5 ${
            output.hiringPlan.viavel
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <p className="font-sora text-sm font-medium">
            {output.hiringPlan.viavel ? (
              <>
                <CheckCircle2
                  size={14}
                  strokeWidth={1.5}
                  className="mr-2 inline text-emerald-700"
                />
                Plano viável
              </>
            ) : (
              <>
                <AlertTriangle size={14} strokeWidth={1.5} className="mr-2 inline text-red-700" />
                Plano inviável via contratação dentro do horizonte
              </>
            )}
          </p>

          {output.hiringPlan.actions.length === 0 ? (
            <p className="mt-3 font-sora text-2xs leading-relaxed">
              Capacity atual atende a meta sem necessidade de hiring adicional.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {output.hiringPlan.actions.map((a, i) => (
                <li key={i} className="font-sora text-xs leading-relaxed">
                  <strong>
                    +{a.headcount} {a.role}
                  </strong>{' '}
                  em mês {a.mesContratacao} (full capacity em mês {a.mesFullCapacity})
                  {a.bloqueante ? (
                    <span className="mt-1 block text-2xs italic text-red-700">{a.bloqueante}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {!output.hiringPlan.viavel ? (
            <div className="mt-4">
              <p className="font-sora text-3xs uppercase tracking-widest text-scient-dark">
                Alternativas
              </p>
              <ol className="ml-5 mt-2 list-decimal font-sora text-2xs leading-relaxed">
                {output.hiringPlan.alternativasSeInviavel.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </section>

      {/* Metas por função */}
      <section className="mt-10">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Metas por função (mensal)
        </p>
        <ol className="mt-3 grid gap-px bg-scient-divider md:grid-cols-2">
          <Card
            title="Marketing"
            lines={[
              `${output.metricas.marketing.mqasPorMes} MQAs/mês`,
              `R$${output.metricas.marketing.rsPorMqa.toLocaleString('pt-BR')}/MQA`,
            ]}
          />
          <Card
            title="Pré-vendas"
            lines={[
              `${output.metricas.preVendas.sqlsTotalPorMes} SQLs total/mês`,
              `${output.metricas.preVendas.sqlsPorSdrPorMes} SQLs/SDR`,
            ]}
          />
          <Card
            title="Vendas"
            lines={[
              `${output.metricas.vendas.dealsTotalPorMes} deals/mês`,
              `${output.metricas.vendas.dealsPorAePorMes} deals/AE/mês`,
              `R$${(output.metricas.vendas.arrFechadoPorMes / 1000).toFixed(0)}K ARR/mês`,
            ]}
          />
          <Card
            title="CS"
            lines={[
              `${output.metricas.cs.contasPorCsm} contas/CSM`,
              `GRR target ${output.metricas.cs.grrTarget}%`,
              `NRR target ${output.metricas.cs.nrrTarget}%`,
            ]}
          />
        </ol>
      </section>

      {/* Scientific Forecast tabela */}
      <section className="mt-10">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Scientific Forecast (mês a mês)
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-2xs">
            <thead className="bg-scient-bg">
              <tr>
                <th className="border border-scient-divider px-2 py-2">Mês</th>
                <th className="border border-scient-divider px-2 py-2">BoP MRR</th>
                <th className="border border-scient-divider px-2 py-2">New Logo</th>
                <th className="border border-scient-divider px-2 py-2">Expansion</th>
                <th className="border border-scient-divider px-2 py-2">Churn</th>
                <th className="border border-scient-divider px-2 py-2">EoP MRR</th>
                <th className="border border-scient-divider px-2 py-2">Pipeline necessário</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {output.scientificForecast.map((m) => (
                <tr key={m.mes}>
                  <td className="border border-scient-divider px-2 py-1.5">{m.mes}</td>
                  <td className="border border-scient-divider px-2 py-1.5">
                    {(m.bopMrr / 1000).toFixed(0)}k
                  </td>
                  <td className="border border-scient-divider px-2 py-1.5">
                    {(m.newLogoMrr / 1000).toFixed(0)}k
                  </td>
                  <td className="border border-scient-divider px-2 py-1.5">
                    {(m.expansionMrr / 1000).toFixed(0)}k
                  </td>
                  <td className="border border-scient-divider px-2 py-1.5">
                    -{(m.churnMrr / 1000).toFixed(0)}k
                  </td>
                  <td className="border border-scient-divider px-2 py-1.5 font-semibold">
                    {(m.eopMrr / 1000).toFixed(0)}k
                  </td>
                  <td className="border border-scient-divider px-2 py-1.5">
                    {(m.pipelineCoverage / 1000).toFixed(0)}k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/forecast/exportar"
          className="inline-flex items-center gap-2 bg-scient-primary px-5 py-3 font-sora text-xs text-white hover:bg-scient-primary-hover"
        >
          Exportar TXT + Prompt Claude <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
        <Link
          href="/forecast/wizard"
          className="inline-flex items-center gap-2 border border-scient-divider px-5 py-3 font-sora text-xs hover:border-scient-primary"
        >
          Refazer com novos inputs
        </Link>
      </div>
    </div>
  )
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <li className="bg-white p-5">
      <p className="font-lexend text-3xs tracking-widest text-scient-gray">{title}</p>
      <div className="mt-2 flex flex-col gap-1 font-sora text-xs">
        {lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
    </li>
  )
}
