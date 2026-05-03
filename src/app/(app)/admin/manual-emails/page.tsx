import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'
import { SeedButton } from './seed-button'
import { SendNowButton } from './send-now-button'

export const dynamic = 'force-dynamic'

interface Row {
  id: string
  tracking_id: string
  to_name: string
  to_email: string
  subject: string
  status: string
  scheduled_for: string | null
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  feedback_text: string | null
  feedback_at: string | null
  error_message: string | null
  created_at: string
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: '#F97316',
    sent: '#40E0A8',
    failed: '#EF4444',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: 10,
        letterSpacing: '0.08em',
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

export default async function ManualEmailsPage() {
  await requireAdmin()
  const sb = createServiceClient()

  const { data, error: tableError } = await sb
    .from('manual_emails')
    .select('*')
    .order('created_at', { ascending: true })

  // Table doesn't exist yet — show migration SQL
  if (tableError?.code === 'PGRST205' || tableError?.message?.includes('manual_emails')) {
    const migrationSql = await import('node:fs/promises').then((fs) =>
      fs
        .readFile(process.cwd() + '/supabase/migrations/20260502_005_manual_emails.sql', 'utf-8')
        .catch(() => '-- arquivo não encontrado'),
    )
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">Admin</p>
        <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">Migration necessária</h1>
        <p className="text-scient-muted mt-2 font-sora text-sm">
          A tabela <code>manual_emails</code> ainda não existe no banco. Rode o SQL abaixo no{' '}
          <strong>Supabase Dashboard → SQL Editor</strong>.
        </p>
        <pre className="border-scient-border mt-6 overflow-auto rounded border bg-gray-50 p-4 font-mono text-xs text-[#111111]">
          {migrationSql}
        </pre>
        <p className="text-scient-muted mt-4 font-sora text-sm">
          Depois de rodar o SQL, recarregue esta página.
        </p>
      </div>
    )
  }

  const rows = (data ?? []) as Row[]

  const stats = {
    total: rows.length,
    scheduled: rows.filter((r) => r.status === 'scheduled').length,
    sent: rows.filter((r) => r.status === 'sent').length,
    opened: rows.filter((r) => r.opened_at !== null).length,
    clicked: rows.filter((r) => r.clicked_at !== null).length,
    feedback: rows.filter((r) => r.feedback_text !== null).length,
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">Admin</p>
      <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">
        Emails Manuais · Activation Wave 1
      </h1>
      <p className="text-scient-muted mt-1 font-sora text-sm">
        Agendados para segunda-feira 05/05 às 08h (BRT)
      </p>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex gap-3">
        {rows.length === 0 && <SeedButton />}
        {stats.scheduled > 0 && <SendNowButton count={stats.scheduled} />}
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <section className="mt-8 grid grid-cols-3 gap-4 md:grid-cols-6">
          {[
            { label: 'Total', value: stats.total, color: '#111111' },
            { label: 'Agendados', value: stats.scheduled, color: '#F97316' },
            { label: 'Enviados', value: stats.sent, color: '#0030E8' },
            { label: 'Abertos', value: stats.opened, color: '#40E0A8' },
            { label: 'Clicados', value: stats.clicked, color: '#A855F7' },
            { label: 'Feedbacks', value: stats.feedback, color: '#EF4444' },
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
      )}

      {/* ── Email list ──────────────────────────────────────────────────────── */}
      {rows.length > 0 && (
        <section className="mt-10">
          <table className="w-full font-sora text-xs">
            <thead>
              <tr className="border-scient-border text-scient-muted border-b text-left">
                <th className="pb-2 pr-3">Para</th>
                <th className="pb-2 pr-3">Assunto</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Enviado</th>
                <th className="pb-2 pr-3">Abriu</th>
                <th className="pb-2 pr-3">Clicou</th>
                <th className="pb-2">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-scient-border border-b hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <p className="text-scient-ink font-medium">{row.to_name}</p>
                    <p className="text-scient-muted">{row.to_email}</p>
                  </td>
                  <td className="text-scient-ink max-w-[200px] py-2 pr-3">{row.subject}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={row.status} />
                    {row.error_message && (
                      <p className="mt-1 text-3xs text-red-500">{row.error_message}</p>
                    )}
                  </td>
                  <td className="text-scient-muted py-2 pr-3">{fmt(row.sent_at)}</td>
                  <td className="py-2 pr-3">
                    {row.opened_at ? (
                      <span className="text-[#40E0A8]">{fmt(row.opened_at)}</span>
                    ) : (
                      <span className="text-scient-muted">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {row.clicked_at ? (
                      <span className="text-purple-500">{fmt(row.clicked_at)}</span>
                    ) : (
                      <span className="text-scient-muted">—</span>
                    )}
                  </td>
                  <td className="max-w-[200px] py-2">
                    {row.feedback_text ? (
                      <p className="text-scient-ink line-clamp-3 text-3xs leading-relaxed">
                        {row.feedback_text}
                      </p>
                    ) : (
                      <span className="text-scient-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {rows.length === 0 && (
        <div className="border-scient-border mt-10 rounded border p-8 text-center">
          <p className="text-scient-muted font-sora text-sm">
            Nenhum email cadastrado ainda. Clique em &ldquo;Seed emails&rdquo; para inserir os 9.
          </p>
        </div>
      )}
    </div>
  )
}
