import type {
  CapacityVerdict,
  ForecastInput,
  ForecastOutput,
  Funcao,
  HiringPlan,
  MotionInput,
  ScientificForecastMonth,
  TaxasFunil,
} from './types'
import { classifyCapacity } from './verdict-engine'
import { buildHiringPlan } from './hiring-engine'
import { buildScientificForecast } from './scientific-forecast'
import { validateInputs } from './input-validators'

function calcularPorMotion(
  motion: MotionInput,
  taxas: TaxasFunil,
  arrMetaTotalBrl: number,
  custoPorMqaBrl: number,
) {
  const arrMetaPorMotion = arrMetaTotalBrl * (motion.pctArr / 100)
  const dealsNecessariosMotion = arrMetaPorMotion / Math.max(1, motion.acvBrl)

  const salsNecessarios = dealsNecessariosMotion / Math.max(0.0001, taxas.winRate / 100)
  const sqlsNecessarios = salsNecessarios / Math.max(0.0001, taxas.sqlSal / 100)
  const mqasNecessarios = sqlsNecessarios / Math.max(0.0001, taxas.mqaSql / 100)
  const accountsNecessarios = mqasNecessarios / Math.max(0.0001, taxas.accountMqa / 100)

  // SQLs/SDR/mês: dividir por 12 meses
  const sdrsNecessarios =
    motion.sdrsCapacityPorMes > 0 ? sqlsNecessarios / 12 / motion.sdrsCapacityPorMes : 0
  // Deals/AE/mês: dividir por 12 meses
  const aesNecessarios =
    motion.aesDealsPorMes > 0 ? dealsNecessariosMotion / 12 / motion.aesDealsPorMes : 0

  // CSMs: base projetada = clientes atuais + novos deals fechados no horizonte
  const clientesProjetados = motion.clientesAtivos + dealsNecessariosMotion
  const csmsNecessarios = motion.csmsContasMax > 0 ? clientesProjetados / motion.csmsContasMax : 0

  const custoMarketing = mqasNecessarios * custoPorMqaBrl
  const arrFechado = dealsNecessariosMotion * motion.acvBrl

  return {
    motion: motion.modal,
    accountsNecessarios: Math.ceil(accountsNecessarios),
    mqasNecessarios: Math.ceil(mqasNecessarios),
    sqlsNecessarios: Math.ceil(sqlsNecessarios),
    salsNecessarios: Math.ceil(salsNecessarios),
    dealsNecessarios: Math.ceil(dealsNecessariosMotion),
    sdrsNecessarios: Math.round(sdrsNecessarios * 10) / 10,
    aesNecessarios: Math.round(aesNecessarios * 10) / 10,
    csmsNecessarios: Math.round(csmsNecessarios * 10) / 10,
    custoMarketing: Math.round(custoMarketing),
    arrFechado: Math.round(arrFechado),
  }
}

function buildVerdictTextual(input: ForecastInput, hiringPlan: HiringPlan): string {
  const cresc = ((input.arrMetaBrl - input.arrAtualBrl) / Math.max(1, input.arrAtualBrl)) * 100
  const lines: string[] = []

  const naoRecorrentesMotions = input.motions.filter((m) => !m.recorrente)
  const receitaLabel =
    naoRecorrentesMotions.length === input.motions.length
      ? 'Receita não-recorrente'
      : naoRecorrentesMotions.length > 0
        ? 'Receita mista (recorrente + não-recorrente)'
        : 'Receita recorrente'

  if (hiringPlan.viavel) {
    lines.push(
      `Plano viável dentro do horizonte de ${input.horizonMeses} meses para meta de R$${(input.arrMetaBrl / 1_000_000).toFixed(1)}M de Receita (${cresc.toFixed(0)}% de crescimento). ${receitaLabel}.`,
    )
    if (hiringPlan.actions.length > 0) {
      lines.push(
        `É necessária a contratação de ${hiringPlan.actions.length} fronts de capacity para fechar os gaps identificados.`,
      )
    } else {
      lines.push('Capacity atual atende a meta sem necessidade de hiring adicional.')
    }
  } else {
    lines.push(
      `Plano INVIÁVEL via contratação dentro de ${input.horizonMeses} meses. Pelo menos um gap exige contratação retroativa, o que é impossível.`,
    )
    lines.push(
      'Alternativas a considerar: revisar meta, transferir senior interno, acelerar via consultoria, ou aceitar gap declarado.',
    )
  }

  if (naoRecorrentesMotions.length > 0) {
    const mediaLifetime =
      naoRecorrentesMotions.reduce((s, m) => s + m.duracaoContrataMeses, 0) /
      naoRecorrentesMotions.length
    lines.push(
      `Atenção: ${naoRecorrentesMotions.length} motion(s) não-recorrente(s) com lifetime médio de ${mediaLifetime.toFixed(0)} meses — cada contrato que expira exige renovação como novo deal.`,
    )
  }

  return lines.join(' ')
}

