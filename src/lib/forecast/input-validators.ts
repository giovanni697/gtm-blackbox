import type { ForecastInput, ValidationWarning } from './types'
import { BENCHMARKS_POR_MOTION } from './benchmarks-por-motion'

export function validateInputs(input: ForecastInput): ValidationWarning[] {
  const warnings: ValidationWarning[] = []

  // Win rate suspeito
  if (input.taxasFunil.winRate > 40) {
    warnings.push({
      field: 'winRate',
      severity: 'warn',
      message:
        'Win Rate acima de 40% pode indicar conservadorismo (não está colocando todas as oportunidades reais no pipeline).',
      benchmark: 'Pavilion: 20-33% para B2B mid-market',
    })
  }
  if (input.taxasFunil.winRate < 10) {
    warnings.push({
      field: 'winRate',
      severity: 'warn',
      message: 'Win Rate abaixo de 10% indica pipeline mal qualificado ou produto sem fit.',
    })
  }

  // GRR/NRR
  if (input.taxasFunil.grr < 80) {
    warnings.push({
      field: 'grr',
      severity: 'critical',
      message:
        'GRR abaixo de 80% indica problema severo de retenção. Forecast vira ficção sem corrigir antes.',
      benchmark: 'ICONIQ Top Quartile: GRR >95%',
    })
  }
  if (input.taxasFunil.nrr < 100) {
    warnings.push({
      field: 'nrr',
      severity: 'warn',
      message:
        'NRR abaixo de 100% significa que a base existente está encolhendo. Crescimento depende 100% de New Logo.',
      benchmark: 'ICONIQ Top Quartile: NRR ≥120%',
    })
  }

  // Soma dos pct_arr deve ser 100
  const totalPct = input.motions.reduce((s, m) => s + m.pctArr, 0)
  if (Math.abs(totalPct - 100) > 1) {
    warnings.push({
      field: 'motions.pctArr',
      severity: 'critical',
      message: `Soma dos % de Receita por motion = ${totalPct.toFixed(1)}%. Deveria ser 100%.`,
    })
  }

  // Avisos específicos por tipo de receita
  for (const m of input.motions) {
    if (!m.recorrente) {
      warnings.push({
        field: `motions.${m.modal}.recorrente`,
        severity: 'info',
        message: `Motion ${m.modal} declarado como não-recorrente. Métricas de GRR/NRR se aplicam apenas à taxa de renovação de contratos, não a ARR acumulado. A meta de receita é tratada como volume de novos fechamentos por horizonte.`,
      })
    }
    if (m.duracaoContrataMeses > 0) {
      const churnNatural = (1 / m.duracaoContrataMeses) * 100
      if (churnNatural > 10 && m.recorrente) {
        warnings.push({
          field: `motions.${m.modal}.duracaoContrataMeses`,
          severity: 'warn',
          message: `Duração média de ${m.duracaoContrataMeses} meses implica churn natural de ${churnNatural.toFixed(1)}%/mês. Com GRR atual de ${input.taxasFunil.grr}%, verifique se a taxa de renovação compensa o churn por fim de contrato.`,
        })
      }
    }
  }

  // ACV/cycle/capacity por motion
  for (const m of input.motions) {
    const bench = BENCHMARKS_POR_MOTION[m.modal]

    if (m.acvBrl < bench.acvBrl.min || m.acvBrl > bench.acvBrl.max) {
      warnings.push({
        field: `motions.${m.modal}.acvBrl`,
        severity: 'info',
        message: `ACV de R$${m.acvBrl.toLocaleString('pt-BR')} está fora da banda típica para motion ${m.modal} (R$${bench.acvBrl.min.toLocaleString('pt-BR')}–R$${bench.acvBrl.max.toLocaleString('pt-BR')}).`,
      })
    }

    if (m.cicloDias < bench.cicloDias.min || m.cicloDias > bench.cicloDias.max) {
      warnings.push({
        field: `motions.${m.modal}.cicloDias`,
        severity: 'info',
        message: `Ciclo de ${m.cicloDias} dias está fora da banda típica para motion ${m.modal} (${bench.cicloDias.min}-${bench.cicloDias.max} dias).`,
      })
    }

    if (m.modal !== 'no_touch' && m.modal !== 'canal') {
      if (
        m.sdrsCapacityPorMes > bench.sqlsPorSdrPorMes.max * 1.3 ||
        m.sdrsCapacityPorMes < bench.sqlsPorSdrPorMes.min * 0.7
      ) {
        warnings.push({
          field: `motions.${m.modal}.sdrsCapacityPorMes`,
          severity: 'warn',
          message: `Capacity por SDR (${m.sdrsCapacityPorMes}/mês) está fora da banda do motion ${m.modal} (${bench.sqlsPorSdrPorMes.min}-${bench.sqlsPorSdrPorMes.max}/mês).`,
        })
      }

      if (
        m.aesDealsPorMes > bench.dealsPorAePorMes.max * 1.3 ||
        m.aesDealsPorMes < bench.dealsPorAePorMes.min * 0.7
      ) {
        warnings.push({
          field: `motions.${m.modal}.aesDealsPorMes`,
          severity: 'warn',
          message: `Deals/AE/mês (${m.aesDealsPorMes}) fora da banda do motion ${m.modal} (${bench.dealsPorAePorMes.min}-${bench.dealsPorAePorMes.max}).`,
        })
      }
    }

    if (m.csmsContasMax > bench.contasPorCsmMax * 1.3) {
      warnings.push({
        field: `motions.${m.modal}.csmsContasMax`,
        severity: 'warn',
        message: `Contas/CSM (${m.csmsContasMax}) acima do máximo razoável para motion ${m.modal} (${bench.contasPorCsmMax}).`,
      })
    }
  }

  // Meta vs ARR atual
  const crescimento =
    ((input.arrMetaBrl - input.arrAtualBrl) / Math.max(1, input.arrAtualBrl)) * 100
  if (crescimento > 200) {
    warnings.push({
      field: 'arrMetaBrl',
      severity: 'warn',
      message: `Meta de ${crescimento.toFixed(0)}% de crescimento em ${input.horizonMeses} meses é agressiva. Top quartile cresce 100-200% YoY em ARPE.`,
    })
  }

  return warnings
}
