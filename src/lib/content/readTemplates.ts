import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

const TemplateMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  pilar: z.number().int().min(1).max(5),
  number: z.string(),
  estagioMinimo: z.enum(['ARMV', 'ARPE', 'ARE']).default('ARMV'),
  duracaoImplementacao: z.string(),
  outputEsperado: z.string(),
  preRequisitos: z.array(z.string()).default([]),
  lastUpdated: z.string(),
})

export type TemplateMeta = z.infer<typeof TemplateMetaSchema>

export type TemplateDetail = TemplateMeta & {
  readme: string
  template: string
  rubrica: string
}

const TEMPLATES_DIR = path.join(process.cwd(), 'content', 'templates')

async function readMarkdownFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8')
  } catch {
    return null
  }
}

export async function listTemplates(): Promise<TemplateMeta[]> {
  let dirs: string[]
  try {
    dirs = await fs.readdir(TEMPLATES_DIR)
  } catch {
    return []
  }

  const list: TemplateMeta[] = []
  for (const dir of dirs) {
    const dirPath = path.join(TEMPLATES_DIR, dir)
    const stat = await fs.stat(dirPath).catch(() => null)
    if (!stat?.isDirectory()) continue

    const readmeRaw = await readMarkdownFile(path.join(dirPath, 'README.md'))
    if (!readmeRaw) continue

    const { data } = matter(readmeRaw)
    const parsed = TemplateMetaSchema.safeParse({ ...data, slug: data.slug ?? dir })
    if (!parsed.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[readTemplates] frontmatter inválido em ${dir}:`, parsed.error.flatten())
      }
      continue
    }
    list.push(parsed.data)
  }

  return list.sort((a, b) => a.number.localeCompare(b.number))
}

export async function getTemplateBySlug(slug: string): Promise<TemplateDetail | null> {
  const dirPath = path.join(TEMPLATES_DIR, slug)
  const stat = await fs.stat(dirPath).catch(() => null)
  if (!stat?.isDirectory()) return null

  const readmeRaw = await readMarkdownFile(path.join(dirPath, 'README.md'))
  if (!readmeRaw) return null

  const readmeParsed = matter(readmeRaw)
  const meta = TemplateMetaSchema.safeParse({
    ...readmeParsed.data,
    slug: readmeParsed.data.slug ?? slug,
  })
  if (!meta.success) return null

  const templateRaw = await readMarkdownFile(path.join(dirPath, 'template.md'))
  const rubricaRaw = await readMarkdownFile(path.join(dirPath, 'rubrica-implementacao.md'))

  return {
    ...meta.data,
    readme: readmeParsed.content,
    template: templateRaw ? matter(templateRaw).content : '',
    rubrica: rubricaRaw ? matter(rubricaRaw).content : '',
  }
}
