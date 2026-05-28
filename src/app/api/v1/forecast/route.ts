import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/auth'
import { buildScientificForecast } from '@/lib/forecast/scientific-forecast'
import type { ForecastInput } from '@/lib/forecast/types'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const MotionSchema = z.object({
  modal: z.enum(['no_touch', 'low_touch', 'mid_touch', 'high_touch', 'canal']),
  acvBrl: z.number().positive(),
  cicloDias: z.number().positive(),
  pctArr: z.number().min(0).max(100),
  recorrente: z.boolean().default(true),
  duracaoContrataMeses: z.number().default(12),
  sdrsAtuais: z.number().min(0).default(0),
  sdrsCapacityPorMes: z.number().min(0).default(10),
  aesAtuais: z.number().min(0).default(1),
  aesDealsPorMes: z.number().min(0).default(4),
  csmsAtuais: z.number().min(0).default(0),
  csmsContasMax: z.number().min(0).default(50),
  clientesAtivos: z.number().min(0).default(0),
})

const ForecastInputSchema = z.object({
  arrAtualBrl: z.number().min(0),
  arrMetaBrl: z.number().positive(),
  horizonMeses: z.number().int().min(1).max(36).default(12),
  motions: z.array(MotionSchema).min(1),
  taxasFunil: z.object({
    accountMqa: z.number(),
    mqaSql: z.number(),
    sqlSal: z.number(),
    winRate: z.number(),
    grr: z.number().min(0).max(150),
    nrr: z.number().min(0).max(200),
  }),
  marketing: z.object({
    custoPorMqaBrl: z.number(),
    budgetMensalBrl: z.number(),
    campanhasDedicadasPorMotion: z.boolean().default(false),
  }),
  constantes: z
    .object({
      rampMeses: z.number().default(5),
      attritionPct: z.number().default(10),
      atingimentoTopQuartilePct: z.number().default(60),
      turnoverPct: z.number().default(20),
      pipelineCoverageTarget: z.number().default(3),
    })
    .optional(),
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

  const parsed = ForecastInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const input: ForecastInput = {
    ...parsed.data,
    constantes: parsed.data.constantes ?? {
      rampMeses: 5,
      attritionPct: 10,
      atingimentoTopQuartilePct: 60,
      turnoverPct: 20,
      pipelineCoverageTarget: 3,
    },
  }

  const forecast = buildScientificForecast(input)

  const ultimo = forecast[forecast.length - 1]
  return NextResponse.json({
    horizonMeses: input.horizonMeses,
    arrAtual: input.arrAtualBrl,
    arrMeta: input.arrMetaBrl,
    arrProjetado: ultimo ? ultimo.eopMrr * 12 : 0,
    gapVsMeta: ultimo ? ultimo.gapVsMeta : input.arrMetaBrl - input.arrAtualBrl,
    meses: forecast,
  })
}
