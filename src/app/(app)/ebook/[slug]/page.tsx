import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { ProgressBar } from '@/components/ebook/ProgressBar'
import { mdxComponents } from '@/components/ebook/MdxComponents'
import { getChapterBySlug, getChapterNeighbors, listChapters } from '@/lib/content/readEbook'

export async function generateStaticParams() {
  const chapters = await listChapters()
  return chapters.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const chapter = await getChapterBySlug(params.slug)
  if (!chapter) return { title: 'Capítulo não encontrado · GTM BlackBox' }
  return {
    title: `${chapter.title} · GTM BlackBox`,
    description: `Capítulo ${chapter.order} do ebook GTM BlackBox · ${chapter.estimatedReadingMinutes} min`,
  }
}

export default async function ChapterPage({ params }: { params: { slug: string } }) {
  const chapter = await getChapterBySlug(params.slug)
  if (!chapter) notFound()

  const { prev, next } = await getChapterNeighbors(params.slug)

  return (
    <article className="mx-auto max-w-3xl px-6 pb-20 pt-10 md:px-10 md:pt-16">
      <ProgressBar />

      <header>
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-gray">
          Capítulo {String(chapter.order).padStart(2, '0')}
          {chapter.pillar ? ` · ${chapter.pillar}` : ''}
        </p>
        <h1 className="mt-3 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
          {chapter.title}
        </h1>
        <p className="mt-4 flex items-center gap-3 font-sora text-3xs uppercase tracking-widest text-scient-gray">
          <Clock size={10} strokeWidth={1.5} />
          {chapter.estimatedReadingMinutes} min · atualizado em {chapter.lastUpdated}
        </p>
      </header>

      <div className="mt-12">
        <MDXRemote
          source={chapter.content}
          components={mdxComponents}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </div>

      <footer className="mt-20 border-t border-scient-divider pt-10">
        <p className="font-sora text-3xs italic leading-relaxed text-scient-gray">
          Esta metodologia foi desenvolvida pela SCIENT a partir da experiência de campo em mais de
          50 operações B2B mid-market. Representa criação intelectual própria, fundamentada em
          referências públicas (ICONIQ Growth, Mark Roberge, Geoffrey Moore, Lincoln Murphy, Eli
          Goldratt) e na prática consultiva.
        </p>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {prev ? (
            <Link
              href={`/ebook/${prev.slug}`}
              className="group block border border-scient-divider bg-white p-5 transition-colors hover:border-scient-primary"
            >
              <p className="flex items-center gap-2 font-lexend text-3xs uppercase tracking-widest text-scient-gray">
                <ArrowLeft size={10} strokeWidth={1.5} /> Anterior
              </p>
              <p className="mt-2 font-sora text-sm text-scient-dark group-hover:text-scient-primary">
                {String(prev.order).padStart(2, '0')} · {prev.title}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/ebook/${next.slug}`}
              className="group block border border-scient-divider bg-white p-5 text-right transition-colors hover:border-scient-primary"
            >
              <p className="flex items-center justify-end gap-2 font-lexend text-3xs uppercase tracking-widest text-scient-gray">
                Próximo <ArrowRight size={10} strokeWidth={1.5} />
              </p>
              <p className="mt-2 font-sora text-sm text-scient-dark group-hover:text-scient-primary">
                {String(next.order).padStart(2, '0')} · {next.title}
              </p>
            </Link>
          ) : null}
        </div>
      </footer>
    </article>
  )
}
