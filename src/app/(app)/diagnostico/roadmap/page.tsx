import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RoadmapCard } from '@/components/diagnostico/RoadmapCard'
import type { RoadmapItem } from '@/lib/diagnostico/types'

export default async function RoadmapPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('id, gargalo_pilar')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!diag) redirect('/diagnostico')

  const { data: itens } = await supabase
    .from('roadmap_itens')
    .select('*')
    .eq('diagnostico_id', diag.id)
    .order('prioridade', { ascending: true })

  const sprints = new Map<number, RoadmapItem[]>()
  for (const it of itens ?? []) {
    const item: RoadmapItem = {
      id: it.id,
      pilar: it.pilar as 1 | 2 | 3 | 4 | 5,
      acao: it.acao,
      descricao: it.descricao ?? '',
      esforco: (it.esforco ?? 'medio') as 'baixo' | 'medio' | 'alto',
      prioridade: it.prioridade ?? 0,
      isGargalo: it.is_gargalo ?? false,
      sprintSugerido: (it.sprint_sugerido ?? 1) as 1 | 2 | 3 | 4,
      templateSlug: it.template_slug ?? undefined,
      chapterSlug: it.chapter_slug ?? undefined,
    }
    const arr = sprints.get(item.sprintSugerido) ?? []
    arr.push(item)
    sprints.set(item.sprintSugerido, arr)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <Link
        href="/diagnostico/resultado"
        className="inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-gray hover:text-scient-dark"
      >
        <ArrowLeft size={11} strokeWidth={1.5} /> Voltar para resultado
      </Link>
      <p className="mt-6 font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Diagnóstico · Roadmap priorizado por TOC
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Próximos 90 dias
      </h1>
      <p className="mt-3 max-w-2xl font-sora text-sm text-scient-gray">
        Sprints de 2-3 semanas. Os 3 primeiros atacam o gargalo (Pilar {diag.gargalo_pilar}). O
        Sprint 4 ataca os próximos pilares mais fracos. Cada card linka para o capítulo do ebook e
        para o template aplicável.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        {[1, 2, 3, 4].map((sprint) => {
          const list = sprints.get(sprint) ?? []
          if (list.length === 0) return null
          return (
            <section key={sprint}>
              <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
                Sprint {sprint}
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {list.map((item) => (
                  <RoadmapCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-12">
        <Link
          href="/diagnostico/exportar"
          className="inline-flex items-center gap-2 bg-scient-primary px-5 py-3 font-sora text-xs text-white hover:bg-scient-primary-hover"
        >
          <Download size={14} strokeWidth={1.5} /> Exportar TXT + Prompt Claude
        </Link>
      </div>
    </div>
  )
}
