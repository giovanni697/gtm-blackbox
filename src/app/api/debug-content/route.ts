import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

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

  const [content, templates, ebook] = await Promise.all([
    safeReaddir(contentDir),
    safeReaddir(templatesDir),
    safeReaddir(ebookDir),
  ])

  return Response.json({ cwd, content, templates, ebook })
}
