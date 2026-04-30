import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cwd = process.cwd()
  const contentDir = join(cwd, 'content')
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

  // Deep check: try reading README.md of first template and parsing frontmatter
  async function deepTemplateCheck() {
    const firstSlug = '01-arquitetura-de-dados'
    const readmePath = join(templatesDir, firstSlug, 'README.md')
    try {
      const raw = await readFile(readmePath, 'utf-8')
      const { data } = matter(raw)
      return {
        ok: true,
        path: readmePath,
        rawLength: raw.length,
        parsedKeys: Object.keys(data),
        parsedData: data,
      }
    } catch (e: unknown) {
      return { ok: false, path: readmePath, error: String(e) }
    }
  }

  const [content, templates, ebook, templateReadme] = await Promise.all([
    safeReaddir(contentDir),
    safeReaddir(templatesDir),
    safeReaddir(ebookDir),
    deepTemplateCheck(),
  ])

  return Response.json({ cwd, content, templates, ebook, templateReadme })
}
