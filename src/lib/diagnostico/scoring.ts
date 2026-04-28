import type {
  Diagnostico,
  Estagio,
  NivelMaturidade,
  Pergunta,
  Resposta,
  SubcamadaP1,
} from './types'

const RESPOSTA_SCORE: Record<Resposta, number> = {
  sim: 1,
  parcial: 0.5,
  nao: 0,
}

function pctToNivel(pct: number): NivelMaturidade {
  if (pct >= 0.85) return 3
  if (pct >= 0.55) return 2
  if (pct >= 0.25) return 1
  return 0
}

export function calcularNiveis(
  perguntas: Pergunta[],
  respostas: Record<string, Resposta>,
): {
  niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>
  subcamadasP1: Record<SubcamadaP1, NivelMaturidade>
  scoreTotal: number
  percentualMaturidade: number
} {
  const byPilar = new Map<1 | 2 | 3 | 4 | 5, Pergunta[]>()
  for (const p of perguntas) {
    const arr = byPilar.get(p.pilar) ?? []
    arr.push(p)
    byPilar.set(p.pilar, arr)
  }

  const niveis = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>
  let totalScore = 0
  let totalPossivel = 0

  for (const [pilar, list] of byPilar.entries()) {
    let s = 0
    for (const p of list) {
      const r = respostas[p.id]
      if (r) s += RESPOSTA_SCORE[r]
    }
    const pct = list.length > 0 ? s / list.length : 0
    niveis[pilar] = pctToNivel(pct)
    totalScore += s
    totalPossivel += list.length
  }

  // Sub-camadas P1
  const sub: Record<SubcamadaP1, NivelMaturidade> = {
    nomenclatura: 0,
    criterios: 0,
    originacao: 0,
    centralizacao: 0,
    enriquecimento: 0,
  }
  const p1List = byPilar.get(1) ?? []
  const subGroups = new Map<SubcamadaP1, Pergunta[]>()
  for (const p of p1List) {
    if (!p.subcamada) continue
    const arr = subGroups.get(p.subcamada) ?? []
    arr.push(p)
    subGroups.set(p.subcamada, arr)
  }
  for (const [name, list] of subGroups.entries()) {
    let s = 0
    for (const p of list) {
      const r = respostas[p.id]
      if (r) s += RESPOSTA_SCORE[r]
    }
    sub[name] = pctToNivel(list.length > 0 ? s / list.length : 0)
  }

  const percentualMaturidade = totalPossivel > 0 ? (totalScore / totalPossivel) * 100 : 0

  return {
    niveis,
    subcamadasP1: sub,
    scoreTotal: Math.round(totalScore * 10) / 10,
    percentualMaturidade: Math.round(percentualMaturidade * 10) / 10,
  }
}

export function identificarGargalo(
  niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>,
): 1 | 2 | 3 | 4 | 5 {
  // TOC: pilar com menor nível. Em empate, prioriza pilar fundacional (P1 > P2 > P3 > P4 > P5).
  const ordemFundacional: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5]
  let menorNivel: NivelMaturidade = 3
  let gargalo: 1 | 2 | 3 | 4 | 5 = 1
  for (const p of ordemFundacional) {
    if (niveis[p] < menorNivel) {
      menorNivel = niveis[p]
      gargalo = p
    }
  }
  return gargalo
}

export function avaliarReadiness(
  niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>,
  estagio: Estagio,
): { aiReady: boolean; arpeReady: boolean; areReady: boolean } {
  const valores = Object.values(niveis)
  const minNivel = Math.min(...valores)

  // ARPE-ready: todos os pilares >= 1 (estrutura básica)
  const arpeReady = minNivel >= 1

  // ARE-ready: todos os pilares >= 2 (implementado)
  const areReady = minNivel >= 2

  // AI-ready: P1 e P3 >= 2 (data + processos), P2 >= 1 (metodologia mínima)
  const aiReady = niveis[1] >= 2 && niveis[3] >= 2 && niveis[2] >= 1

  // Estágio declarado vs readiness real
  void estagio
  return { aiReady, arpeReady, areReady }
}

export function montarDiagnostico(
  userId: string,
  estagio: Estagio,
  perguntas: Pergunta[],
  respostas: Record<string, Resposta>,
): Omit<Diagnostico, 'id' | 'createdAt'> {
  const calc = calcularNiveis(perguntas, respostas)
  const gargaloPilar = identificarGargalo(calc.niveis)
  const readiness = avaliarReadiness(calc.niveis, estagio)
  return {
    userId,
    estagio,
    niveis: calc.niveis,
    subcamadasP1: calc.subcamadasP1,
    scoreTotal: calc.scoreTotal,
    percentualMaturidade: calc.percentualMaturidade,
    gargaloPilar,
    ...readiness,
  }
}
