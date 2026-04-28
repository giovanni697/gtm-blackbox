import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { listChapters } from '@/lib/content/readEbook'

export default async function EbookIndex() {
  const chapters = await listChapters()

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Módulo 01 · Conhecimento
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        A Metodologia da Engenharia de GTM.
      </h1>
      <p className="mt-5 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        Doze capítulos a partir dos princípios do Edson Rigonatti. Produtividade Humana como norte;
        IA como multiplicador, não substituto. Leitura recomendada antes do Diagnóstico — a moldura
        conceitual define como interpretar seus resultados.
      </p>

      {chapters.length === 0 ? (
        <p className="mt-12 font-sora text-xs italic text-scient-gray">
          Nenhum capítulo publicado ainda. Volte em breve.
        </p>
      ) : (
        <ol className="mt-12 flex flex-col gap-px bg-scient-divider">
          {chapters.map((chapter) => (
            <li key={chapter.slug} className="bg-white">
              <Link
                href={`/ebook/${chapter.slug}`}
                className="group flex items-center gap-6 px-2 py-5 transition-colors hover:bg-scient-bg"
              >
                <span className="w-8 shrink-0 font-lexend text-2xs tracking-widest text-scient-gray">
                  {String(chapter.order).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-sora text-base font-medium text-scient-dark">
                    {chapter.title}
                  </h2>
                  <p className="mt-1 flex items-center gap-3 font-sora text-3xs uppercase tracking-widest text-scient-gray">
                    <Clock size={10} strokeWidth={1.5} />
                    {chapter.estimatedReadingMinutes} min · atualizado {chapter.lastUpdated}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="shrink-0 text-scient-gray transition-colors group-hover:text-scient-primary"
                />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
