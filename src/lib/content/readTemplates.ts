import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { cache } from 'react'
import { z } from 'zod'
import { getContentOverride } from './getContentOverride'

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

export const listTemplates = cache(async function listTemplates(): Promise<TemplateMeta[]> {
  let dirs: string[]
  try {
    dirs = await fs.readdir(TEMPLATES_DIR)
  } catch (e) {
    console.error(
      `[readTemplates] readdir failed: ${e} — cwd=${process.cwd()} dir=${TEMPLATES_DIR}`,
    )
    return []
  }

  const list: TemplateMeta[] = []
  for (const dir of dirs) {
    const dirPath = path.join(TEMPLATES_DIR, dir)
    const stat = await fs.stat(dirPath).catch(() => null)
    if (!stat?.isDirectory()) continue

    const readmeRaw = await readMarkdownFile(path.join(dirPath, 'meta.md'))
    if (!readmeRaw) continue

    const { data } = matter(readmeRaw)
    const parsed = TemplateMetaSchema.safeParse({ ...data, slug: data.slug ?? dir })
    if (!parsed.success) {
      console.error(`[readTemplates] frontmatter inválido em ${dir}:`, parsed.error.flatten())
      continue
    }
    list.push(parsed.data)
  }

  return list.sort((a, b) => a.number.localeCompare(b.number))
})

export async function getTemplateNeighbors(slug: string): Promise<{
  prev: TemplateMeta | null
  next: TemplateMeta | null
}> {
  const all = await listTemplates()
  const idx = all.findIndex((t) => t.slug === slug)
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  }
}

export async function getTemplateBySlug(slug: string): Promise<TemplateDetail | null> {
  const dirPath = path.join(TEMPLATES_DIR, slug)
  const stat = await fs.stat(dirPath).catch(() => null)
  if (!stat?.isDirectory()) return null

  const readmeRaw = await readMarkdownFile(path.join(dirPath, 'meta.md'))
  if (!readmeRaw) return null

  const readmeParsed = matter(readmeRaw)
  const meta = TemplateMetaSchema.safeParse({
    ...readmeParsed.data,
    slug: readmeParsed.data.slug ?? slug,
  })
  if (!meta.success) return null

  const templateRaw = await readMarkdownFile(path.join(dirPath, 'template.md'))
  const rubricaRaw = await readMarkdownFile(path.join(dirPath, 'rubrica-implementacao.md'))

  const fsReadme = readmeParsed.content
  const fsTemplate = templateRaw ? matter(templateRaw).content : ''
  const fsRubrica = rubricaRaw ? matter(rubricaRaw).content : ''

  // Verificar overrides do admin para cada seção
  const [descOverride, bodyOverride, rubricaOverride] = await Promise.all([
    getContentOverride('template_description', slug),
    getContentOverride('template_body', slug),
    getContentOverride('template_rubrica', slug),
  ])

  return {
    ...meta.data,
    readme: descOverride ?? fsReadme,
    template: bodyOverride ?? fsTemplate,
    rubrica: rubricaOverride ?? fsRubrica,
  }
}

/** Lê o body ORIGINAL do filesystem para uma seção, sem aplicar overrides. Usado pelo admin. */
export async function getTemplateOriginalBody(
  slug: string,
  section: 'description' | 'body' | 'rubrica',
): Promise<string | null> {
  const dirPath = path.join(TEMPLATES_DIR, slug)
  const stat = await fs.stat(dirPath).catch(() => null)
  if (!stat?.isDirectory()) return null

  if (section === 'description') {
    const raw = await readMarkdownFile(path.join(dirPath, 'meta.md'))
    return raw ? matter(raw).content : null
  }
  if (section === 'body') {
    const raw = await readMarkdownFile(path.join(dirPath, 'template.md'))
    return raw ? matter(raw).content : null
  }
  if (section === 'rubrica') {
    const raw = await readMarkdownFile(path.join(dirPath, 'rubrica-implementacao.md'))
    return raw ? matter(raw).content : null
  }
  return null
}
