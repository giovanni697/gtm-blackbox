'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { submitDiagnostico, saveWizardSession, type WizardState } from './actions'
import type { Pergunta, PilarInfo, Resposta } from '@/lib/diagnostico/types'

const initial: WizardState = {}

function Submit({ totalPerguntas, respondidas }: { totalPerguntas: number; respondidas: number }) {
  const { pending } = useFormStatus()
  const completo = respondidas >= totalPerguntas
  return (
    <button
      type="submit"
      disabled={pending || !completo}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending
        ? 'Calculando…'
        : completo
          ? 'Finalizar e ver resultado'
          : `Responda todas (${respondidas}/${totalPerguntas})`}
    </button>
  )
}

export function WizardForm({
  grupos,
  respostasIniciais,
}: {
  grupos: { pilar: PilarInfo; perguntas: Pergunta[] }[]
  respostasIniciais: Record<string, Resposta>
}) {
  const [state, formAction] = useFormState(submitDiagnostico, initial)
  const [respostas, setRespostas] = useState<Record<string, Resposta>>(respostasIniciais)
  const totalPerguntas = grupos.reduce((acc, g) => acc + g.perguntas.length, 0)
  const respondidas = Object.keys(respostas).length
  const formRef = useRef<HTMLFormElement>(null)

  // Autosave debounced
  useEffect(() => {
    if (Object.keys(respostas).length === 0) return
    const timer = setTimeout(() => {
      const form = new FormData()
      for (const [k, v] of Object.entries(respostas)) form.append(k, v)
      void saveWizardSession(form)
    }, 1000)
    return () => clearTimeout(timer)
  }, [respostas])

  function setResposta(perguntaId: string, value: Resposta) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: value }))
  }

  return (
    <form ref={formRef} action={formAction} className="mt-10 flex flex-col gap-10">
      <div className="border border-scient-divider bg-scient-bg p-4">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Progresso</p>
        <div className="mt-2 h-1.5 overflow-hidden bg-scient-divider">
          <div
            className="h-full bg-scient-primary transition-all"
            style={{ width: `${(respondidas / Math.max(1, totalPerguntas)) * 100}%` }}
          />
        </div>
        <p className="mt-2 font-sora text-2xs text-scient-dark">
          {respondidas} de {totalPerguntas} perguntas respondidas
        </p>
      </div>

      {grupos.map(({ pilar, perguntas }) => (
        <section key={pilar.numero}>
          <h2 className="font-sora text-lg font-medium text-scient-dark md:text-xl">
            P{pilar.numero} · {pilar.nome}
          </h2>
          <p className="mt-1 font-sora text-3xs uppercase tracking-widest text-scient-gray">
            {pilar.descricao}
          </p>

          <ol className="mt-6 flex flex-col gap-3">
            {perguntas.map((p, idx) => (
              <li
                key={p.id}
                className="border border-scient-divider bg-white px-4 py-4 md:px-5 md:py-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
                  <div className="flex gap-3">
                    <span className="w-6 shrink-0 font-lexend text-3xs tracking-widest text-scient-gray">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-sora text-xs leading-relaxed text-scient-dark md:text-sm">
                        {p.texto}
                      </p>
                      {p.hint ? (
                        <p className="mt-1 font-sora text-3xs text-scient-gray">{p.hint}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {(['sim', 'parcial', 'nao'] as const).map((r) => (
                      <label key={r} className="cursor-pointer">
                        <input
                          type="radio"
                          name={p.id}
                          value={r}
                          checked={respostas[p.id] === r}
                          onChange={() => setResposta(p.id, r)}
                          className="sr-only"
                          required
                        />
                        <span
                          className={clsx(
                            'flex h-8 min-w-[64px] items-center justify-center px-3 font-sora text-3xs uppercase tracking-widest transition-colors',
                            respostas[p.id] === r
                              ? r === 'sim'
                                ? 'bg-scient-accent text-white'
                                : r === 'nao'
                                  ? 'bg-scient-armv text-white'
                                  : 'bg-scient-primary text-white'
                              : 'border border-scient-divider text-scient-gray hover:border-scient-primary',
                          )}
                        >
                          {r === 'sim' ? 'Sim' : r === 'nao' ? 'Não' : 'Parcial'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {state.error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
          {state.error}
        </p>
      ) : null}

      <Submit totalPerguntas={totalPerguntas} respondidas={respondidas} />
    </form>
  )
}
