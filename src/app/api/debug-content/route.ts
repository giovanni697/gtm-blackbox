import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import { listTemplates } from '@/lib/content/readTemplates'
import { listChapters } from '@/lib/content/readEbook'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cwd = process.cwd()
  const templatesDir = join(cwd, 'content', 'templates')
  const ebookDir = join(cwd, 'content', 'ebook')

  async function safeReaddir(dir: string) {
    try {
      const entries = await readdir(dir)
      const details = await Promise.all(
        entries.map(async (e) => {
          const s = await stat(join(dir, e)).catch(() => null)
          return { name: e, isDir: s?.isDirectory() ?? null }
        }),
      )
      return { ok: true, entries: details }
    } catch (e: unknown) {
      return { ok: false, error: String(e) }
    }
  }

  async function checkFile(path: string) {
    try {
      const raw = await readFile(path, 'utf-8')
      const { data } = matter(raw)
      return { ok: true, path, rawLength: raw.length, parsedKeys: Object.keys(data) }
    } catch (e: unknown) {
      return { ok: false, path, error: String(e) }
    }
  }

  const [templates, ebook, metaMd, readmeMd, templatesList, chaptersList] = await Promise.all([
    safeReaddir(templatesDir),
    safeReaddir(ebookDir),
    checkFile(join(templatesDir, '01-arquitetura-de-dados', 'meta.md')),
    checkFile(join(templatesDir, '01-arquitetura-de-dados', 'README.md')),
    listTemplates()
      .then((t) => ({ count: t.length, slugs: t.map((x) => x.slug) }))
      .catch((e: unknown) => ({ error: String(e) })),
    listChapters()
      .then((c) => ({ count: c.length }))
      .catch((e: unknown) => ({ error: String(e) })),
  ])

  return Response.json({ cwd, templates, ebook, metaMd, readmeMd, templatesList, chaptersList })
}
