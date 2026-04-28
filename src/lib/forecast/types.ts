// GTM BlackBox — Forecast Types (multi-motion)

export type Motion = 'no_touch' | 'low_touch' | 'mid_touch' | 'high_touch' | 'canal'

export type CapacityStatus = 'sobra' | 'ok' | 'falta' | 'critico'

export type Funcao = 'marketing' | 'pre_vendas' | 'vendas' | 'cs'

// ─── Inputs ──────────────────────────────────────────────────────────

export interface MotionInput {
  modal: Motion
  acvBrl: number // ACV em BRL
  cicloDias: number // ciclo de venda em dias
  pctArr: number // % do ARR atual originado neste motion (0-100)

  // Tipo de receita
  recorrente: boolean // true = SaaS/assinatura; false = projeto/one-time
  duracaoContrataMeses: number // duração média do contrato em meses (lifetime médio)

  // Capacity atual e benchmark por motion
  sdrsAtuais: number
  sdrsCapacityPorMes: number // SQLs/SDR/mês
  aesAtuais: number
  aesDealsPorMes: number // deals/AE/mês
  csmsAtuais: number
  csmsContasMax: number // contas/CSM (max razoável)
  clientesAtivos: number // clientes ativos neste motion
}

export interface TaxasFunil {
  accountMqa: number // % M1→M2
  mqaSql: number // % M2→M3
  sqlSal: number // % M3→M4
  winRate: number // % M4→M5 (SAL→Won)
  grr: number // %
  nrr: number // %
}

export interface Marketing {
  custoPorMqaBrl: number
  budgetMensalBrl: number
  campanhasDedicadasPorMotion: boolean
}

export interface ConstantesMercado {
  rampMeses: number // default 5
  attritionPct: number // default 10
  atingimentoTopQuartilePct: number // default 60
  turnoverPct: number // default 20
  pipelineCoverageTarget: number // default 3 (3x)
}

export interface ForecastInput {
  // Meta e contexto
  arrAtualBrl: number
  arrMetaBrl: number
  horizonMeses: number // default 12

  // Multi-motion
  motions: MotionInput[]

  // Funil agregado
  taxasFunil: TaxasFunil

  // Marketing
  marketing: Marketing

  // Constantes (opcionalmente sobrescritas pelo usuário)
  constantes: ConstantesMercado
}

// ─── Outputs ─────────────────────────────────────────────────────────

export interface CapacityVerdict {
  funcao: Funcao
  motion: Motion | 'agregado'
  atual: number
  necessario: number
  pctAtendimento: number // pct da capacity necessária atendida
  status: CapacityStatus
  gap: number
  message: string
}

export interface HiringAction {
  role: string
  motion: Motion | 'agregado'
  headcount: number
  mesContratacao: number
  mesFullCapacity: number
  capacityEntregueAteMesAlvo: number
  bloqueante: string | null
}

export interface HiringPlan {
  actions: HiringAction[]
  viavel: boolean
  alternativasSeInviavel: string[]
}

export interface MetricasPorFuncao {
  marketing: { mqasPorMes: number; rsPorMqa: number }
  preVendas: { sqlsPorSdrPorMes: number; sqlsTotalPorMes: number }
  vendas: { dealsPorAePorMes: number; dealsTotalPorMes: number; arrFechadoPorMes: number }
  cs: { contasPorCsm: number; grrTarget: number; nrrTarget: number }
}

export interface ScientificForecastMonth {
  mes: number
  bopMrr: number
  newLogoMrr: number
  expansionMrr: number
  churnMrr: number
  eopMrr: number
  pipelineCoverage: number
  gapVsMeta: number
}

export interface ValidationWarning {
  field: string
  severity: 'info' | 'warn' | 'critical'
  message: string
  benchmark?: string
}

export interface ForecastOutput {
  porMotion: Record<
    string,
    {
      motion: Motion
      accountsNecessarios: number
      mqasNecessarios: number
      sqlsNecessarios: number
      salsNecessarios: number
      dealsNecessarios: number
      sdrsNecessarios: number
      aesNecessarios: number
      csmsNecessarios: number
      custoMarketing: number
      arrFechado: number
    }
  >
  agregado: {
    sdrsTotal: number
    aesTotal: number
    csmsTotal: number
    custoMarketingTotal: number
    arrFechadoTotal: number
    pipelineNecessario: number
  }
  capacityVerdicts: CapacityVerdict[]
  metricas: MetricasPorFuncao
  hiringPlan: HiringPlan
  scientificForecast: ScientificForecastMonth[]
  warnings: ValidationWarning[]
  verdictTextual: string
}
