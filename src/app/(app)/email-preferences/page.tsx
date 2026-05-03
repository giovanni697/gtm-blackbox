'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function EmailPreferencesPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleUnsubscribe() {
    setStatus('loading')
    const sb = createClient()
    const {
      data: { user },
    } = await sb.auth.getUser()

    if (!user) {
      setStatus('error')
      return
    }

    const { error } = await sb
      .from('email_queue')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('status', 'queued')

    setStatus(error ? 'error' : 'done')
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="text-scient-muted font-sora text-3xs uppercase tracking-widest">
        Preferências de e-mail
      </p>
      <h1 className="text-scient-ink mt-2 font-sora text-3xl font-light">Descadastrar</h1>

      {status === 'done' ? (
        <p className="text-scient-muted mt-8 font-sora text-sm">
          Feito. Você não receberá mais e-mails de onboarding do GTM BlackBox.
        </p>
      ) : (
        <>
          <p className="text-scient-muted mt-6 font-sora text-sm leading-relaxed">
            Clique abaixo para cancelar os e-mails de onboarding pendentes. E-mails transacionais
            (confirmação de conta, redefinição de senha) continuarão sendo enviados normalmente.
          </p>

          {status === 'error' && (
            <p className="mt-4 font-sora text-sm text-red-600">
              Algo deu errado. Tente novamente ou entre em contato com giovanni@scient.cc.
            </p>
          )}

          <button
            onClick={handleUnsubscribe}
            disabled={status === 'loading'}
            className="border-scient-ink text-scient-ink hover:bg-scient-ink mt-8 border px-6 py-3 font-sora text-2xs uppercase tracking-widest transition-colors hover:text-white disabled:opacity-50"
          >
            {status === 'loading' ? 'Processando...' : 'Cancelar e-mails de onboarding'}
          </button>
        </>
      )}
    </div>
  )
}
