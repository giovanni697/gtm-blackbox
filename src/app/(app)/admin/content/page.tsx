import Link from 'next/link'
import { PenLine, FileText, LayoutTemplate } from 'lucide-react'
import { requireAdmin } from '@/lib/email/admin-guard'
import { listChapters } from '@/lib/content/readEbook'
import { listTemplates } from '@/lib/content/readTemplates'
import { listContentEdits } from './actions'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Conteúdo — Admin GTM BlackBox',
}

function EditedBadge() {
  return (
    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 font-sora text-3xs font-semibold uppercase tracking-wider text-amber-700">
      editado
    </span>
  )
}

export default async function ContentAdminPage() {
  await requireAdmin()

  const [chapters, templates, edits] = await Promise.all([
    listChapters(),
    listTemplates(),
    listContentEdits(),
  ])

  // Set de "type::slug" para lookup rápido
  const editedSet = new Set(edits.map((e) => `${e.content_type}::${e.slug}`))
  const isEdited = (type: string, slug: string) => editedSet.has(`${type}::${slug}`)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Admin · Editor
        </p>
        <h1 className="mt-1 font-sora text-xl font-semibold text-scient-dark">Conteúdo</h1>
        <p className="mt-1 font-sora text-sm text-scient-gray">
          Edite capítulos do ebook e seções de templates. As alterações ficam ativas imediatamente.
        </p>
      </div>

      {/* Ebook */}
      <section className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <FileText size={15} strokeWidth={1.5} className="text-scient-primary" />
          <h2 className="font-sora text-xs font-semibold uppercase tracking-widest text-scient-dark">
            Ebook — {chapters.length} capítulos
          </h2>
        </div>

        <div className="overflow-hidden border border-scient-divider bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-scient-divider bg-scient-bg">
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  #
                </th>
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  Título
                </th>
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  Status
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {chapters.map((ch) => (
                <tr key={ch.slug} className="border-b border-scient-divider last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-scient-gray">{ch.order}</td>
                  <td className="px-4 py-3 font-sora text-xs text-scient-dark">{ch.title}</td>
                  <td className="px-4 py-3">{isEdited('ebook', ch.slug) && <EditedBadge />}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/content/ebook/${ch.slug}`}
                      className="inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-primary hover:opacity-70"
                    >
                      <PenLine size={11} strokeWidth={1.5} />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Templates */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <LayoutTemplate size={15} strokeWidth={1.5} className="text-scient-primary" />
          <h2 className="font-sora text-xs font-semibold uppercase tracking-widest text-scient-dark">
            Templates — {templates.length} itens
          </h2>
        </div>

        <div className="overflow-hidden border border-scient-divider bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-scient-divider bg-scient-bg">
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  Nº
                </th>
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  Título
                </th>
                <th className="px-4 py-2.5 text-left font-sora text-3xs uppercase tracking-widest text-scient-gray">
                  Seções
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.slug} className="border-b border-scient-divider last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-scient-gray">{tpl.number}</td>
                  <td className="px-4 py-3 font-sora text-xs text-scient-dark">{tpl.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SectionLink
                        href={`/admin/content/template_description/${tpl.slug}`}
                        label="Descrição"
                        edited={isEdited('template_description', tpl.slug)}
                      />
                      <SectionLink
                        href={`/admin/content/template_body/${tpl.slug}`}
                        label="Template"
                        edited={isEdited('template_body', tpl.slug)}
                      />
                      <SectionLink
                        href={`/admin/content/template_rubrica/${tpl.slug}`}
                        label="Rubrica"
                        edited={isEdited('template_rubrica', tpl.slug)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Legenda */}
      {edits.length > 0 && (
        <p className="mt-6 font-sora text-xs text-scient-gray">
          {edits.length} override{edits.length > 1 ? 's' : ''} ativos —{' '}
          <span className="text-scient-dark">
            última edição por {edits[0]?.updated_by} em{' '}
            {new Date(edits[0]?.updated_at ?? '').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </p>
      )}
    </div>
  )
}

function SectionLink({ href, label, edited }: { href: string; label: string; edited: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 border border-scient-divider px-2.5 py-1 font-sora text-3xs uppercase tracking-widest text-scient-dark transition-colors hover:border-scient-primary hover:text-scient-primary"
    >
      <PenLine size={10} strokeWidth={1.5} />
      {label}
      {edited && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" title="Editado" />}
    </Link>
  )
}
