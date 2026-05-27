import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen, Clock, Download } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { mdxComponents } from '@/components/ebook/MdxComponents'

const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } }
import { getTemplateBySlug, getTemplateNeighbors, listTemplates } from '@/lib/content/readTemplates'
import { PILARES } from '@/lib/diagnostico/types'

export async function generateStaticParams() {
  const templates = await listTemplates()
  return templates.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await getTemplateBySlug(params.slug)
  if (!t) return { title: 'Template não encontrado · GTM BlackBox' }
  return {
    title: `${t.title} · GTM BlackBox`,
    description: t.outputEsperado,
  }
}

export default async function TemplateDetail({ params }: { params: { slug: string } }) {
  const [t, { prev, next }] = await Promise.all([
    getTemplateBySlug(params.slug),
    getTemplateNeighbors(params.slug),
  ])
  if (!t) notFound()

  const pilar = PILARES.find((p) => p.numero === t.pilar)

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-gray hover:text-scient-dark"
      >
        <ArrowLeft size={11} strokeWidth={1.5} /> Catálogo
      </Link>

      <header className="mt-6">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          {t.number} · {pilar ? `Pilar ${t.pilar} · ${pilar.nome}` : `Pilar ${t.pilar}`}
        </p>
        <h1 className="mt-3 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
          {t.title.replace(/^Template\s+T\d+\s*—\s*/, '')}
        </h1>
        <p className="mt-4 flex flex-wrap gap-3 font-sora text-3xs uppercase tracking-widest text-scient-gray">
          <span className="flex items-center gap-2">
            <Clock size={10} strokeWidth={1.5} />
            {t.duracaoImplementacao}
          </span>
          <span>Estágio mínimo: {t.estagioMinimo}</span>
        </p>
      </header>

      <section className="mt-10">
        <div className="border border-scient-divider bg-white p-6">
          <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
            Output esperado
          </p>
          <p className="mt-2 font-sora text-sm leading-relaxed text-scient-dark">
            {t.outputEsperado}
          </p>
          {t.preRequisitos.length > 0 ? (
            <p className="mt-4 font-sora text-2xs text-scient-gray">
              <strong className="text-scient-dark">Pré-requisitos:</strong>{' '}
              {t.preRequisitos.join(' · ')}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-12">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Visão geral
        </p>
        <div className="mt-3">
          <MDXRemote source={t.readme} components={mdxComponents} options={mdxOptions} />
        </div>
      </section>

      <section className="mt-12">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Template — estrutura preenchível
        </p>
        <div className="mt-3">
          <MDXRemote source={t.template} components={mdxComponents} options={mdxOptions} />
        </div>
      </section>

      <section className="mt-12">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Rubrica de implementação (0-3)
        </p>
        <div className="mt-3">
          <MDXRemote source={t.rubrica} components={mdxComponents} options={mdxOptions} />
        </div>
      </section>

      <footer className="mt-16 border-t border-scient-divider pt-10">
        <div className="grid gap-3 md:grid-cols-2">
          {prev ? (
            <Link
              href={`/templates/${prev.slug}`}
              className="group block border border-scient-divider bg-white p-5 transition-colors hover:border-scient-primary"
            >
              <p className="flex items-center gap-2 font-lexend text-3xs uppercase tracking-widest text-scient-gray">
                <ArrowLeft size={10} strokeWidth={1.5} /> Anterior
              </p>
              <p className="mt-2 font-sora text-sm text-scient-dark group-hover:text-scient-primary">
                {prev.number} · {prev.title.replace(/^Template\s+T\d+\s*—\s*/, '')}
              </p>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/templates/${next.slug}`}
              className="group block border border-scient-divider bg-white p-5 text-right transition-colors hover:border-scient-primary"
            >
              <p className="flex items-center justify-end gap-2 font-lexend text-3xs uppercase tracking-widest text-scient-gray">
                Próximo <ArrowRight size={10} strokeWidth={1.5} />
              </p>
              <p className="mt-2 font-sora text-sm text-scient-dark group-hover:text-scient-primary">
                {next.number} · {next.title.replace(/^Template\s+T\d+\s*—\s*/, '')}
              </p>
            </Link>
          ) : null}
        </div>
      </footer>

      <footer className="mt-10 border-t border-scient-divider pt-10">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-gray">
          Quer baixar este template?
        </p>
        <p className="mt-2 font-sora text-xs text-scient-gray">
          Copie o conteúdo desta página, ou clone o repositório em{' '}
          <a
            href="https://github.com/giovanni697/gtm-blackbox"
            target="_blank"
            rel="noopener noreferrer"
            className="text-scient-primary underline"
          >
            github.com/giovanni697/gtm-blackbox
          </a>{' '}
          — os templates ficam em{' '}
          <code className="border border-scient-divider bg-scient-bg px-1 py-0.5 text-2xs">
            content/templates/{t.slug}/
          </code>
          .
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {pilar?.chapterSlug ? (
            <Link
              href={`/ebook/${pilar.chapterSlug}`}
              className="inline-flex items-center gap-2 border border-scient-divider px-4 py-2 font-sora text-2xs uppercase tracking-widest hover:border-scient-primary"
            >
              <BookOpen size={12} strokeWidth={1.5} />
              Ler capítulo do ebook
            </Link>
          ) : null}
          <Link
            href="/diagnostico"
            className="inline-flex items-center gap-2 bg-scient-primary px-4 py-2 font-sora text-2xs uppercase tracking-widest text-white hover:bg-scient-primary-hover"
          >
            <Download size={12} strokeWidth={1.5} />
            Diagnóstico mostra onde aplicar
          </Link>
        </div>
      </footer>
    </article>
  )
}
