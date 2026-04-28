'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { login, type LoginState } from './actions'

const initialState: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Entrando…' : 'Entrar'}
    </button>
  )
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <div className="w-full max-w-md border border-scient-divider bg-white p-8">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Login</p>
      <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">
        Entrar no GTM BlackBox
      </h1>
      <p className="mt-3 font-sora text-xs text-scient-gray">
        Não tem conta?{' '}
        <Link href="/signup" className="text-scient-primary underline">
          Criar conta grátis
        </Link>
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={searchParams.next ?? ''} />

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

        <label className="block">
          <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Senha
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
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
          <Link href="/reset" className="underline">
            Esqueci minha senha
          </Link>
        </p>
      </form>
    </div>
  )
}
