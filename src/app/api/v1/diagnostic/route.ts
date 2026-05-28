import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/auth'
import { listPerguntas } from '@/lib/content/readPerguntas'
import { calcularNiveis } from '@/lib/diagnostico/scoring'
import { gerarRoadmap } from '@/lib/diagnostico/roadmap-engine'
import { PILARES } from '@/lib/diagnostico/types'
import type { Resposta } from '@/lib/diagnostico/types'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  perfil: z.object({
    nome: z.string().optional(),
    empresa: z.string().optional(),
    estagio: z.enum(['ARMV', 'ARPE', 'ARE']).default('ARMV'),
  }),
  respostas: z.record(z.string(), z.enum(['sim', 'nao', 'parcial'])),
})

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-gtm-key') ?? ''
  const auth = await validateApiKey(key)
  if (auth.status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized. Provide X-GTM-Key header.' }, { status: 401 })
  }
  if (auth.status === 'rate_limited') {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: auth.headers },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { perfil, respostas } = parsed.data
  const perguntas = await listPerguntas()

  const { niveis, subcamadasP1, scoreTotal, percentualMaturidade } = calcularNiveis(
    perguntas,
    respostas as Record<string, Resposta>,
  )

  // Find gargalo (lowest scoring pilar)
  const pilaresSorted = Object.entries(niveis)
    .map(([pilar, nivel]) => ({ pilar: Number(pilar) as 1 | 2 | 3 | 4 | 5, nivel }))
    .sort((a, b) => a.nivel - b.nivel)
  const gargalo = pilaresSorted[0]!
  const gargaloPilar = PILARES.find((p) => p.numero === gargalo.pilar)

  const diagnostico = {
    perfil,
    nivelP1: niveis[1],
    nivelP2: niveis[2],
    nivelP3: niveis[3],
    nivelP4: niveis[4],
    nivelP5: niveis[5],
    subcamadasP1,
    scoreTotal,
    percentualMaturidade,
    aiReady: niveis[1] >= 2 && niveis[2] >= 2,
    arpeReady: niveis[1] >= 1 && niveis[2] >= 1 && niveis[3] >= 1,
    areReady: Object.values(niveis).every((n) => n >= 2),
    // For gerarRoadmap compatibility
    niveis,
    gargaloPilar: gargalo.pilar,
  }

  const roadmap = gerarRoadmap(diagnostico)

  return NextResponse.json({
    diagnostico: {
      perfil: diagnostico.perfil,
      nivelP1: diagnostico.nivelP1,
      nivelP2: diagnostico.nivelP2,
      nivelP3: diagnostico.nivelP3,
      nivelP4: diagnostico.nivelP4,
      nivelP5: diagnostico.nivelP5,
      subcamadasP1: diagnostico.subcamadasP1,
      scoreTotal: diagnostico.scoreTotal,
      percentualMaturidade: diagnostico.percentualMaturidade,
      aiReady: diagnostico.aiReady,
      arpeReady: diagnostico.arpeReady,
      areReady: diagnostico.areReady,
    },
    gargalo: {
      pilar: gargalo.pilar,
      nivel: gargalo.nivel,
      nome: gargaloPilar?.nome,
      descricao: gargaloPilar?.descricao,
    },
    roadmap,
    respondidas: Object.keys(respostas).length,
    totalPerguntas: perguntas.length,
  })
}
