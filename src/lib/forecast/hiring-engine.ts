import type { CapacityVerdict, HiringAction, HiringPlan } from './types'

export function capacityNoMes(mesContratacao: number, mesAtual: number, rampMeses = 5): number {
  if (mesAtual < mesContratacao) return 0
  const mesesNoRole = mesAtual - mesContratacao + 1
  if (mesesNoRole >= rampMeses) return 1.0
  return 0.1 + ((mesesNoRole - 1) / Math.max(1, rampMeses - 1)) * 0.9
}

export function buildHiringPlan(
  verdicts: CapacityVerdict[],
  horizonMeses = 12,
  rampMeses = 5,
): HiringPlan {
  const actions: HiringAction[] = []
  // mesAlvo nunca ultrapassa o horizonte; mínimo 6 para dar tempo de ramp
  const mesAlvo = Math.min(horizonMeses, Math.max(6, Math.ceil(horizonMeses / 2)))

  for (const v of verdicts) {
    if (v.funcao === 'marketing') continue // budget, não headcount
    if (v.status !== 'falta' && v.status !== 'critico') continue
    if (v.gap < 0.3) continue

    const rawMesContratacao = mesAlvo - rampMeses
    const mesContratacao = Math.max(1, rawMesContratacao)
    const headcount = Math.ceil(v.gap)
    const cap = capacityNoMes(mesContratacao, mesAlvo, rampMeses)
    const capacityEntregueAteMesAlvo = cap * headcount
    const role = `${v.funcao}${v.motion !== 'agregado' ? ` (${v.motion})` : ''}`

    actions.push({
      role,
      motion: v.motion,
      headcount,
      mesContratacao,
      mesFullCapacity: mesContratacao + rampMeses,
      capacityEntregueAteMesAlvo: Math.round(capacityEntregueAteMesAlvo * 10) / 10,
      bloqueante:
        rawMesContratacao < 1
          ? `Inviável via contratação: precisaria contratar ${Math.abs(rawMesContratacao)} ${Math.abs(rawMesContratacao) === 1 ? 'mês' : 'meses'} antes do início do horizonte. Transfira senior interno ou revise a meta.`
          : null,
    })
  }

  const viavel = actions.every((a) => !a.bloqueante)

  const alternativas: string[] = []
  if (!viavel) {
    alternativas.push(
      'Revisar meta para baixo (ajustar para o que a capacity atual + ramp realista entregam).',
      'Transferir senior interno de outra função (sem ramp) para o gargalo.',
      'Acelerar via consultoria especializada / Forward Deployed temporário.',
      'Aceitar gap declarado e renegociar com board.',
    )
  }

  return { actions, viavel, alternativasSeInviavel: alternativas }
}