export function calcularForecast(input: ForecastInput): ForecastOutput {
  const warnings = validateInputs(input)

  const porMotion: ForecastOutput['porMotion'] = {}
  const motionsCalc = input.motions.map((m) =>
    calcularPorMotion(m, input.taxasFunil, input.arrMetaBrl, input.marketing.custoPorMqaBrl),
  )

  let sdrsTotal = 0
  let aesTotal = 0
  let csmsTotal = 0
  let arrFechadoTotal = 0

  for (let i = 0; i < motionsCalc.length; i++) {
    const m = motionsCalc[i]!
    porMotion[m.motion] = m
    sdrsTotal += m.sdrsNecessarios
    aesTotal += m.aesNecessarios
    csmsTotal += m.csmsNecessarios
    arrFechadoTotal += m.arrFechado
  }

  // Marketing (agregado proporcional ou dedicado)
  const totalMqas = motionsCalc.reduce((s, m) => s + m.mqasNecessarios, 0)
  const custoMarketingTotal = totalMqas * input.marketing.custoPorMqaBrl

  // Capacity verdicts por (função × motion)
  const capacityVerdicts: CapacityVerdict[] = []
  for (let i = 0; i < input.motions.length; i++) {
    const inMot = input.motions[i]!
    const calcMot = motionsCalc[i]!

    if (inMot.modal !== 'no_touch' && inMot.modal !== 'canal') {
      capacityVerdicts.push(
        classifyCapacity(
          'pre_vendas' as Funcao,
          inMot.modal,
          inMot.sdrsAtuais,
          calcMot.sdrsNecessarios,
        ),
      )
      capacityVerdicts.push(
        classifyCapacity('vendas' as Funcao, inMot.modal, inMot.aesAtuais, calcMot.aesNecessarios),
      )
    }
    capacityVerdicts.push(
      classifyCapacity('cs' as Funcao, inMot.modal, inMot.csmsAtuais, calcMot.csmsNecessarios),
    )
  }

  // Marketing agregado: comparar custo anual × budget anual (ambos em R$/ano)
  const budgetAnualBrl = input.marketing.budgetMensalBrl * 12
  const marketingNecessario = custoMarketingTotal / Math.max(1, budgetAnualBrl)
  capacityVerdicts.push({
    funcao: 'marketing' as Funcao,
    motion: 'agregado',
    atual: 1, // budget atual = 1 unidade
    necessario: marketingNecessario,
    pctAtendimento:
      marketingNecessario > 0 ? Math.round((1 / marketingNecessario) * 1000) / 10 : 100,
    status: marketingNecessario <= 1 ? 'ok' : marketingNecessario <= 1.25 ? 'falta' : 'critico',
    gap: Math.max(0, marketingNecessario - 1),
    message:
      marketingNecessario <= 1
        ? 'Budget mensal de marketing atual cobre o custo de aquisição necessário.'
        : `Budget atual cobre apenas ${(100 / marketingNecessario).toFixed(0)}% do custo de aquisição necessário. Considere aumentar budget ou reduzir CAC via melhoria de conversão.`,
  })

  // Pipeline necessário: 3× cobertura sobre o ARR incremental (novo negócio), não o total
  const newArrNecessario = Math.max(0, input.arrMetaBrl - input.arrAtualBrl)
  const pipelineNecessario = newArrNecessario * input.constantes.pipelineCoverageTarget

  // Hiring plan
  const hiringPlan = buildHiringPlan(
    capacityVerdicts,
    input.horizonMeses,
    input.constantes.rampMeses,
  )

  // Métricas por função
  const metricas = {
    marketing: {
      mqasPorMes: Math.ceil(totalMqas / 12),
      rsPorMqa: input.marketing.custoPorMqaBrl,
    },
    preVendas: {
      sqlsPorSdrPorMes:
        sdrsTotal > 0
          ? Math.round(motionsCalc.reduce((s, m) => s + m.sqlsNecessarios, 0) / 12 / sdrsTotal)
          : 0,
      sqlsTotalPorMes: Math.ceil(motionsCalc.reduce((s, m) => s + m.sqlsNecessarios, 0) / 12),
    },
    vendas: {
      dealsPorAePorMes:
        aesTotal > 0
          ? Math.round(motionsCalc.reduce((s, m) => s + m.dealsNecessarios, 0) / 12 / aesTotal)
          : 0,
      dealsTotalPorMes: Math.ceil(motionsCalc.reduce((s, m) => s + m.dealsNecessarios, 0) / 12),
      arrFechadoPorMes: Math.ceil(arrFechadoTotal / 12),
    },
    cs: {
      contasPorCsm:
        csmsTotal > 0
          ? Math.round(
              motionsCalc.reduce(
                (s, m, i) => s + (input.motions[i]!.clientesAtivos + m.dealsNecessarios),
                0,
              ) / csmsTotal,
            )
          : 0,
      grrTarget: input.taxasFunil.grr,
      nrrTarget: input.taxasFunil.nrr,
    },
  }

  // Scientific Forecast
  const scientificForecast: ScientificForecastMonth[] = buildScientificForecast(input)

  return {
    porMotion,
    agregado: {
      sdrsTotal: Math.round(sdrsTotal * 10) / 10,
      aesTotal: Math.round(aesTotal * 10) / 10,
      csmsTotal: Math.round(csmsTotal * 10) / 10,
      custoMarketingTotal: Math.round(custoMarketingTotal),
      arrFechadoTotal: Math.round(arrFechadoTotal),
      pipelineNecessario: Math.round(pipelineNecessario),
    },
    capacityVerdicts,
    metricas,
    hiringPlan,
    scientificForecast,
    warnings,
    verdictTextual: buildVerdictTextual(input, hiringPlan),
  }
}
