'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function FeedbackPage({ searchParams }: { searchParams: { q?: string } }) {
  const { trackingId } = useParams<{ trackingId: string }>()
  const question = searchParams.q ?? 'O que você achou do GTM BlackBox?'

  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('sending')
    try {
      const res = await fetch(`/api/feedback/${trackingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: text }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        background: '#ffffff',
        fontFamily: 'Sora, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#111111',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', padding: '48px 24px' }}>
        <p
          style={{
            margin: '0 0 32px',
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#585858',
          }}
        >
          SCIENT · GTM BlackBox
        </p>

        {status === 'done' ? (
          <>
            <h1 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 300, color: '#111111' }}>
              Obrigado pelo feedback.
            </h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#585858' }}>
              Giovanni vai ler sua resposta. Fique de olho na caixa de entrada.
            </p>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 300, color: '#111111' }}>
              Uma pergunta rápida
            </h1>
            <p
              style={{
                margin: '0 0 28px',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#111111',
                fontStyle: 'italic',
              }}
            >
              {question}
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva aqui..."
              rows={5}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'inherit',
                border: '1px solid #E6E6E6',
                outline: 'none',
                resize: 'vertical',
                color: '#111111',
              }}
            />

            {status === 'error' && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#EF4444' }}>
                Algo deu errado. Tente novamente.
              </p>
            )}

            <div style={{ marginTop: 20 }}>
              <button
                type="submit"
                disabled={status === 'sending' || !text.trim()}
                style={{
                  background: status === 'sending' ? '#585858' : '#0030E8',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {status === 'sending' ? 'Enviando...' : 'Enviar resposta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
