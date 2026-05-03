import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

interface EventCount {
  event_type: string
  count: number
}

interface EmailEvent {
  to_email: string
  bounce_type: string | null
  complaint_type: string | null
  subject: string | null
  created_at: string
}

interface QueueRow {
  status: string
}

export default async function EmailHealthPage() {
  await requireAdmin()
  const sb = createServiceClient()

  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString()

  const [{ data: counts }, { data: bounces }, { data: complaints }, { data: queueStats }] =
    await Promise.all([
      sb.rpc('email_event_counts', { since_ts: since }),
      sb
        .from('email_events')
        .select('to_email, bounce_type, subject, created_at')
        .eq('event_type', 'email.bounced')
        .order('created_at', { ascending: false })
        .limit(50),
      sb
        .from('email_events')
        .select('to_email, complaint_type, subject, created_at')
        .eq('event_type', 'email.complained')
        .order('created_at', { ascending: false })
        .limit(50),
      sb.from('email_queue').select('status').gte('created_at', since),
    ])

  const queueByStatus = ((queueStats ?? []) as QueueRow[]).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    },
    {},
  )

  const countMap = ((counts ?? []) as EventCount[]).reduce<Record<string, number>>((acc, r) => {
    acc[r.event_type] = r.count
    return acc
  }, {})

  const statCards = [
    { label: 'Enviados', key: 'email.sent', color: '#0030E8' },
    { label: 'Entregues', key: 'email.delivered', color: '#40E0A8' },
    { label: 'Bounces', key: 'email.bounced', color: '#F97316' },
    { label: 'Complaints', key: 'email.complained', color: '#EF4444' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">Admin</p>
      <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">Email Health · 30 dias</h1>

      <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map(({ label, key, color }) => (
          <div key={key} className="border-scient-border rounded border p-4">
            <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
              {label}
            </p>
            <p className="mt-1 font-sora text-3xl font-light" style={{ color }}>
              {countMap[key] ?? 0}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-scient-ink font-sora text-xl font-medium">Fila (30 dias)</h2>
        <pre className="border-scient-border text-scient-ink mt-4 rounded border bg-gray-50 p-4 font-mono text-xs">
          {JSON.stringify(queueByStatus, null, 2)}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="text-scient-ink font-sora text-xl font-medium">
          Bounces recentes ({(bounces ?? []).length})
        </h2>
        {(bounces ?? []).length === 0 ? (
          <p className="text-scient-muted mt-4 font-sora text-sm">Nenhum bounce.</p>
        ) : (
          <table className="mt-4 w-full font-sora text-xs">
            <thead>
              <tr className="border-scient-border text-scient-muted border-b text-left">
                <th className="pb-2 pr-4">E-mail</th>
                <th className="pb-2 pr-4">Tipo</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {((bounces ?? []) as EmailEvent[]).map((b, i) => (
                <tr key={i} className="border-scient-border border-b">
                  <td className="text-scient-ink py-2 pr-4">{b.to_email}</td>
                  <td className="text-scient-muted py-2 pr-4">{b.bounce_type ?? '—'}</td>
                  <td className="text-scient-muted py-2 pr-4">{b.subject ?? '—'}</td>
                  <td className="text-scient-muted py-2">
                    {new Date(b.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-scient-ink font-sora text-xl font-medium">
          Complaints recentes ({(complaints ?? []).length})
        </h2>
        {(complaints ?? []).length === 0 ? (
          <p className="text-scient-muted mt-4 font-sora text-sm">Nenhum complaint.</p>
        ) : (
          <table className="mt-4 w-full font-sora text-xs">
            <thead>
              <tr className="border-scient-border text-scient-muted border-b text-left">
                <th className="pb-2 pr-4">E-mail</th>
                <th className="pb-2 pr-4">Tipo</th>
                <th className="pb-2 pr-4">Assunto</th>
                <th className="pb-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {((complaints ?? []) as EmailEvent[]).map((c, i) => (
                <tr key={i} className="border-scient-border border-b">
                  <td className="text-scient-ink py-2 pr-4">{c.to_email}</td>
                  <td className="text-scient-muted py-2 pr-4">{c.complaint_type ?? '—'}</td>
                  <td className="text-scient-muted py-2 pr-4">{c.subject ?? '—'}</td>
                  <td className="text-scient-muted py-2">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
