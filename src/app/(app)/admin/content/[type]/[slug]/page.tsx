import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireAdmin } from '@/lib/email/admin-guard'
import {
  getContentOverride,
  VALID_CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  type ContentType,
} from '@/lib/content/getContentOverride'
import { getChapterOriginalBody, listChapters } from '@/lib/content/readEbook'
import { getTemplateOriginalBody, listTemplates } from '@/lib/content/readTemplates'
import { createServiceClient } from '@/lib/supabase/service'
import { EditorWrapper } from './EditorWrapper'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { type: string; slug: string }
}

async function getContentTitle(type: ContentType, slug: string): Promise<string> {
  if (type === 'ebook') {
    const chapters = await listChapters()
    const ch = chapters.find((c) => c.slug === slug)
    return ch ? `${ch.order}. ${ch.title}` : slug
  }
  const templates = await listTemplates()
  const tpl = templates.find((t) => t.slug === slug)
  return tpl ? `${tpl.number} — ${tpl.title}` : slug
}

async function getOriginalBody(type: ContentType, slug: string): Promise<string | null> {
  if (type === 'ebook') {
    return getChapterOriginalBody(slug)
  }
  const sectionMap: Record<ContentType, 'description' | 'body' | 'rubrica'> = {
    ebook: 'description', // never used here
    template_description: 'description',
    template_body: 'body',
    template_rubrica: 'rubrica',
  }
  return getTemplateOriginalBody(slug, sectionMap[type])
}

export default async function ContentEditorPage({ params }: PageProps) {
  await requireAdmin()

  const { type, slug } = params

  // Validar o type
  if (!VALID_CONTENT_TYPES.includes(type as ContentType)) notFound()
  const contentType = type as ContentType

  // Carregar override existente (se houver) + body original do filesystem em paralelo
  const [override, originalBody, title] = await Promise.all([
    getContentOverride(contentType, slug),
    getOriginalBody(contentType, slug),
    getContentTitle(contentType, slug),
  ])

  if (originalBody === null) notFound()

  const currentBody = override ?? originalBody
  const hasOverride = override !== null

  // Timestamp da última edição (se houver override)
  let lastEditedAt: string | null = null
  let lastEditedBy: string | null = null
  if (hasOverride) {
    const sb = createServiceClient()
    const { data } = await sb
      .from('content_edits')
      .select('updated_at, updated_by')
      .eq('content_type', contentType)
      .eq('slug', slug)
      .maybeSingle()
    if (data) {
      lastEditedAt = new Date(data.updated_at as string).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      lastEditedBy = data.updated_by as string
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/admin/content"
          className="flex items-center gap-1 font-sora text-xs text-scient-gray transition-colors hover:text-scient-dark"
        >
          <ChevronLeft size={13} strokeWidth={1.5} />
          Conteúdo
        </Link>
        <span className="text-scient-divider">/</span>
        <span className="font-sora text-xs text-scient-gray">
          {CONTENT_TYPE_LABELS[contentType]}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6 border-b border-scient-divider pb-6">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Admin · Editor · {CONTENT_TYPE_LABELS[contentType]}
        </p>
        <h1 className="mt-1 font-sora text-xl font-semibold leading-tight text-scient-dark">
          {title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded bg-scient-bg px-2 py-0.5 font-mono text-3xs text-scient-gray">
            {contentType}/{slug}
          </code>
          {hasOverride ? (
            <span className="rounded-sm bg-amber-100 px-2 py-0.5 font-sora text-3xs font-semibold uppercase tracking-wider text-amber-700">
              override ativo
            </span>
          ) : (
            <span className="rounded-sm bg-green-50 px-2 py-0.5 font-sora text-3xs font-semibold uppercase tracking-wider text-green-700">
              original do arquivo
            </span>
          )}
          {hasOverride && lastEditedAt && (
            <span className="font-sora text-3xs text-scient-gray">
              Editado em {lastEditedAt} por {lastEditedBy}
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorWrapper
        contentType={contentType}
        slug={slug}
        currentBody={currentBody}
        hasOverride={hasOverride}
      />
    </div>
  )
}
