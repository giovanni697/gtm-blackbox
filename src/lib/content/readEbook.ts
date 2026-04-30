import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { unstable_cache } from 'next/cache'
import { z } from 'zod'

const ChapterFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  order: z.number().int().nonnegative(),
  estimatedReadingMinutes: z.number().int().positive(),
  lastUpdated: z.string(),
  pillar: z.string().optional(),
  status: z.enum(['draft', 'published']).default('published'),
})

export type ChapterFrontmatter = z.infer<typeof ChapterFrontmatterSchema>

export type Chapter = ChapterFrontmatter & {
  filename: string
  content: string
}

export type ChapterSummary = ChapterFrontmatter & {
  filename: string
}

const EBOOK_DIR = path.join(process.cwd(), 'content', 'ebook')

async function readChapterFile(filename: string): Promise<Chapter | null> {
  const full = path.join(EBOOK_DIR, filename)
  const raw = await fs.readFile(full, 'utf-8')
  const parsed = matter(raw)
  const fm = ChapterFrontmatterSchema.safeParse(parsed.data)
  if (!fm.success) {
    console.error(`[readEbook] frontmatter inválido em ${filename}:`, fm.error.flatten())
    return null
  }
  return { ...fm.data, filename, content: parsed.content }
}

export const listChapters = unstable_cache(
  async function listChapters(): Promise<ChapterSummary[]> {
    let files: string[]
    try {
      files = await fs.readdir(EBOOK_DIR)
    } catch {
      return []
    }
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'))
    const chapters = await Promise.all(mdxFiles.map((f) => readChapterFile(f)))
    return chapters
      .filter((c): c is Chapter => c !== null && c.status === 'published')
      .sort((a, b) => a.order - b.order)
      .map(
        (c): ChapterSummary => ({
          filename: c.filename,
          title: c.title,
          slug: c.slug,
          order: c.order,
          estimatedReadingMinutes: c.estimatedReadingMinutes,
          lastUpdated: c.lastUpdated,
          pillar: c.pillar,
          status: c.status,
        }),
      )
  },
  ['list-chapters'],
  { revalidate: 3600 },
)

export async function getChapterBySlug(slug: string): Promise<Chapter | null> {
  let files: string[]
  try {
    files = await fs.readdir(EBOOK_DIR)
  } catch {
    return null
  }
  for (const filename of files) {
    if (!filename.endsWith('.mdx')) continue
    const chapter = await readChapterFile(filename)
    if (chapter && chapter.slug === slug) return chapter
  }
  return null
}

export async function getChapterNeighbors(
  slug: string,
): Promise<{ prev: ChapterSummary | null; next: ChapterSummary | null }> {
  const all = await listChapters()
  const idx = all.findIndex((c) => c.slug === slug)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: idx > 0 ? all[idx - 1]! : null,
    next: idx < all.length - 1 ? all[idx + 1]! : null,
  }
}
