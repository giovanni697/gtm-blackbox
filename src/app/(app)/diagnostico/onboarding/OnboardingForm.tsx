'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { saveOnboarding, type OnboardingState } from './actions'

const initial: OnboardingState = {}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Salvando…' : 'Salvar e iniciar wizard'}
    </button>
  )
}

export function OnboardingForm({
  initial: profile,
}: {
  initial: {
    nome: string | null
    empresa: string | null
    cargo: string | null
    setor: string | null
    faturamento_atual: string | null
  } | null
}) {
  const [state, formAction] = useFormState(saveOnboarding, initial)

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-5">
      <Field
        label="Seu nome"
        name="nome"
        defaultValue={profile?.nome ?? ''}
        required
        minLength={2}
      />
      <Field label="Empresa" name="empresa" defaultValue={profile?.empresa ?? ''} required />
      <Field label="Cargo (opcional)" name="cargo" defaultValue={profile?.cargo ?? ''} />
      <Field
        label="Setor (opcional)"
        name="setor"
        defaultValue={profile?.setor ?? ''}
        placeholder="Ex: SaaS B2B, Fintech, Saúde"
      />

      <fieldset className="border border-scient-divider p-4">
        <legend className="px-2 font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Faturamento atual da empresa
        </legend>
        <div className="mt-3 flex flex-col gap-2">
          <Radio
            name="faturamento_atual"
            value="ate_20M_brl"
            label="Até R$20M de Receita"
            sublabel="Estágio ARMV — Área de Receita Mínima Viável"
            defaultChecked={profile?.faturamento_atual === 'ate_20M_brl'}
          />
          <Radio
            name="faturamento_atual"
            value="20M_200M_brl"
            label="R$20M a R$200M de Receita"
            sublabel="Estágio ARPE — Área de Receita Pronta para Escalar"
            defaultChecked={profile?.faturamento_atual === '20M_200M_brl'}
          />
          <Radio
            name="faturamento_atual"
            value="acima_200M_brl"
            label="Acima de R$200M de Receita"
            sublabel="Estágio ARE — Área de Receita Escalável"
            defaultChecked={profile?.faturamento_atual === 'acima_200M_brl'}
          />
        </div>
      </fieldset>

      {state.error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
          {state.error}
        </p>
      ) : null}

      <Submit />
    </form>
  )
}

function Field({
  label,
  name,
  ...rest
}: {
  label: string
  name: string
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">{label}</span>
      <input
        {...rest}
        name={name}
        className="mt-1 block w-full border border-scient-divider bg-white px-3 py-2 font-sora text-xs outline-none focus:border-scient-primary"
      />
    </label>
  )
}

function Radio({
  name,
  value,
  label,
  sublabel,
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  sublabel: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-scient-divider bg-white px-3 py-3 transition-colors hover:border-scient-primary">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required
        className="mt-1 accent-scient-primary"
      />
      <span>
        <span className="block font-sora text-xs text-scient-dark">{label}</span>
        <span className="block font-sora text-3xs text-scient-gray">{sublabel}</span>
      </span>
    </label>
  )
}
