'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calcularForecast } from '@/lib/forecast/relacoes-matematicas'
import type { ForecastInput, Motion } from '@/lib/forecast/types'

const MotionSchema = z.object({
  modal: z.enum(['no_touch', 'low_touch', 'mid_touch', 'high_touch', 'canal']),
  acvBrl: z.number().nonnegative(),
  cicloDias: z.number().nonnegative(),
  pctArr: z.number().min(0).max(100),
  recorrente: z.boolean(),
  duracaoContrataMeses: z.number().int().min(1).max(120),
  sdrsAtuais: z.number().nonnegative(),
  sdrsCapacityPorMes: z.number().nonnegative(),
  aesAtuais: z.number().nonnegative(),
  aesDealsPorMes: z.number().nonnegative(),
  csmsAtuais: z.number().nonnegative(),
  csmsContasMax: z.number().nonnegative(),
  clientesAtivos: z.number().nonnegative(),
})

const ForecastInputSchema = z.object({
  arrAtualBrl: z.number().nonnegative(),
  arrMetaBrl: z.number().nonnegative(),
  horizonMeses: z.number().int().min(3).max(36),
  motions: z.array(MotionSchema).min(1),
  taxasFunil: z.object({
    accountMqa: z.number().min(0).max(100),
    mqaSql: z.number().min(0).max(100),
    sqlSal: z.number().min(0).max(100),
    winRate: z.number().min(0).max(100),
    grr: z.number().min(0).max(100),
    nrr: z.number().min(0).max(200),
  }),
  marketing: z.object({
    custoPorMqaBrl: z.number().nonnegative(),
    budgetMensalBrl: z.number().nonnegative(),
    campanhasDedicadasPorMotion: z.boolean(),
  }),
  constantes: z.object({
    rampMeses: z.number().int().min(1).max(12),
    attritionPct: z.number().min(0).max(100),
    atingimentoTopQuartilePct: z.number().min(0).max(100),
    turnoverPct: z.number().min(0).max(100),
    pipelineCoverageTarget: z.number().min(1).max(10),
  }),
})

export type ForecastWizardState = { error?: string }

function n(formData: FormData, key: string, fallback = 0): number {
  const v = formData.get(key)
  if (typeof v !== 'string' || v === '') return fallback
  const num = Number(v.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(num) ? num : fallback
}

export async function calcular(
  _prev: ForecastWizardState,
  formData: FormData,
): Promise<ForecastWizardState> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const motionModalRaw = formData.getAll('motion_modal').filter(Boolean) as string[]
  const motions = motionModalRaw.map((modal, i) => ({
    modal: modal as Motion,
    acvBrl: n(formData, `acv_${i}`),
    cicloDias: n(formData, `ciclo_${i}`),
    pctArr: n(formData, `pct_arr_${i}`),
    recorrente: formData.get(`recorrente_${i}`) !== 'nao',
    duracaoContrataMeses: n(formData, `duracao_contrato_${i}`, 12),
    sdrsAtuais: n(formData, `sdrs_atuais_${i}`),
    sdrsCapacityPorMes: n(formData, `sdrs_cap_${i}`),
    aesAtuais: n(formData, `aes_atuais_${i}`),
    aesDealsPorMes: n(formData, `aes_deals_${i}`),
    csmsAtuais: n(formData, `csms_atuais_${i}`),
    csmsContasMax: n(formData, `csms_contas_${i}`),
    clientesAtivos: n(formData, `clientes_ativos_${i}`),
  }))

  const input: ForecastInput = {
    arrAtualBrl: n(formData, 'arr_atual'),
    arrMetaBrl: n(formData, 'arr_meta'),
    horizonMeses: n(formData, 'horizon', 12),
    motions,
    taxasFunil: {
      accountMqa: n(formData, 'tx_account_mqa', 15),
      mqaSql: n(formData, 'tx_mqa_sql', 35),
      sqlSal: n(formData, 'tx_sql_sal', 60),
      winRate: n(formData, 'tx_win_rate', 25),
      grr: n(formData, 'tx_grr', 85),
      nrr: n(formData, 'tx_nrr', 110),
    },
    marketing: {
      custoPorMqaBrl: n(formData, 'mkt_custo_mqa', 200),
      budgetMensalBrl: n(formData, 'mkt_budget', 50000),
      campanhasDedicadasPorMotion: formData.get('mkt_dedicado') === 'on',
    },
    constantes: {
      rampMeses: n(formData, 'ramp', 5),
      attritionPct: n(formData, 'attrition', 10),
      atingimentoTopQuartilePct: n(formData, 'atingimento', 60),
      turnoverPct: n(formData, 'turnover', 20),
      pipelineCoverageTarget: n(formData, 'pipeline_cov', 3),
    },
  }

  const parsed = ForecastInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const output = calcularForecast(parsed.data)

  await supabase.from('forecast_sessions').insert({
    user_id: user.id,
    inputs: parsed.data,
    outputs: output,
    capacity_verdict: output.capacityVerdicts,
    hiring_plan: output.hiringPlan,
    completed_at: new Date().toISOString(),
  })

  await supabase.from('profiles').update({ forecast_concluido: true }).eq('id', user.id)

  revalidatePath('/forecast')
  redirect('/forecast/resultado')
}
