import type { CapacityStatus, CapacityVerdict, Funcao, Motion } from './types'

export function classifyCapacity(
  funcao: Funcao,
  motion: Motion | 'agregado',
  atual: number,
  necessario: number,
): CapacityVerdict {
  if (necessario <= 0) {
    return {
      funcao,
      motion,
      atual,
      necessario,
      pctAtendimento: 100,
      status: 'ok',
      gap: 0,
      message: 'Não aplicável a esse motion.',
    }
  }

  const pct = (atual / necessario) * 100
  let status: CapacityStatus
  let message: string
  const gap = necessario - atual

  if (pct < 60) {
    status = 'critico'
    message = `Capacity em ${pct.toFixed(0)}% do necessário — gap de ${gap.toFixed(1)} unidades. Sem ação imediata, meta não bate.`
  } else if (pct < 80) {
    status = 'falta'
    message = `Capacity em ${pct.toFixed(0)}% — falta ${gap.toFixed(1)} unidade${gap > 1.5 ? 's' : ''} para conforto.`
  } else if (pct <= 110) {
    status = 'ok'
    message = `Capacity em ${pct.toFixed(0)}% — dentro da banda saudável (80-110%).`
  } else {
    status = 'sobra'
    message = `Capacity em ${pct.toFixed(0)}% — sobra de ${(atual - necessario).toFixed(1)} unidade${atual - necessario > 1.5 ? 's' : ''}. Avaliar subutilização ou se a meta está baixa demais.`
  }

  return {
    funcao,
    motion,
    atual,
    necessario,
    pctAtendimento: Math.round(pct * 10) / 10,
    status,
    gap: Math.max(0, gap),
    message,
  }
}
