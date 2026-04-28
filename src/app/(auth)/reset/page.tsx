'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { resetPassword, type ResetState } from './actions'

const initialState: ResetState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Enviando…' : 'Enviar link de reset'}
    </button>
  )
}

export default function ResetPage() {
  const [state, formAction] = useFormState(resetPassword, initialState)

  if (state.sent) {
    return (
      <div className="w-full max-w-md border border-scient-divider bg-white p-8">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Link enviado
        </p>
        <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">Cheque seu e-mail</h1>
        <p className="mt-4 font-sora text-xs leading-relaxed text-scient-gray">
          Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha em até
          5 minutos. Verifique também a pasta de spam.
        </p>
        <Link href="/login" className="mt-6 block font-sora text-xs text-scient-primary underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md border border-scient-divider bg-white p-8">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Recuperar senha
      </p>
      <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">Esqueceu sua senha?</h1>
      <p className="mt-3 font-sora text-xs text-scient-gray">
        Digite seu e-mail e te enviaremos um link de reset.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            E-mail
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="mt-1 block w-full border border-scient-divider px-3 py-2 font-sora text-xs outline-none focus:border-scient-primary"
          />
        </label>

        {state.error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />

        <p className="text-center font-sora text-2xs text-scient-gray">
          <Link href="/login" className="underline">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  )
}
