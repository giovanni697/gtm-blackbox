'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Plus, Trash2 } from 'lucide-react'
import { calcular, type ForecastWizardState } from './actions'
import { MOTION_LABEL } from '@/lib/forecast/benchmarks-por-motion'
import type { Motion } from '@/lib/forecast/types'

const initial: ForecastWizardState = {}

const MOTION_DEFAULTS: Record<
  Motion,
  {
    acvBrl: number
    cicloDias: number
    sdrsCapacityPorMes: number
    aesDealsPorMes: number
    csmsContasMax: number
  }
> = {
  no_touch: {
    acvBrl: 5000,
    cicloDias: 5,
    sdrsCapacityPorMes: 0,
    aesDealsPorMes: 0,
    csmsContasMax: 500,
  },
  low_touch: {
    acvBrl: 25000,
    cicloDias: 21,
    sdrsCapacityPorMes: 80,
    aesDealsPorMes: 12,
    csmsContasMax: 200,
  },
  mid_touch: {
    acvBrl: 100000,
    cicloDias: 60,
    sdrsCapacityPorMes: 40,
    aesDealsPorMes: 6,
    csmsContasMax: 50,
  },
  high_touch: {
    acvBrl: 300000,
    cicloDias: 120,
    sdrsCapacityPorMes: 20,
    aesDealsPorMes: 2,
    csmsContasMax: 25,
  },
  canal: {
    acvBrl: 50000,
    cicloDias: 60,
    sdrsCapacityPorMes: 0,
    aesDealsPorMes: 0,
    csmsContasMax: 100,
  },
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-scient-primary px-5 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover disabled:opacity-50"
    >
      {pending ? 'Calculando…' : 'Calcular forecast e capacity'}
    </button>
  )
}

