import Link from 'next/link'
import { ArrowRight, Clock, Layers } from 'lucide-react'
import { listTemplates } from '@/lib/content/readTemplates'
import { PILARES } from '@/lib/diagnostico/types'

export const dynamic = 'force-static'

export default async function TemplatesIndex() {
  const templates = await listTemplates()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Módulo 03 · Implementação
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Templates & Rubricas
      </h1>
      <p className="mt-4 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        8 templates implementáveis. Cada um traz a estrutura preenchível + rubrica de implementação
        0-3 + critérios de gates de saída. Edite via PR no Markdown.
      </p>

      <div className="mt-10 grid gap-px bg-scient-divider md:grid-cols-2">
        {templates.map((t) => {
          const pilar = PILARES.find((p) => p.numero === t.pilar)
          return (
            <Link
              key={t.slug}
              href={`/templates/${t.slug}`}
              className="group flex flex-col gap-3 bg-white p-6 transition-colors hover:bg-scient-bg"
            >
              <div className="flex items-start justify-between">
                <p className="font-lexend text-3xs tracking-widest text-scient-primary">
                  {t.number}
                </p>
                <Layers
                  size={14}
                  strokeWidth={1.5}
                  className="text-scient-gray group-hover:text-scient-primary"
                />
              </div>
              <h2 className="font-sora text-base font-medium text-scient-dark md:text-lg">
                {t.title.replace(/^Template\s+T\d+\s*—\s*/, '')}
              </h2>
              <p className="font-sora text-2xs uppercase tracking-widest text-scient-gray">
                Pilar {t.pilar}
                {pilar ? ` · ${pilar.nome}` : ''}
              </p>
              <p className="flex items-center gap-2 font-sora text-3xs uppercase tracking-widest text-scient-gray">
                <Clock size={10} strokeWidth={1.5} />
                {t.duracaoImplementacao}
              </p>
              <p className="mt-1 font-sora text-3xs leading-relaxed text-scient-gray">
                Estágio mínimo: <span className="text-scient-dark">{t.estagioMinimo}</span>
              </p>
              <span className="mt-2 inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-primary">
                Ver template <ArrowRight size={11} strokeWidth={1.5} />
              </span>
            </Link>
          )
        })}
      </div>

      {templates.length === 0 ? (
        <p className="mt-12 font-sora text-xs italic text-scient-gray">
          Nenhum template publicado ainda.
        </p>
      ) : null}
    </div>
  )
}
