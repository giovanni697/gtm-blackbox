'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { login, sendMagicLink, type LoginState, type MagicLinkState } from './actions'

const initialLoginState: LoginState = {}
const initialMagicLinkState: MagicLinkState = {}

function PasswordSubmitButton() {
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

function MagicLinkSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Enviando…' : 'Receber link de acesso'}
    </button>
  )
}

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [loginState, loginAction] = useFormState(login, initialLoginState)
  const [magicState, magicAction] = useFormState(sendMagicLink, initialMagicLinkState)

  // Tela de confirmação após envio do magic link
  if (magicState.sent) {
    return (
      <div className="w-full max-w-md border border-scient-divider bg-white p-8">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Link enviado
        </p>
        <h1 className="mt-2 font-sora text-2xl font-light text-scient-dark">Confira seu e-mail</h1>
        <p className="mt-4 font-sora text-xs leading-relaxed text-scient-gray">
          Se a conta <span className="text-scient-dark">{magicState.email}</span> existir, mandamos
          um link de acesso. Clique nele para entrar (válido por 1 hora). Se não chegar em 5
          minutos, verifique a pasta de spam.
        </p>
        <Link
          href="/login"
          className="mt-6 block font-sora text-xs text-scient-primary underline"
          onClick={() => window.location.reload()}
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

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

      {/* Toggle Senha / Magic Link */}
      <div className="mt-8 flex border border-scient-divider">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`flex-1 px-4 py-2 font-sora text-3xs uppercase tracking-widest transition-colors ${
            mode === 'password'
              ? 'bg-scient-dark text-white'
              : 'text-scient-gray hover:text-scient-dark'
          }`}
        >
          Com senha
        </button>
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={`flex-1 px-4 py-2 font-sora text-3xs uppercase tracking-widest transition-colors ${
            mode === 'magic'
              ? 'bg-scient-dark text-white'
              : 'text-scient-gray hover:text-scient-dark'
          }`}
        >
          Magic Link
        </button>
      </div>

      {mode === 'password' ? (
        <form action={loginAction} className="mt-6 space-y-4">
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

          {loginState.error ? (
            <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
              {loginState.error}
            </p>
          ) : null}

          <PasswordSubmitButton />

          <p className="text-center font-sora text-2xs text-scient-gray">
            <Link href="/reset" className="underline">
              Esqueci minha senha
            </Link>
          </p>
        </form>
      ) : (
        <form action={magicAction} className="mt-6 space-y-4">
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
            <span className="mt-1 block font-sora text-3xs leading-relaxed text-scient-gray">
              Mandamos um link no seu e-mail. Clica e entra — sem senha.
            </span>
          </label>

          {magicState.error ? (
            <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
              {magicState.error}
            </p>
          ) : null}

          <MagicLinkSubmitButton />
        </form>
      )}
    </div>
  )
}
