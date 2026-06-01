import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  nome: string
  empresa: string | null
  cargo: string | null
  setor: string | null
  diagnostico_concluido: boolean
  forecast_concluido: boolean
  created_at: string
}

interface DiagnosticoRow {
  user_id: string
  estagio: string
  gargalo_pilar: number
  score_total: number
  percentual_maturidade: number
  ai_ready: boolean
  created_at: string
}

interface ForecastRow {
  user_id: string
  created_at: string
}

interface WizardRow {
  user_id: string
  pilar_atual: string | null
  updated_at: string
}

interface RoadmapCount {
  user_id: string
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function fmtDatetime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AnalyticsPage() {
  await requireAdmin()
  const sb = createServiceClient()

  const [
    { data: profiles },
    { data: diagnosticos },
    { data: forecasts },
    { data: wizardSessions },
    { data: roadmapItens },
  ] = await Promise.all([
    sb.from('profiles').select('*').order('created_at', { ascending: false }),
    sb
      .from('diagnosticos')
      .select(
        'user_id, estagio, gargalo_pilar, score_total, percentual_maturidade, ai_ready, created_at',
      )
      .order('created_at', { ascending: false }),
    sb
      .from('forecast_sessions')
      .select('user_id, created_at')
      .order('created_at', { ascending: false }),
    sb
      .from('wizard_sessions')
      .select('user_id, pilar_atual, updated_at')
      .order('updated_at', { ascending: false }),
    sb.from('roadmap_itens').select('user_id'),
  ])

  const allProfiles = (profiles ?? []) as Profile[]
  const allDiagnosticos = (diagnosticos ?? []) as DiagnosticoRow[]
  const allForecasts = (forecasts ?? []) as ForecastRow[]
  const allWizard = (wizardSessions ?? []) as WizardRow[]
  const allRoadmap = (roadmapItens ?? []) as RoadmapCount[]

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const total = allProfiles.length
  const completedOnboarding = allProfiles.filter((p) => p.empresa !== null).length
  const completedDiagnostico = allProfiles.filter((p) => p.diagnostico_concluido).length
  const completedForecast = allProfiles.filter((p) => p.forecast_concluido).length
  const startedDiagnostico = new Set(allWizard.map((w) => w.user_id)).size

  const uniqueDiagnosticoUsers = new Set(allDiagnosticos.map((d) => d.user_id)).size
  const totalDiagnosticoRuns = allDiagnosticos.length
  const aiReadyCount = allDiagnosticos.filter((d) => d.ai_ready).length
  const avgMaturidade =
    allDiagnosticos.length > 0
      ? (
          allDiagnosticos.reduce((s, d) => s + d.percentual_maturidade, 0) / allDiagnosticos.length
        ).toFixed(1)
      : '—'

  const roadmapByUser = allRoadmap.reduce<Record<string, number>>((acc, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1
    return acc
  }, {})

  // ── Signups by day ────────────────────────────────────────────────────────────
  const signupsByDay = allProfiles.reduce<Record<string, number>>((acc, p) => {
    const day = p.created_at.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})
  const signupDays = Object.entries(signupsByDay).sort(([a], [b]) => a.localeCompare(b))

  // ── Top users scoring ─────────────────────────────────────────────────────────
  const forecastCountByUser = allForecasts.reduce<Record<string, number>>((acc, f) => {
    acc[f.user_id] = (acc[f.user_id] ?? 0) + 1
    return acc
  }, {})
  const diagnosticoCountByUser = allDiagnosticos.reduce<Record<string, number>>((acc, d) => {
    acc[d.user_id] = (acc[d.user_id] ?? 0) + 1
    return acc
  }, {})

  const scoredProfiles = allProfiles
    .map((p) => {
      const diagCount = diagnosticoCountByUser[p.id] ?? 0
      const fcastCount = forecastCountByUser[p.id] ?? 0
      const roadCount = roadmapByUser[p.id] ?? 0
      const onboard = p.empresa ? 1 : 0
      const score = diagCount * 3 + fcastCount * 3 + roadCount + onboard * 2
      return { ...p, diagCount, fcastCount, roadCount, score }
    })
    .sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at))
    .slice(0, 20)

  // ── Gargalo distribution ──────────────────────────────────────────────────────
  const gargalos = allDiagnosticos.reduce<Record<number, number>>((acc, d) => {
    acc[d.gargalo_pilar] = (acc[d.gargalo_pilar] ?? 0) + 1
    return acc
  }, {})

  const pilarNames: Record<number, string> = {
    1: 'P1 Geração',
    2: 'P2 Conversão',
    3: 'P3 Expansão',
    4: 'P4 Retenção',
    5: 'P5 Monetização',
  }

  // ── Recent signups ────────────────────────────────────────────────────────────
  const recent = allProfiles.slice(0, 15)

  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(0) + '%' : '—')

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">Admin</p>
      <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">Analytics · Usuários</h1>
      <p className="text-scient-muted mt-1 font-sora text-sm">
        Dados ao vivo do Supabase — atualiza a cada request
      </p>
      <a
        href="/admin/command-center"
        className="mt-3 inline-block font-sora text-xs text-[#0030E8] hover:underline"
      >
        → Ver Command Center completo (emails + API keys + consumo)
      </a>

      {/* ── KPIs ──────────────────────────────────────────────────────────────── */}
      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Cadastros', value: total, color: '#0030E8' },
          {
            label: 'Onboarding',
            value: `${completedOnboarding} (${pct(completedOnboarding)})`,
            color: '#6B7280',
          },
          {
            label: 'Diagnóstico',
            value: `${completedDiagnostico} (${pct(completedDiagnostico)})`,
            color: '#40E0A8',
          },
          {
            label: 'Forecast',
            value: `${completedForecast} (${pct(completedForecast)})`,
            color: '#A855F7',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="border-scient-border rounded border p-4">
            <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
              {label}
            </p>
            <p className="mt-1 font-sora text-2xl font-light" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* ── Funnel ────────────────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-scient-ink font-sora text-xl font-medium">Funil de Ativação</h2>
        <div className="mt-4 space-y-2">
          {[
            { label: '1. Cadastrou', n: total, pctN: total },
            {
              label: '2. Fez onboarding (empresa preenchida)',
              n: completedOnboarding,
              pctN: total,
            },
            { label: '3. Iniciou diagnóstico (wizard)', n: startedDiagnostico, pctN: total },
            { label: '4. Concluiu diagnóstico', n: completedDiagnostico, pctN: total },
            { label: '5. Concluiu forecast', n: completedForecast, pctN: total },
          ].map(({ label, n, pctN }) => {
            const width = pctN > 0 ? (n / pctN) * 100 : 0
            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-scient-ink w-72 font-sora text-xs">{label}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded bg-[#0030E8] opacity-70"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-scient-ink w-16 text-right font-sora text-xs font-medium">
                  {n} ({((n / total) * 100).toFixed(0)}%)
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Signups por dia ──────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-scient-ink font-sora text-xl font-medium">Cadastros por Dia</h2>
        <div className="mt-4 flex items-end gap-2">
          {signupDays.map(([day, count]) => {
            const maxCount = Math.max(...signupDays.map(([, c]) => c))
            const height = Math.max(20, (count / maxCount) * 120)
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <span className="text-scient-ink font-sora text-3xs font-medium">{count}</span>
                <div
                  className="w-12 rounded-t bg-[#0030E8] opacity-80"
                  style={{ height: `${height}px` }}
                />
                <span className="text-scient-muted font-sora text-3xs">{day.slice(5)}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Diagnóstico stats ─────────────────────────────────────────────────── */}
      <section className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Runs totais', value: totalDiagnosticoRuns, color: '#0030E8' },
          { label: 'Usuários únicos', value: uniqueDiagnosticoUsers, color: '#40E0A8' },
          { label: 'AI Ready', value: aiReadyCount, color: '#A855F7' },
          { label: 'Maturidade média', value: `${avgMaturidade}%`, color: '#F97316' },
        ].map(({ label, value, color }) => (
          <div key={label} className="border-scient-border rounded border p-4">
            <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
              {label}
            </p>
            <p className="mt-1 font-sora text-2xl font-light" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </section>

      {/* ── Gargalo pilar distribution ───────────────────────────────────────── */}
      {Object.keys(gargalos).length > 0 && (
        <section className="mt-10">
          <h2 className="text-scient-ink font-sora text-xl font-medium">Gargalos Identificados</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {Object.entries(gargalos).map(([pilar, count]) => (
              <div key={pilar} className="border-scient-border min-w-[130px] rounded border p-4">
                <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
                  {pilarNames[Number(pilar)] ?? `Pilar ${pilar}`}
                </p>
                <p className="mt-1 font-sora text-2xl font-light text-[#0030E8]">{count}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Top 20 usuários ──────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-scient-ink font-sora text-xl font-medium">
          Top 20 Usuários por Engajamento
        </h2>
        <table className="mt-4 w-full font-sora text-xs">
          <thead>
            <tr className="border-scient-border text-scient-muted border-b text-left">
              <th className="pb-2 pr-3">#</th>
              <th className="pb-2 pr-3">Nome</th>
              <th className="pb-2 pr-3">Empresa</th>
              <th className="pb-2 pr-3">Cargo</th>
              <th className="pb-2 pr-3 text-center">Onboarding</th>
              <th className="pb-2 pr-3 text-center">Diag</th>
              <th className="pb-2 pr-3 text-center">Forecast</th>
              <th className="pb-2 pr-3 text-center">Roadmap</th>
              <th className="pb-2">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {scoredProfiles.map((p, i) => (
              <tr key={p.id} className="border-scient-border border-b hover:bg-gray-50">
                <td className="text-scient-muted py-2 pr-3">{i + 1}</td>
                <td className="text-scient-ink py-2 pr-3 font-medium">{p.nome}</td>
                <td className="text-scient-muted py-2 pr-3">{p.empresa ?? '—'}</td>
                <td className="text-scient-muted py-2 pr-3">{p.cargo ?? '—'}</td>
                <td className="py-2 pr-3 text-center">{p.empresa ? '✓' : '—'}</td>
                <td className="py-2 pr-3 text-center">
                  {p.diagCount > 0 ? <span className="text-[#40E0A8]">{p.diagCount}×</span> : '—'}
                </td>
                <td className="py-2 pr-3 text-center">
                  {p.fcastCount > 0 ? (
                    <span className="text-purple-500">{p.fcastCount}×</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 pr-3 text-center">
                  {p.roadCount > 0 ? <span className="text-[#0030E8]">{p.roadCount}</span> : '—'}
                </td>
                <td className="text-scient-muted py-2">{fmt(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Últimos cadastros ────────────────────────────────────────────────── */}
      <section className="mt-10">
        <h2 className="text-scient-ink font-sora text-xl font-medium">Últimos 15 Cadastros</h2>
        <table className="mt-4 w-full font-sora text-xs">
          <thead>
            <tr className="border-scient-border text-scient-muted border-b text-left">
              <th className="pb-2 pr-4">Nome</th>
              <th className="pb-2 pr-4">Empresa</th>
              <th className="pb-2">Data/hora</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id} className="border-scient-border border-b">
                <td className="text-scient-ink py-2 pr-4">{p.nome}</td>
                <td className="text-scient-muted py-2 pr-4">{p.empresa ?? '—'}</td>
                <td className="text-scient-muted py-2">{fmtDatetime(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
