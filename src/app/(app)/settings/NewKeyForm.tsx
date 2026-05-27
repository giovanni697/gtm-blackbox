'use client'

import { useState, useRef } from 'react'
import { createApiKey } from './actions'
import { Copy, Check, Plus } from 'lucide-react'

export function NewKeyForm() {
  const [name, setName] = useState('')
  const [plainKey, setPlainKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    setPlainKey(null)

    const result = await createApiKey(name.trim())
    setLoading(false)

    if ('error' in result) {
      setError(result.error)
    } else {
      setPlainKey(result.plain)
      setName('')
    }
  }

  function handleCopy() {
    if (!plainKey) return
    navigator.clipboard.writeText(plainKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do agente (ex: Claude Code)"
          maxLength={60}
          className="min-w-0 flex-1 border border-gray-200 bg-white px-3 py-2 font-sora text-xs text-gray-800 placeholder-gray-400 focus:border-scient-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex items-center gap-1.5 bg-scient-primary px-4 py-2 font-sora text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={12} strokeWidth={2} />
          {loading ? 'Gerando…' : 'Gerar'}
        </button>
      </form>

      {error && <p className="font-sora text-xs text-red-600">{error}</p>}

      {plainKey && (
        <div className="border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 font-sora text-xs font-semibold uppercase tracking-widest text-amber-700">
            Copie agora — não será exibida novamente
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded bg-white px-3 py-2 font-mono text-xs text-gray-800 ring-1 ring-amber-200">
              {plainKey}
            </code>
            <button
              onClick={handleCopy}
              className="flex h-8 w-8 shrink-0 items-center justify-center border border-amber-300 bg-white text-amber-700 transition-colors hover:bg-amber-100"
              title="Copiar chave"
            >
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
