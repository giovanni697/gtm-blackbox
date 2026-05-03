'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SeedButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function seed() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/seed-manual-emails', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'erro')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={seed}
        disabled={loading}
        className="bg-[#111111] px-5 py-3 font-sora text-xs font-medium uppercase tracking-widest text-white disabled:opacity-50"
      >
        {loading ? 'Inserindo...' : 'Seed emails (9)'}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
