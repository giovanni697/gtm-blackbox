import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

// ── Types ─────────────────────────────────────────────────────────────────────
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
interface DiagRow {
  user_id: string
  gargalo_pilar: number
  percentual_maturidade: number
  ai_ready: boolean
  created_at: string
}
interface WizardRow {
  user_id: string
  updated_at: string
}
interface ForecastRow {
  user_id: string
  created_at: string
}
interface RoadmapRow {
  user_id: string
}
interface EmailRow {
  id: string
  user_id: string
  to_name: string
  to_email: string
  campaign: string
  status: string
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  feedback_text: string | null
  error_message: string | null
  created_at: string
}
interface ApiKeyRow {
  id: string
  user_id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}
interface ApiUsageRow {
  id: number
  user_id: string | null
  event_type: string
  model: string | null
  input_tokens: number
  output_tokens: number
  cost_usd: number
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PILAR: Record<number, string> = {
  1: 'Geração',
  2: 'Conversão',
  3: 'Expansão',
  4: 'Retenção',
  5: 'Monetização',
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function isoWeek(d: string): string {
  const dt = new Date(d)
  const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function pct(n: number, d: number) {
  if (d === 0) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

function getSegment(p: Profile, wizardSet: Set<string>): string {
  if (!p.empresa) return 'no_profile'
  if (p.diagnostico_concluido && p.forecast_concluido) return 'power_user'
  if (p.diagnostico_concluido) return 'diagnosed'
  if (wizardSet.has(p.id)) return 'dropped'
  return 'onboarded'
}

const SEG_LABEL: Record<string, string> = {
  no_profile: 'Sem perfil',
  onboarded: 'Onboarded',
  dropped: 'Dropped',
  diagnosed: 'Diagnosticado',
  power_user: 'Power User',
}
const SEG_COLOR: Record<string, string> = {
  no_profile: '#9CA3AF',
  onboarded: '#0030E8',
  dropped: '#F97316',
  diagnosed: '#40E0A8',
  power_user: '#A855F7',
}

function SegBadge({ seg }: { seg: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        fontSize: 9,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: SEG_COLOR[seg] ?? '#585858',
        border: `1px solid ${SEG_COLOR[seg] ?? '#585858'}`,
        borderRadius: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {SEG_LABEL[seg] ?? seg}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: '#F97316',
    sending: '#0030E8',
    sent: '#40E0A8',
    failed: '#EF4444',
    dry_run: '#9CA3AF',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 7px',
        fontSize: 9,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: colors[status] ?? '#585858',
        border: `1px solid ${colors[status] ?? '#585858'}`,
        borderRadius: 2,
      }}
    >
      {status}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function CommandCenterPage() {
  await requireAdmin()
  const sb = createServiceClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400_000).toISOString()

  const [
    { data: profiles },
    { data: diags },
    { data: wizardSessions },
    { data: forecasts },
    { data: roadmapItens },
    { data: emails },
    { data: apiKeys },
    apiUsageResult,
  ] = await Promise.all([
    sb.from('profiles').select('*').order('created_at', { ascending: false }),
    sb
      .from('diagnosticos')
      .select('user_id, gargalo_pilar, percentual_maturidade, ai_ready, created_at')
      .order('created_at', { ascending: false }),
    sb
      .from('wizard_sessions')
      .select('user_id, updated_at')
      .order('updated_at', { ascending: false }),
    sb
      .from('forecast_sessions')
      .select('user_id, created_at')
      .order('created_at', { ascending: false }),
    sb.from('roadmap_itens').select('user_id'),
    sb.from('manual_emails').select('*').order('created_at', { ascending: false }),
    sb
      .from('api_keys')
      .select('id, user_id, name, key_prefix, last_used_at, revoked_at, created_at')
      .order('created_at', { ascending: false }),
    sb.from('api_usage_log').select('*').order('created_at', { ascending: false }).limit(500),
  ])

  const apiUsageExists =
    !apiUsageResult.error || !apiUsageResult.error.message?.includes('api_usage_log')

  const allProfiles = (profiles ?? []) as Profile[]
  const allDiags = (diags ?? []) as DiagRow[]
  const allWizard = (wizardSessions ?? []) as WizardRow[]
  const allForecasts = (forecasts ?? []) as ForecastRow[]
  const allRoadmap = (roadmapItens ?? []) as RoadmapRow[]
  const allEmails = (emails ?? []) as EmailRow[]
  const allApiKeys = (apiKeys ?? []) as ApiKeyRow[]
  const allApiUsage = (apiUsageResult.data ?? []) as ApiUsageRow[]

  // ── Derived sets ──────────────────────────────────────────────────────────
  const wizardSet = new Set(allWizard.map((w) => w.user_id))

  const latestDiag: Record<string, DiagRow> = {}
  const diagRunCount: Record<string, number> = {}
  for (const d of [...allDiags].reverse()) {
    latestDiag[d.user_id] = d
    diagRunCount[d.user_id] = (diagRunCount[d.user_id] ?? 0) + 1
  }

  const forecastCount: Record<string, number> = {}
  for (const f of allForecasts) forecastCount[f.user_id] = (forecastCount[f.user_id] ?? 0) + 1

  const roadmapCount: Record<string, number> = {}
  for (const r of allRoadmap) roadmapCount[r.user_id] = (roadmapCount[r.user_id] ?? 0) + 1

  const profileById: Record<string, Profile> = {}
  for (const p of allProfiles) profileById[p.id] = p

  // ── Funnel ────────────────────────────────────────────────────────────────
  const total = allProfiles.length
  const nPerfil = allProfiles.filter((p) => p.empresa).length
  const nWizard = wizardSet.size
  const nDiag = allProfiles.filter((p) => p.diagnostico_concluido).length
  const nForecast = allProfiles.filter((p) => p.forecast_concluido).length

  // ── Segmentos ─────────────────────────────────────────────────────────────
  const segCount: Record<string, number> = {
    no_profile: 0,
    onboarded: 0,
    dropped: 0,
    diagnosed: 0,
    power_user: 0,
  }
  for (const p of allProfiles) segCount[getSegment(p, wizardSet)]++

  // ── Cadastros por semana (últimas 8) ─────────────────────────────────────
  const weekCount: Record<string, number> = {}
  for (const p of allProfiles) {
    const wk = isoWeek(p.created_at)
    weekCount[wk] = (weekCount[wk] ?? 0) + 1
  }
  const weekEntries = Object.entries(weekCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
  const maxWeek = Math.max(...weekEntries.map(([, n]) => n), 1)

  // ── KPI deltas (vs semana anterior) ───────────────────────────────────────
  const newUsersThisWeek = allProfiles.filter((p) => p.created_at >= sevenDaysAgo).length
  const newUsersPrevWeek = allProfiles.filter(
    (p) => p.created_at >= fourteenDaysAgo && p.created_at < sevenDaysAgo,
  ).length

  const sentEmails = allEmails.filter((e) => e.status === 'sent')
  const openedEmails = allEmails.filter((e) => e.opened_at)
  const clickedEmails = allEmails.filter((e) => e.clicked_at)
  const feedbackEmails = allEmails.filter((e) => e.feedback_text)
  const scheduledEmails = allEmails.filter((e) => e.status === 'scheduled')

  // ── Top 20 usuários ───────────────────────────────────────────────────────
  const scored = allProfiles
    .map((p) => {
      const dc = diagRunCount[p.id] ?? 0
      const fc = forecastCount[p.id] ?? 0
      const rc = roadmapCount[p.id] ?? 0
      const ob = p.empresa ? 2 : 0
      return { ...p, dc, fc, rc, score: dc * 3 + fc * 3 + rc + ob, seg: getSegment(p, wizardSet) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  // ── Gargalos ──────────────────────────────────────────────────────────────
  const gargCount: Record<number, number> = {}
  for (const d of allDiags) gargCount[d.gargalo_pilar] = (gargCount[d.gargalo_pilar] ?? 0) + 1
  const mats = allDiags.map((d) => d.percentual_maturidade)
  const avgMat = mats.length ? (mats.reduce((a, b) => a + b, 0) / mats.length).toFixed(1) : '—'

  // ── Campanhas de email ────────────────────────────────────────────────────
  const campMap: Record<
    string,
    {
      total: number
      sent: number
      scheduled: number
      failed: number
      opened: number
      clicked: number
      feedback: number
    }
  > = {}
  for (const e of allEmails) {
    const c = e.campaign ?? '—'
    if (!campMap[c])
      campMap[c] = {
        total: 0,
        sent: 0,
        scheduled: 0,
        failed: 0,
        opened: 0,
        clicked: 0,
        feedback: 0,
      }
    campMap[c].total++
    if (e.status === 'sent') campMap[c].sent++
    if (e.status === 'scheduled') campMap[c].scheduled++
    if (e.status === 'failed') campMap[c].failed++
    if (e.opened_at) campMap[c].opened++
    if (e.clicked_at) campMap[c].clicked++
    if (e.feedback_text) campMap[c].feedback++
  }
  const campEntries = Object.entries(campMap).sort(([a], [b]) => b.localeCompare(a))

  // ── API Keys ──────────────────────────────────────────────────────────────
  const activeKeys = allApiKeys.filter((k) => !k.revoked_at)
  const keysByUser: Record<string, ApiKeyRow[]> = {}
  for (const k of allApiKeys) {
    if (!keysByUser[k.user_id]) keysByUser[k.user_id] = []
    keysByUser[k.user_id].push(k)
  }

  // ── API Usage ─────────────────────────────────────────────────────────────
  const totalCostUsd = allApiUsage.reduce((s, r) => s + (r.cost_usd ?? 0), 0)
  const usageByType: Record<
    string,
    { runs: number; inputTokens: number; outputTokens: number; cost: number }
  > = {}
  const usageByUser: Record<string, { runs: number; tokens: number; cost: number }> = {}
  const usageByWeek: Record<string, number> = {}
  for (const r of allApiUsage) {
    const t = r.event_type
    if (!usageByType[t]) usageByType[t] = { runs: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
    usageByType[t].runs++
    usageByType[t].inputTokens += r.input_tokens ?? 0
    usageByType[t].outputTokens += r.output_tokens ?? 0
    usageByType[t].cost += r.cost_usd ?? 0
    if (r.user_id) {
      if (!usageByUser[r.user_id]) usageByUser[r.user_id] = { runs: 0, tokens: 0, cost: 0 }
      usageByUser[r.user_id].runs++
      usageByUser[r.user_id].tokens += (r.input_tokens ?? 0) + (r.output_tokens ?? 0)
      usageByUser[r.user_id].cost += r.cost_usd ?? 0
    }
    const wk = isoWeek(r.created_at)
    usageByWeek[wk] = (usageByWeek[wk] ?? 0) + (r.cost_usd ?? 0)
  }
  const usageWeekEntries = Object.entries(usageByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
  const maxCostWeek = Math.max(...usageWeekEntries.map(([, n]) => n), 0.0001)
  const topUsageUsers = Object.entries(usageByUser)
    .sort(([, a], [, b]) => b.cost - a.cost)
    .slice(0, 10)

  const migrationSql = `-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS api_usage_log (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL,
  model         TEXT,
  input_tokens  INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  duration_ms   INT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE api_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON api_usage_log USING (false);`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Admin</p>
      <h1 className="mt-1 font-sora text-3xl font-light text-scient-dark">Command Center</h1>
      <p className="mt-1 font-sora text-sm text-scient-gray">
        Dados ao vivo — atualiza a cada request ·{' '}
        <span className="text-scient-dark">
          {new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </p>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCO 1 — OVERVIEW KPIs
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-8">
        <p className="font-sora text-2xs uppercase tracking-widest text-scient-gray">
          01 — Overview
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {[
            { label: 'Cadastros', value: total, delta: newUsersThisWeek, color: '#0030E8' },
            { label: 'Com Perfil', value: nPerfil, delta: null, color: '#0030E8' },
            { label: 'Diagnósticos', value: nDiag, delta: null, color: '#40E0A8' },
            { label: 'Forecasts', value: nForecast, delta: null, color: '#A855F7' },
            { label: 'Emails Enviados', value: sentEmails.length, delta: null, color: '#0030E8' },
            {
              label: 'Open Rate',
              value: pct(openedEmails.length, sentEmails.length),
              delta: null,
              color: '#40E0A8',
            },
            {
              label: 'Click Rate',
              value: pct(clickedEmails.length, sentEmails.length),
              delta: null,
              color: '#F97316',
            },
            { label: 'Feedbacks', value: feedbackEmails.length, delta: null, color: '#EF4444' },
          ].map(({ label, value, delta, color }) => (
            <div key={label} className="rounded border border-scient-divider p-3">
              <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                {label}
              </p>
              <p className="mt-1 font-sora text-xl font-light" style={{ color }}>
                {value}
              </p>
              {delta !== null && (
                <p className="mt-0.5 font-sora text-3xs text-scient-gray">
                  +{delta} esta semana
                  {newUsersPrevWeek > 0 && (
                    <span
                      className={delta >= newUsersPrevWeek ? 'text-[#40E0A8]' : 'text-[#F97316]'}
                    >
                      {' '}
                      (vs {newUsersPrevWeek} ant.)
                    </span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCO 2 — USUÁRIOS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12">
        <p className="font-sora text-2xs uppercase tracking-widest text-scient-gray">
          02 — Usuários
        </p>

        {/* 2a. Funil */}
        <div className="mt-4 rounded border border-scient-divider p-5">
          <h2 className="font-sora text-base font-medium text-scient-dark">Funil de Ativação</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Cadastrou', n: total, prev: total },
              { label: 'Preencheu perfil', n: nPerfil, prev: total },
              { label: 'Iniciou diagnóstico', n: nWizard, prev: nPerfil },
              { label: 'Concluiu diagnóstico', n: nDiag, prev: nWizard },
              { label: 'Rodou Forecast', n: nForecast, prev: nDiag },
            ].map(({ label, n, prev }, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-4 font-sora text-2xs text-scient-gray">{i + 1}</span>
                <span className="w-44 font-sora text-xs text-scient-dark">{label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded-sm bg-scient-bg">
                  <div
                    className="h-full rounded-sm bg-[#0030E8] opacity-75 transition-all"
                    style={{ width: `${total > 0 ? (n / total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-20 text-right font-sora text-xs font-medium text-scient-dark">
                  {n} <span className="font-normal text-scient-gray">({pct(n, total)})</span>
                </span>
                {i > 0 && prev > 0 && (
                  <span className="w-24 text-right font-sora text-2xs text-scient-gray">
                    {pct(n, prev)} da etapa anterior
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2b. Segmentos + 2c. Semanas — lado a lado */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Segmentos */}
          <div className="rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">Segmentos</h2>
            <div className="mt-4 space-y-2">
              {Object.entries(segCount).map(([seg, count]) => (
                <div key={seg} className="flex items-center gap-3">
                  <span className="w-28">
                    <SegBadge seg={seg} />
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-sm bg-scient-bg">
                    <div
                      className="h-full rounded-sm"
                      style={{
                        width: `${total > 0 ? (count / total) * 100 : 0}%`,
                        backgroundColor: SEG_COLOR[seg],
                        opacity: 0.75,
                      }}
                    />
                  </div>
                  <span className="w-14 text-right font-sora text-xs text-scient-dark">
                    {count} <span className="text-scient-gray">({pct(count, total)})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cadastros por semana */}
          <div className="rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">
              Cadastros por Semana
            </h2>
            <div className="mt-4 flex items-end gap-2">
              {weekEntries.map(([wk, count]) => {
                const h = Math.max(8, (count / maxWeek) * 100)
                return (
                  <div key={wk} className="flex flex-1 flex-col items-center gap-1">
                    <span className="font-sora text-3xs font-medium text-scient-dark">{count}</span>
                    <div
                      className="w-full rounded-t bg-[#0030E8] opacity-70"
                      style={{ height: `${h}px` }}
                    />
                    <span className="font-sora text-3xs text-scient-gray">
                      {wk.replace(/\d{4}-/, '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2d. Top 20 usuários */}
        <div className="mt-4 rounded border border-scient-divider p-5">
          <h2 className="font-sora text-base font-medium text-scient-dark">
            Top 20 por Engajamento
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full font-sora text-xs">
              <thead>
                <tr className="border-b border-scient-divider text-left text-scient-gray">
                  <th className="pb-2 pr-3 font-normal">#</th>
                  <th className="pb-2 pr-3 font-normal">Nome</th>
                  <th className="pb-2 pr-3 font-normal">Empresa</th>
                  <th className="pb-2 pr-3 font-normal">Segmento</th>
                  <th className="pb-2 pr-3 text-center font-normal">Score</th>
                  <th className="pb-2 pr-3 text-center font-normal">Diag</th>
                  <th className="pb-2 pr-3 text-center font-normal">Fcast</th>
                  <th className="pb-2 pr-3 font-normal">Gargalo</th>
                  <th className="pb-2 font-normal">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {scored.map((p, i) => {
                  const ld = latestDiag[p.id]
                  return (
                    <tr key={p.id} className="border-b border-scient-divider hover:bg-scient-bg">
                      <td className="py-2 pr-3 text-scient-gray">{i + 1}</td>
                      <td className="py-2 pr-3 font-medium text-scient-dark">{p.nome}</td>
                      <td className="py-2 pr-3 text-scient-gray">{p.empresa ?? '—'}</td>
                      <td className="py-2 pr-3">
                        <SegBadge seg={p.seg} />
                      </td>
                      <td className="py-2 pr-3 text-center font-medium text-[#0030E8]">
                        {p.score}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        {p.dc > 0 ? (
                          <span className="text-[#40E0A8]">{p.dc}×</span>
                        ) : (
                          <span className="text-scient-gray">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-center">
                        {p.fc > 0 ? (
                          <span className="text-purple-500">{p.fc}×</span>
                        ) : (
                          <span className="text-scient-gray">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-scient-gray">
                        {ld ? (
                          <span>
                            {PILAR[ld.gargalo_pilar] ?? '—'}{' '}
                            <span className="text-scient-gray">
                              {ld.percentual_maturidade.toFixed(0)}%
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 text-scient-gray">{fmtDate(p.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2e. Gargalos + últimos cadastros */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">
              Gargalos Identificados{' '}
              <span className="font-normal text-scient-gray">· maturidade média {avgMat}%</span>
            </h2>
            <div className="mt-4 space-y-2">
              {Object.entries(gargCount)
                .sort(([, a], [, b]) => b - a)
                .map(([pilar, count]) => (
                  <div key={pilar} className="flex items-center gap-3">
                    <span className="w-28 font-sora text-xs text-scient-dark">
                      {PILAR[Number(pilar)] ?? `P${pilar}`}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-sm bg-scient-bg">
                      <div
                        className="h-full rounded-sm bg-[#0030E8] opacity-70"
                        style={{
                          width: `${(count / Math.max(...Object.values(gargCount))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-6 text-right font-sora text-xs text-scient-dark">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">Últimos Cadastros</h2>
            <div className="mt-3 space-y-2">
              {allProfiles.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-start gap-2">
                  <span className="mt-0.5 font-sora text-2xs text-scient-gray">
                    {fmt(p.created_at)}
                  </span>
                  <div>
                    <span className="font-sora text-xs font-medium text-scient-dark">{p.nome}</span>
                    {p.empresa && (
                      <span className="ml-2 font-sora text-2xs text-scient-gray">{p.empresa}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCO 3 — EMAILS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12">
        <p className="font-sora text-2xs uppercase tracking-widest text-scient-gray">03 — Emails</p>

        {/* 3a. KPIs de email */}
        <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-6">
          {[
            { label: 'Total', value: allEmails.length, color: '#111111' },
            { label: 'Enviados', value: sentEmails.length, color: '#0030E8' },
            { label: 'Agendados', value: scheduledEmails.length, color: '#F97316' },
            {
              label: 'Abertos',
              value: openedEmails.length,
              color: '#40E0A8',
              sub: pct(openedEmails.length, sentEmails.length),
            },
            {
              label: 'Clicados',
              value: clickedEmails.length,
              color: '#A855F7',
              sub: pct(clickedEmails.length, sentEmails.length),
            },
            { label: 'Feedbacks', value: feedbackEmails.length, color: '#EF4444' },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="rounded border border-scient-divider p-3">
              <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                {label}
              </p>
              <p className="mt-1 font-sora text-2xl font-light" style={{ color }}>
                {value}
              </p>
              {sub && <p className="font-sora text-2xs text-scient-gray">{sub}</p>}
            </div>
          ))}
        </div>

        {/* 3b. Por campanha */}
        <div className="mt-4 rounded border border-scient-divider p-5">
          <h2 className="font-sora text-base font-medium text-scient-dark">Por Campanha</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full font-sora text-xs">
              <thead>
                <tr className="border-b border-scient-divider text-left text-scient-gray">
                  <th className="pb-2 pr-4 font-normal">Campanha</th>
                  <th className="pb-2 pr-3 text-center font-normal">Total</th>
                  <th className="pb-2 pr-3 text-center font-normal">Enviados</th>
                  <th className="pb-2 pr-3 text-center font-normal">Agendados</th>
                  <th className="pb-2 pr-3 text-center font-normal">Falhos</th>
                  <th className="pb-2 pr-3 text-center font-normal">Abertos</th>
                  <th className="pb-2 pr-3 text-center font-normal">Open%</th>
                  <th className="pb-2 pr-3 text-center font-normal">Clicados</th>
                  <th className="pb-2 text-center font-normal">Feedbacks</th>
                </tr>
              </thead>
              <tbody>
                {campEntries.map(([camp, s]) => {
                  const campStatus =
                    s.failed > 0 ? 'failed' : s.scheduled > 0 ? 'scheduled' : 'sent'
                  return (
                    <tr key={camp} className="border-b border-scient-divider hover:bg-scient-bg">
                      <td className="py-2 pr-4">
                        <span className="font-medium text-scient-dark">{camp}</span>
                        <span className="ml-2">
                          <StatusBadge status={campStatus} />
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-center text-scient-gray">{s.total}</td>
                      <td className="py-2 pr-3 text-center font-medium text-[#0030E8]">{s.sent}</td>
                      <td className="py-2 pr-3 text-center text-[#F97316]">{s.scheduled || '—'}</td>
                      <td className="py-2 pr-3 text-center text-[#EF4444]">{s.failed || '—'}</td>
                      <td className="py-2 pr-3 text-center text-[#40E0A8]">{s.opened || '—'}</td>
                      <td className="py-2 pr-3 text-center text-scient-gray">
                        {s.sent > 0 ? pct(s.opened, s.sent) : '—'}
                      </td>
                      <td className="py-2 pr-3 text-center text-purple-500">{s.clicked || '—'}</td>
                      <td className="py-2 text-center text-[#EF4444]">{s.feedback || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3c. Feedbacks */}
        {feedbackEmails.length > 0 && (
          <div className="mt-4 rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">
              Feedbacks Recebidos{' '}
              <span className="font-normal text-scient-gray">({feedbackEmails.length})</span>
            </h2>
            <div className="mt-4 space-y-4">
              {feedbackEmails.map((e) => {
                const p = profileById[e.user_id]
                return (
                  <div key={e.id} className="rounded-sm bg-scient-bg p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sora text-xs font-medium text-scient-dark">
                        {p?.nome ?? e.to_name}
                      </span>
                      {p?.empresa && (
                        <span className="font-sora text-2xs text-scient-gray">{p.empresa}</span>
                      )}
                      <span className="ml-auto font-sora text-2xs text-scient-gray">
                        {e.campaign} · {fmtDate(e.sent_at)}
                      </span>
                    </div>
                    <p className="mt-2 font-sora text-xs leading-relaxed text-scient-dark">
                      {e.feedback_text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3d. Tabela de emails individuais (últimos 100) */}
        <div className="mt-4 rounded border border-scient-divider p-5">
          <h2 className="font-sora text-base font-medium text-scient-dark">
            Emails Individuais{' '}
            <span className="font-normal text-scient-gray">
              (últimos {Math.min(allEmails.length, 150)})
            </span>
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full font-sora text-xs">
              <thead>
                <tr className="border-b border-scient-divider text-left text-scient-gray">
                  <th className="pb-2 pr-3 font-normal">Para</th>
                  <th className="pb-2 pr-3 font-normal">Campanha</th>
                  <th className="pb-2 pr-3 font-normal">Status</th>
                  <th className="pb-2 pr-3 font-normal">Enviado</th>
                  <th className="pb-2 pr-3 font-normal">Abriu</th>
                  <th className="pb-2 pr-3 font-normal">Clicou</th>
                  <th className="pb-2 font-normal">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {allEmails.slice(0, 150).map((e) => (
                  <tr key={e.id} className="border-b border-scient-divider hover:bg-scient-bg">
                    <td className="py-1.5 pr-3">
                      <p className="font-medium text-scient-dark">{e.to_name}</p>
                      <p className="text-2xs text-scient-gray">{e.to_email}</p>
                    </td>
                    <td className="py-1.5 pr-3 text-scient-gray">{e.campaign}</td>
                    <td className="py-1.5 pr-3">
                      <StatusBadge status={e.status} />
                      {e.error_message && (
                        <p className="mt-0.5 line-clamp-1 text-3xs text-[#EF4444]">
                          {e.error_message}
                        </p>
                      )}
                    </td>
                    <td className="py-1.5 pr-3 text-scient-gray">{fmt(e.sent_at)}</td>
                    <td className="py-1.5 pr-3">
                      {e.opened_at ? (
                        <span className="text-[#40E0A8]">{fmt(e.opened_at)}</span>
                      ) : (
                        <span className="text-scient-gray">—</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-3">
                      {e.clicked_at ? (
                        <span className="text-purple-500">{fmt(e.clicked_at)}</span>
                      ) : (
                        <span className="text-scient-gray">—</span>
                      )}
                    </td>
                    <td className="max-w-[180px] py-1.5">
                      {e.feedback_text ? (
                        <p className="line-clamp-2 text-2xs leading-relaxed text-scient-dark">
                          {e.feedback_text}
                        </p>
                      ) : (
                        <span className="text-scient-gray">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCO 4 — API KEYS + CONSUMO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="mt-12">
        <p className="font-sora text-2xs uppercase tracking-widest text-scient-gray">
          04 — API Keys & Consumo
        </p>

        {/* API Keys */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: 'Chaves ativas', value: activeKeys.length, color: '#0030E8' },
            { label: 'Total criadas', value: allApiKeys.length, color: '#585858' },
            {
              label: 'Revogadas',
              value: allApiKeys.filter((k) => k.revoked_at).length,
              color: '#EF4444',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded border border-scient-divider p-3">
              <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                {label}
              </p>
              <p className="mt-1 font-sora text-2xl font-light" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {allApiKeys.length > 0 && (
          <div className="mt-4 rounded border border-scient-divider p-5">
            <h2 className="font-sora text-base font-medium text-scient-dark">Chaves por Usuário</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full font-sora text-xs">
                <thead>
                  <tr className="border-b border-scient-divider text-left text-scient-gray">
                    <th className="pb-2 pr-4 font-normal">Usuário</th>
                    <th className="pb-2 pr-4 font-normal">Empresa</th>
                    <th className="pb-2 pr-4 font-normal">Chave</th>
                    <th className="pb-2 pr-4 font-normal">Status</th>
                    <th className="pb-2 pr-4 font-normal">Último uso</th>
                    <th className="pb-2 font-normal">Criada</th>
                  </tr>
                </thead>
                <tbody>
                  {allApiKeys.map((k) => {
                    const p = profileById[k.user_id]
                    return (
                      <tr key={k.id} className="border-b border-scient-divider hover:bg-scient-bg">
                        <td className="py-2 pr-4 font-medium text-scient-dark">
                          {p?.nome ?? k.user_id.slice(0, 8)}
                        </td>
                        <td className="py-2 pr-4 text-scient-gray">{p?.empresa ?? '—'}</td>
                        <td className="py-2 pr-4 font-mono text-scient-gray">
                          {k.key_prefix}••••••••
                          {k.name !== 'Meu agente' && (
                            <span className="ml-1 text-scient-gray">({k.name})</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          {k.revoked_at ? (
                            <span className="font-sora text-3xs uppercase text-[#EF4444]">
                              Revogada
                            </span>
                          ) : (
                            <span className="font-sora text-3xs uppercase text-[#40E0A8]">
                              Ativa
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-scient-gray">{fmt(k.last_used_at)}</td>
                        <td className="py-2 text-scient-gray">{fmtDate(k.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {allApiKeys.length === 0 && (
          <div className="mt-4 rounded border border-scient-divider p-6 text-center">
            <p className="font-sora text-sm text-scient-gray">
              Nenhum usuário criou uma API Key ainda.
            </p>
          </div>
        )}

        {/* API Usage */}
        <div className="mt-6">
          <h2 className="font-sora text-base font-medium text-scient-dark">Consumo de IA</h2>

          {!apiUsageExists ? (
            <div className="mt-4 rounded border border-scient-divider p-5">
              <p className="font-sora text-sm text-scient-gray">
                A tabela{' '}
                <code className="rounded bg-scient-bg px-1 py-0.5 font-mono text-xs">
                  api_usage_log
                </code>{' '}
                ainda não existe. Execute o SQL abaixo no{' '}
                <strong>Supabase Dashboard → SQL Editor</strong>:
              </p>
              <pre className="mt-4 overflow-auto rounded bg-scient-bg p-4 font-mono text-xs text-scient-dark">
                {migrationSql}
              </pre>
            </div>
          ) : allApiUsage.length === 0 ? (
            <div className="mt-4 rounded border border-scient-divider p-6 text-center">
              <p className="font-sora text-sm text-scient-gray">Nenhum consumo registrado ainda.</p>
              <p className="mt-2 font-sora text-xs text-scient-gray">
                Instrumente as chamadas de IA inserindo rows em{' '}
                <code className="font-mono">api_usage_log</code> com{' '}
                <code className="font-mono">user_id</code>,{' '}
                <code className="font-mono">event_type</code>,{' '}
                <code className="font-mono">input_tokens</code>,{' '}
                <code className="font-mono">output_tokens</code> e{' '}
                <code className="font-mono">cost_usd</code>.
              </p>
            </div>
          ) : (
            <>
              {/* KPIs de custo */}
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  {
                    label: 'Total Gasto (USD)',
                    value: `$${totalCostUsd.toFixed(4)}`,
                    color: '#0030E8',
                  },
                  { label: 'Runs totais', value: allApiUsage.length, color: '#40E0A8' },
                  {
                    label: 'Custo/run médio',
                    value: `$${allApiUsage.length > 0 ? (totalCostUsd / allApiUsage.length).toFixed(5) : '0'}`,
                    color: '#F97316',
                  },
                  {
                    label: 'Usuários únicos',
                    value: Object.keys(usageByUser).length,
                    color: '#A855F7',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded border border-scient-divider p-3">
                    <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                      {label}
                    </p>
                    <p className="mt-1 font-sora text-xl font-light" style={{ color }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Por tipo de evento */}
              <div className="mt-4 rounded border border-scient-divider p-5">
                <h3 className="font-sora text-sm font-medium text-scient-dark">
                  Por Tipo de Evento
                </h3>
                <table className="mt-3 w-full font-sora text-xs">
                  <thead>
                    <tr className="border-b border-scient-divider text-left text-scient-gray">
                      <th className="pb-2 pr-4 font-normal">Evento</th>
                      <th className="pb-2 pr-4 text-right font-normal">Runs</th>
                      <th className="pb-2 pr-4 text-right font-normal">Tokens In</th>
                      <th className="pb-2 pr-4 text-right font-normal">Tokens Out</th>
                      <th className="pb-2 text-right font-normal">Custo USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(usageByType)
                      .sort(([, a], [, b]) => b.cost - a.cost)
                      .map(([type, s]) => (
                        <tr
                          key={type}
                          className="border-b border-scient-divider hover:bg-scient-bg"
                        >
                          <td className="py-2 pr-4 font-medium text-scient-dark">{type}</td>
                          <td className="py-2 pr-4 text-right text-scient-gray">{s.runs}</td>
                          <td className="py-2 pr-4 text-right text-scient-gray">
                            {s.inputTokens.toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-right text-scient-gray">
                            {s.outputTokens.toLocaleString()}
                          </td>
                          <td className="py-2 text-right font-medium text-[#0030E8]">
                            ${s.cost.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Top usuários por consumo */}
              {topUsageUsers.length > 0 && (
                <div className="mt-4 rounded border border-scient-divider p-5">
                  <h3 className="font-sora text-sm font-medium text-scient-dark">
                    Top Usuários por Consumo
                  </h3>
                  <table className="mt-3 w-full font-sora text-xs">
                    <thead>
                      <tr className="border-b border-scient-divider text-left text-scient-gray">
                        <th className="pb-2 pr-4 font-normal">Usuário</th>
                        <th className="pb-2 pr-4 font-normal">Empresa</th>
                        <th className="pb-2 pr-4 text-right font-normal">Runs</th>
                        <th className="pb-2 pr-4 text-right font-normal">Tokens</th>
                        <th className="pb-2 text-right font-normal">Custo USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topUsageUsers.map(([uid, stats]) => {
                        const p = profileById[uid]
                        return (
                          <tr
                            key={uid}
                            className="border-b border-scient-divider hover:bg-scient-bg"
                          >
                            <td className="py-2 pr-4 font-medium text-scient-dark">
                              {p?.nome ?? uid.slice(0, 8)}
                            </td>
                            <td className="py-2 pr-4 text-scient-gray">{p?.empresa ?? '—'}</td>
                            <td className="py-2 pr-4 text-right text-scient-gray">{stats.runs}</td>
                            <td className="py-2 pr-4 text-right text-scient-gray">
                              {stats.tokens.toLocaleString()}
                            </td>
                            <td className="py-2 text-right font-medium text-[#0030E8]">
                              ${stats.cost.toFixed(4)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Custo por semana */}
              {usageWeekEntries.length > 0 && (
                <div className="mt-4 rounded border border-scient-divider p-5">
                  <h3 className="font-sora text-sm font-medium text-scient-dark">
                    Custo por Semana (USD)
                  </h3>
                  <div className="mt-4 flex items-end gap-2">
                    {usageWeekEntries.map(([wk, cost]) => {
                      const h = Math.max(8, (cost / maxCostWeek) * 100)
                      return (
                        <div key={wk} className="flex flex-1 flex-col items-center gap-1">
                          <span className="font-sora text-3xs font-medium text-scient-dark">
                            ${cost.toFixed(3)}
                          </span>
                          <div
                            className="w-full rounded-t bg-[#0030E8] opacity-70"
                            style={{ height: `${h}px` }}
                          />
                          <span className="font-sora text-3xs text-scient-gray">
                            {wk.replace(/\d{4}-/, '')}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="mt-16 border-t border-scient-divider pt-6">
        <p className="font-sora text-2xs text-scient-gray">
          GTM BlackBox · Admin Command Center · Dados ao vivo do Supabase
        </p>
        <div className="mt-2 flex gap-4">
          {[
            ['/admin/analytics', 'Analytics'],
            ['/admin/manual-emails', 'Manual Emails'],
            ['/admin/email-health', 'Email Health'],
          ].map(([href, label]) => (
            <a key={href} href={href} className="font-sora text-2xs text-[#0030E8] hover:underline">
              {label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
