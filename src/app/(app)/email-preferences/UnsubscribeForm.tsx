'use client'

import { useState } from 'react'
import { unsubscribeEmails } from './actions'

export function UnsubscribeForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleUnsubscribe() {
    setStatus('loading')
    const result = await unsubscribeEmails()
    setStatus(result.ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <p className="mt-8 font-sora text-sm text-scient-gray">
        Feito. Você não receberá mais e-mails de marketing do GTM BlackBox. E-mails transacionais
        (confirmação de conta, redefinição de senha) continuarão normalmente.
      </p>
    )
  }

  return (
    <>
      <p className="mt-6 font-sora text-sm leading-relaxed text-scient-gray">
        Clique abaixo para cancelar todos os e-mails de marketing (onboarding e comunicações
        semanais). E-mails transacionais continuarão sendo enviados normalmente.
      </p>

      {status === 'error' && (
        <p className="mt-4 font-sora text-sm text-red-600">
          Algo deu errado. Tente novamente ou entre em contato com giovanni@scient.cc.
        </p>
      )}

      <button
        onClick={handleUnsubscribe}
        disabled={status === 'loading'}
        className="mt-8 border border-scient-dark px-6 py-3 font-sora text-2xs uppercase tracking-widest text-scient-dark transition-colors hover:bg-scient-dark hover:text-white disabled:opacity-50"
      >
        {status === 'loading' ? 'Processando...' : 'Cancelar todos os e-mails de marketing'}
      </button>
    </>
  )
}
