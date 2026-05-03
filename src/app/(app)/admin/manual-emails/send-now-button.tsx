'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SendNowButton({ count }: { count: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function send() {
    if (!confirm(`Enviar ${count} email(s) agora via Resend?`)) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/send-manual-emails', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'erro')
      setResult(`✓ ${json.sent} enviado(s)${json.failed ? `, ${json.failed} falhou` : ''}`)
      router.refresh()
    } catch (e) {
      setResult(`✗ ${e instanceof Error ? e.message : 'erro'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={loading}
        className="bg-[#0030E8] px-5 py-3 font-sora text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50"
      >
        {loading ? 'Enviando...' : `Enviar agora (${count})`}
      </button>
      {result && (
        <p className={`mt-2 text-xs ${result.startsWith('✓') ? 'text-[#40E0A8]' : 'text-red-500'}`}>
          {result}
        </p>
      )}
    </div>
  )
}
