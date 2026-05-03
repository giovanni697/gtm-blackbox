'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { signup, type SignupState } from './actions'

const initialState: SignupState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Criando conta…' : 'Criar conta grátis'}
    </button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signup, initialState)

  if (state.needsConfirmation) {
    return (
      <div className="w-full max-w-md border border-scient-divider bg-white p-8">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Verificação enviada
        </p>
        <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">Confirme seu e-mail</h1>
        <p className="mt-4 font-sora text-xs leading-relaxed text-scient-gray">
          Enviamos um link de confirmação. Clique nele para ativar sua conta. Se não chegar em 5min,
          verifique a pasta de spam.
        </p>
        <Link href="/login" className="mt-6 block font-sora text-xs text-scient-primary underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md border border-scient-divider bg-white p-8">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Criar conta</p>
      <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">
        Acesso gratuito ao GTM BlackBox
      </h1>
      <p className="mt-3 font-sora text-xs text-scient-gray">
        Já tem conta?{' '}
        <Link href="/login" className="text-scient-primary underline">
          Fazer login
        </Link>
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <label className="block">
          <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Nome
          </span>
          <input
            type="text"
            name="nome"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="mt-1 block w-full border border-scient-divider px-3 py-2 font-sora text-xs outline-none focus:border-scient-primary"
          />
        </label>

        <label className="block">
          <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            E-mail corporativo
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="nome@suaempresa.com.br"
            className="mt-1 block w-full border border-scient-divider px-3 py-2 font-sora text-xs outline-none focus:border-scient-primary"
          />
          <span className="mt-1 block font-sora text-3xs leading-relaxed text-scient-gray">
            GTM BlackBox é uma plataforma profissional. Não aceitamos Gmail, Hotmail, Yahoo, etc.{' '}
            <span className="text-scient-dark">
              Use seu e-mail de trabalho — vai integrar com SSO, Slack workspace e calendário no
              futuro.
            </span>
          </span>
        </label>

        <label className="block">
          <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Senha (mín. 8 caracteres)
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 block w-full border border-scient-divider px-3 py-2 font-sora text-xs outline-none focus:border-scient-primary"
          />
        </label>

        {state.error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />

        <p className="font-sora text-2xs leading-relaxed text-scient-gray">
          Ao criar conta você aceita receber e-mails transacionais (signup, reset de senha). Não
          enviamos newsletter sem opt-in explícito.
        </p>
      </form>
    </div>
  )
}
