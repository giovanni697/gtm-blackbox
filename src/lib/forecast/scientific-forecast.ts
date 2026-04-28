import type { ForecastInput, ScientificForecastMonth } from './types'

const arrToMrr = (arr: number) => arr / 12

export function buildScientificForecast(input: ForecastInput): ScientificForecastMonth[] {
  const horizon = input.horizonMeses
  const months: ScientificForecastMonth[] = []

  const mrrAtual = arrToMrr(input.arrAtualBrl)
  const mrrMeta = arrToMrr(input.arrMetaBrl)

  // GRR anual → retenção mensal via raiz 12ª (o GRR já incorpora não-renovação de contratos)
  const grrMensal = input.taxasFunil.grr / 100
  const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12))

  const expansionRate = (input.taxasFunil.nrr - input.taxasFunil.grr) / 100 / 12

  // Fator mensal combinado (retenção + expansão sobre a base existente)
  const k = grrMensalEfetivo + expansionRate
  const kH = Math.pow(k, horizon)

  // Solução analítica exata: new logo por mês para que EOP[horizon] = mrrMeta
  // EOP[H] = mrrAtual × k^H + NL × (k^H − 1)/(k − 1)  ⟹  resolve para NL
  const newLogoMrrMonthly =
    k === 1
      ? Math.max(0, (mrrMeta - mrrAtual) / horizon)
      : Math.max(0, ((mrrMeta - mrrAtual * kH) * (k - 1)) / (kH - 1))

  let bopMrr = mrrAtual

  for (let m = 1; m <= horizon; m++) {
    const churnMrr = bopMrr * (1 - grrMensalEfetivo)
    const expansionMrr = bopMrr * expansionRate
    const newLogoMrr = Math.max(0, newLogoMrrMonthly)
    const eopMrr = bopMrr - churnMrr + expansionMrr + newLogoMrr

    const pipelineNecessario = newLogoMrr * 12 * input.constantes.pipelineCoverageTarget
    const arrAcumulado = eopMrr * 12
    const gapVsMeta = input.arrMetaBrl - arrAcumulado

    months.push({
      mes: m,
      bopMrr: Math.round(bopMrr),
      newLogoMrr: Math.round(newLogoMrr),
      expansionMrr: Math.round(expansionMrr),
      churnMrr: Math.round(churnMrr),
      eopMrr: Math.round(eopMrr),
      pipelineCoverage: Math.round(pipelineNecessario),
      gapVsMeta: Math.round(gapVsMeta),
    })

    bopMrr = eopMrr
  }

  return months
}