export function ForecastWizardForm() {
  const [state, formAction] = useFormState(calcular, initial)
  const [motions, setMotions] = useState<Motion[]>(['mid_touch'])

  function addMotion() {
    setMotions((prev) => [...prev, 'mid_touch'])
  }
  function removeMotion(i: number) {
    setMotions((prev) => prev.filter((_, idx) => idx !== i))
  }
  function changeMotion(i: number, m: Motion) {
    setMotions((prev) => prev.map((x, idx) => (idx === i ? m : x)))
  }

  const pctEqual = motions.length > 0 ? Math.floor(100 / motions.length) : 100

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-10">
      {/* Bloco A — Meta */}
      <Section title="A · Meta" subtitle="Receita atual e meta no horizonte declarado.">
        <Row>
          <Field
            label="Receita atual (R$)"
            name="arr_atual"
            type="number"
            step="100000"
            required
            defaultValue="10000000"
          />
          <Field
            label="Meta de Receita em N meses (R$)"
            name="arr_meta"
            type="number"
            step="100000"
            required
            defaultValue="20000000"
          />
        </Row>
        <Field
          label="Horizonte (meses)"
          name="horizon"
          type="number"
          required
          defaultValue="12"
          min={3}
          max={36}
        />
      </Section>

      {/* Bloco B — Motions */}
      <Section
        title="B · Motions ativos"
        subtitle="Para cada motion, declare tipo de receita, ACV, ciclo e capacity atual."
      >
        {motions.map((modal, i) => {
          const def = MOTION_DEFAULTS[modal]
          return (
            <div key={i} className="border border-scient-divider bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <select
                  name="motion_modal"
                  value={modal}
                  onChange={(e) => changeMotion(i, e.target.value as Motion)}
                  className="border border-scient-divider bg-white px-3 py-2 font-sora text-xs focus:border-scient-primary"
                >
                  {(Object.keys(MOTION_LABEL) as Motion[]).map((m) => (
                    <option key={m} value={m}>
                      {MOTION_LABEL[m]}
                    </option>
                  ))}
                </select>
                {motions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeMotion(i)}
                    className="inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-gray hover:text-red-600"
                  >
                    <Trash2 size={11} strokeWidth={1.5} /> Remover
                  </button>
                ) : null}
              </div>
              {/* Tipo de receita */}
              <Row>
                <label className="block">
                  <span className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
                    Tipo de Receita
                  </span>
                  <select
                    name={`recorrente_${i}`}
                    defaultValue="sim"
                    className="mt-1 block w-full border border-scient-divider bg-white px-3 py-2 font-sora text-xs focus:border-scient-primary"
                  >
                    <option value="sim">Recorrente (SaaS / Assinatura)</option>
                    <option value="nao">Não-recorrente (Projeto / One-time)</option>
                  </select>
                </label>
                <Field
                  label="Duração média do contrato (meses)"
                  name={`duracao_contrato_${i}`}
                  type="number"
                  required
                  defaultValue={12}
                  min={1}
                  max={120}
                />
              </Row>
              <Row>
                <Field
                  label="ACV (R$)"
                  name={`acv_${i}`}
                  type="number"
                  required
                  defaultValue={def.acvBrl}
                />
                <Field
                  label="Ciclo (dias)"
                  name={`ciclo_${i}`}
                  type="number"
                  required
                  defaultValue={def.cicloDias}
                />
              </Row>
              <Row>
                <Field
                  label="% da Receita total"
                  name={`pct_arr_${i}`}
                  type="number"
                  required
                  defaultValue={pctEqual}
                />
                <Field
                  label="Clientes ativos"
                  name={`clientes_ativos_${i}`}
                  type="number"
                  required
                  defaultValue={20}
                />
              </Row>
              <Row>
                <Field
                  label="SDRs atuais"
                  name={`sdrs_atuais_${i}`}
                  type="number"
                  required
                  defaultValue={1}
                />
                <Field
                  label="SQLs/SDR/mês"
                  name={`sdrs_cap_${i}`}
                  type="number"
                  required
                  defaultValue={def.sdrsCapacityPorMes}
                />
              </Row>
              <Row>
                <Field
                  label="AEs atuais"
                  name={`aes_atuais_${i}`}
                  type="number"
                  required
                  defaultValue={2}
                />
                <Field
                  label="Deals/AE/mês"
                  name={`aes_deals_${i}`}
                  type="number"
                  required
                  defaultValue={def.aesDealsPorMes}
                />
              </Row>
              <Row>
                <Field
                  label="CSMs atuais"
                  name={`csms_atuais_${i}`}
                  type="number"
                  required
                  defaultValue={1}
                />
                <Field
                  label="Contas/CSM (max)"
                  name={`csms_contas_${i}`}
                  type="number"
                  required
                  defaultValue={def.csmsContasMax}
                />
              </Row>
            </div>
          )
        })}
        {motions.length < 5 ? (
          <button
            type="button"
            onClick={addMotion}
            className="inline-flex items-center gap-1.5 self-start px-3 py-2 font-sora text-2xs uppercase tracking-widest text-scient-primary hover:bg-scient-primary-soft"
          >
            <Plus size={12} strokeWidth={1.5} /> Adicionar motion
          </button>
        ) : null}
      </Section>

      {/* Bloco C — Funil */}
      <Section
        title="C · Funil M1-M8 (taxas de conversão %)"
        subtitle="Defaults realistas; ajuste com seus números reais."
      >
        <Row>
          <Field
            label="Account → MQA"
            name="tx_account_mqa"
            type="number"
            step="0.1"
            defaultValue="15"
          />
          <Field label="MQA → SQL" name="tx_mqa_sql" type="number" step="0.1" defaultValue="35" />
        </Row>
        <Row>
          <Field label="SQL → SAL" name="tx_sql_sal" type="number" step="0.1" defaultValue="60" />
          <Field
            label="Win Rate (SAL → Won)"
            name="tx_win_rate"
            type="number"
            step="0.1"
            defaultValue="25"
          />
        </Row>
        <Row>
          <Field label="GRR (%)" name="tx_grr" type="number" step="0.1" defaultValue="85" />
          <Field label="NRR (%)" name="tx_nrr" type="number" step="0.1" defaultValue="110" />
        </Row>
      </Section>

      {/* Bloco D — Marketing */}
      <Section title="D · Marketing">
        <Row>
          <Field label="Custo por MQA (R$)" name="mkt_custo_mqa" type="number" defaultValue="200" />
          <Field label="Budget mensal (R$)" name="mkt_budget" type="number" defaultValue="50000" />
        </Row>
        <label className="flex items-center gap-2 font-sora text-2xs">
          <input type="checkbox" name="mkt_dedicado" className="accent-scient-primary" />
          Operamos campanhas dedicadas por motion
        </label>
      </Section>

      {/* Bloco G — Constantes */}
      <Section
        title="E · Constantes de mercado"
        subtitle="Valores SCIENT/Pavilion/ICONIQ canônicos. Ajuste se quiser."
      >
        <Row>
          <Field label="Ramp-up (meses)" name="ramp" type="number" defaultValue="5" />
          <Field label="Attrition (%/ano)" name="attrition" type="number" defaultValue="10" />
        </Row>
        <Row>
          <Field
            label="Atingimento Top Quartile (%)"
            name="atingimento"
            type="number"
            defaultValue="60"
          />
          <Field label="Turnover (%/ano)" name="turnover" type="number" defaultValue="20" />
        </Row>
        <Field
          label="Pipeline Coverage target (x)"
          name="pipeline_cov"
          type="number"
          step="0.1"
          defaultValue="3"
        />
      </Section>

      {state.error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 font-sora text-2xs text-red-700">
          {state.error}
        </p>
      ) : null}

      <Submit />
    </form>
  )
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
        {title}
      </h2>
      {subtitle ? <p className="mt-1 font-sora text-2xs text-scient-gray">{subtitle}</p> : null}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>
}

function Field({
  label,
  name,
  ...rest
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
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
