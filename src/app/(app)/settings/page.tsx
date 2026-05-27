import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NewKeyForm } from './NewKeyForm'
import { RevokeKeyButton } from './RevokeKeyButton'
import { Key, Terminal } from 'lucide-react'

export const metadata = {
  title: 'Settings — GTM BlackBox',
}

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: keys } = await service
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  const apiKeys: ApiKey[] = keys ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-sora text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 font-sora text-sm text-gray-500">
          Gerencie suas chaves de API para acesso por agentes externos.
        </p>
      </div>

      {/* API Keys section */}
      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Key size={16} strokeWidth={1.5} className="text-scient-primary" />
          <h2 className="font-sora text-sm font-semibold uppercase tracking-widest text-gray-700">
            API Keys
          </h2>
        </div>

        {/* Active keys table */}
        {apiKeys.length > 0 ? (
          <div className="mb-6 overflow-hidden border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-gray-400">
                    Nome
                  </th>
                  <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-gray-400">
                    Prefixo
                  </th>
                  <th className="hidden px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-gray-400 sm:table-cell">
                    Criada em
                  </th>
                  <th className="hidden px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-gray-400 md:table-cell">
                    Último uso
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((k) => (
                  <tr key={k.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-sora text-xs text-gray-800">{k.name}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                        {k.key_prefix}…
                      </code>
                    </td>
                    <td className="hidden px-4 py-3 font-sora text-xs text-gray-400 sm:table-cell">
                      {formatDate(k.created_at)}
                    </td>
                    <td className="hidden px-4 py-3 font-sora text-xs text-gray-400 md:table-cell">
                      {formatDate(k.last_used_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RevokeKeyButton keyId={k.id} keyPrefix={k.key_prefix} keyName={k.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mb-6 border border-dashed border-gray-200 bg-white px-6 py-8 text-center">
            <Key size={24} strokeWidth={1} className="mx-auto mb-2 text-gray-300" />
            <p className="font-sora text-xs text-gray-400">Nenhuma chave ativa. Gere uma abaixo.</p>
          </div>
        )}

        {/* Generate new key */}
        <div className="border border-gray-200 bg-white p-5">
          <h3 className="mb-4 font-sora text-xs font-semibold uppercase tracking-widest text-gray-600">
            Gerar nova chave
          </h3>
          <NewKeyForm />
        </div>
      </section>

      {/* Usage example */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Terminal size={16} strokeWidth={1.5} className="text-scient-primary" />
          <h2 className="font-sora text-sm font-semibold uppercase tracking-widest text-gray-700">
            Como usar
          </h2>
        </div>

        <div className="overflow-hidden border border-gray-200 bg-gray-900">
          <div className="border-b border-gray-700 px-4 py-2">
            <span className="font-sora text-3xs uppercase tracking-widest text-gray-400">Curl</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-gray-300">
            {`# Buscar perguntas do diagnóstico
curl https://gtm-blackbox.vercel.app/api/v1/questions \\
  -H "X-GTM-Key: gtmb_YOUR_KEY"

# Filtrar por estágio ARMV
curl https://gtm-blackbox.vercel.app/api/v1/questions?estagio=ARMV \\
  -H "X-GTM-Key: gtmb_YOUR_KEY"

# Rodar diagnóstico
curl -X POST https://gtm-blackbox.vercel.app/api/v1/diagnostic \\
  -H "X-GTM-Key: gtmb_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"perfil":{"empresa":"ACME","estagio":"ARMV"},"respostas":{"p1_1":"sim","p1_2":"nao"}}'

# MCP Server (para Claude Code / agentes)
# Endpoint: https://gtm-blackbox.vercel.app/api/mcp
# Header: X-GTM-Key: gtmb_YOUR_KEY`}
          </pre>
        </div>

        <div className="mt-4 border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="font-sora text-xs text-blue-700">
            <strong>MCP Server:</strong> Configure em Claude Code com{' '}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-xs">
              {`{"mcpServers":{"gtm-blackbox":{"url":"https://gtm-blackbox.vercel.app/api/mcp","headers":{"X-GTM-Key":"gtmb_..."}}}}`}
            </code>
          </p>
        </div>
      </section>
    </div>
  )
}
