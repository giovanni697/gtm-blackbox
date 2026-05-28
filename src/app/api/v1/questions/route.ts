import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/auth'
import { listPerguntas } from '@/lib/content/readPerguntas'
import type { Estagio } from '@/lib/diagnostico/types'

export const dynamic = 'force-dynamic'

const ESTAGIO_ORDER: Record<Estagio, number> = { ARMV: 0, ARPE: 1, ARE: 2 }

export async function GET(req: NextRequest) {
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

  const estagio = req.nextUrl.searchParams.get('estagio') as Estagio | null
  const validEstagios: Estagio[] = ['ARMV', 'ARPE', 'ARE']

  let perguntas = await listPerguntas()
  if (estagio && validEstagios.includes(estagio)) {
    const limit = ESTAGIO_ORDER[estagio]
    perguntas = perguntas.filter((p) => ESTAGIO_ORDER[p.estagioMinimo] <= limit)
  }

  return NextResponse.json({
    total: perguntas.length,
    estagio: estagio ?? 'all',
    perguntas,
  })
}
