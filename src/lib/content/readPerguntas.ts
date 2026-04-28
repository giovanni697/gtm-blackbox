import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'
import type { Pergunta, Estagio } from '@/lib/diagnostico/types'

const PerguntaSchema = z.object({
  id: z.string(),
  pilar: z.number().int().min(1).max(5).optional(),
  subcamada: z
    .enum(['nomenclatura', 'criterios', 'originacao', 'centralizacao', 'enriquecimento'])
    .optional(),
  estagioMinimo: z.enum(['ARMV', 'ARPE', 'ARE']),
  texto: z.string(),
  hint: z.string().optional(),
})

const FileSchema = z.object({
  pilar: z.number().int().min(1).max(5),
  nome: z.string(),
  perguntas: z.array(PerguntaSchema),
})

const DIR = path.join(process.cwd(), 'content', 'diagnostico', 'perguntas')

const ESTAGIO_ORDER: Record<Estagio, number> = { ARMV: 0, ARPE: 1, ARE: 2 }

export async function listPerguntas(): Promise<Pergunta[]> {
  let files: string[]
  try {
    files = await fs.readdir(DIR)
  } catch {
    return []
  }

  const all: Pergunta[] = []
  for (const filename of files) {
    if (!filename.endsWith('.md')) continue
    const raw = await fs.readFile(path.join(DIR, filename), 'utf-8')
    const { data } = matter(raw)
    const parsed = FileSchema.safeParse(data)
    if (!parsed.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[readPerguntas] erro em ${filename}:`, parsed.error.flatten())
      }
      continue
    }
    for (const p of parsed.data.perguntas) {
      all.push({
        id: p.id,
        pilar: parsed.data.pilar as 1 | 2 | 3 | 4 | 5,
        subcamada: p.subcamada,
        estagioMinimo: p.estagioMinimo,
        texto: p.texto,
        hint: p.hint,
      })
    }
  }
  return all
}

export async function getPerguntasParaEstagio(estagio: Estagio): Promise<Pergunta[]> {
  const all = await listPerguntas()
  const limit = ESTAGIO_ORDER[estagio]
  return all.filter((p) => ESTAGIO_ORDER[p.estagioMinimo] <= limit)
}

export async function getPerguntasByPilar(
  estagio: Estagio,
): Promise<Map<1 | 2 | 3 | 4 | 5, Pergunta[]>> {
  const list = await getPerguntasParaEstagio(estagio)
  const byPilar = new Map<1 | 2 | 3 | 4 | 5, Pergunta[]>()
  for (const p of list) {
    const arr = byPilar.get(p.pilar) ?? []
    arr.push(p)
    byPilar.set(p.pilar, arr)
  }
  return byPilar
}
