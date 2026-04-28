import Link from 'next/link'
import { Flag, BookOpen, Layers } from 'lucide-react'
import clsx from 'clsx'
import type { RoadmapItem } from '@/lib/diagnostico/types'
import { PILARES } from '@/lib/diagnostico/types'

const ESFORCO_LABEL = {
  baixo: 'Esforço baixo',
  medio: 'Esforço médio',
  alto: 'Esforço alto',
}

export function RoadmapCard({ item }: { item: RoadmapItem }) {
  const pilar = PILARES.find((p) => p.numero === item.pilar)!
  return (
    <article
      className={clsx(
        'border border-scient-divider bg-white p-6 transition-colors',
        item.isGargalo && 'border-scient-armv/40',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-lexend text-3xs uppercase tracking-widest text-scient-gray">
            Sprint {item.sprintSugerido} · P{item.pilar} {pilar.nome}
            {item.isGargalo ? (
              <span className="flex items-center gap-1 text-scient-armv">
                <Flag size={10} strokeWidth={1.5} /> GARGALO
              </span>
            ) : null}
          </p>
          <h3 className="mt-2 font-sora text-base font-medium text-scient-dark md:text-lg">
            {item.acao}
          </h3>
        </div>
        <span className="shrink-0 font-sora text-3xs uppercase tracking-widest text-scient-gray">
          {ESFORCO_LABEL[item.esforco]}
        </span>
      </div>

      <p className="mt-3 font-sora text-xs leading-relaxed text-scient-gray md:text-sm">
        {item.descricao}
      </p>

      {item.gateOutput ? (
        <p className="mt-4 border-l-2 border-scient-divider pl-3 font-sora text-3xs italic text-scient-dark">
          Output esperado: {item.gateOutput}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {item.chapterSlug ? (
          <Link
            href={`/ebook/${item.chapterSlug}`}
            className="inline-flex items-center gap-1.5 px-2 py-1 font-sora text-3xs uppercase tracking-widest text-scient-primary hover:bg-scient-primary-soft"
          >
            <BookOpen size={11} strokeWidth={1.5} /> Capítulo do ebook
          </Link>
        ) : null}
        {item.templateSlug ? (
          <Link
            href={`/templates/${item.templateSlug}`}
            className="inline-flex items-center gap-1.5 px-2 py-1 font-sora text-3xs uppercase tracking-widest text-scient-primary hover:bg-scient-primary-soft"
          >
            <Layers size={11} strokeWidth={1.5} /> Template aplicável
          </Link>
        ) : null}
      </div>
    </article>
  )
}
