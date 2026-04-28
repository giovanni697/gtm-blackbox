import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildClaudePrompt, buildRoadmapTxt } from '@/lib/diagnostico/prompt-builder'
import { ExportClient } from './ExportClient'
import type {
  Diagnostico,
  NivelMaturidade,
  PerfilOnboarding,
  RoadmapItem,
} from '@/lib/diagnostico/types'

export default async function ExportarPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, empresa, cargo, setor, faturamento_atual, estagio')
    .eq('id', user!.id)
    .single()
  const { data: diag } = await supabase
    .from('diagnosticos')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!diag || !profile?.faturamento_atual || !profile.estagio) {
    redirect('/diagnostico')
  }

  const { data: itens } = await supabase
    .from('roadmap_itens')
    .select('*')
    .eq('diagnostico_id', diag.id)
    .order('prioridade', { ascending: true })

  const perfil: PerfilOnboarding = {
    nome: profile.nome ?? user!.email!,
    empresa: profile.empresa ?? '',
    cargo: profile.cargo ?? undefined,
    setor: profile.setor ?? undefined,
    faturamentoAtual: profile.faturamento_atual,
    estagio: profile.estagio,
  }

  const diagDom: Diagnostico = {
    id: diag.id,
    userId: user!.id,
    estagio: diag.estagio,
    niveis: {
      1: diag.p1_nivel as NivelMaturidade,
      2: diag.p2_nivel as NivelMaturidade,
      3: diag.p3_nivel as NivelMaturidade,
      4: diag.p4_nivel as NivelMaturidade,
      5: diag.p5_nivel as NivelMaturidade,
    },
    subcamadasP1: {
      nomenclatura: (diag.p1_nomenclatura ?? 0) as NivelMaturidade,
      criterios: (diag.p1_criterios ?? 0) as NivelMaturidade,
      originacao: (diag.p1_originacao ?? 0) as NivelMaturidade,
      centralizacao: (diag.p1_centralizacao ?? 0) as NivelMaturidade,
      enriquecimento: (diag.p1_enriquecimento ?? 0) as NivelMaturidade,
    },
    scoreTotal: diag.score_total ?? 0,
    percentualMaturidade: diag.percentual_maturidade ?? 0,
    gargaloPilar: diag.gargalo_pilar as 1 | 2 | 3 | 4 | 5,
    aiReady: diag.ai_ready ?? false,
    arpeReady: diag.arpe_ready ?? false,
    areReady: diag.are_ready ?? false,
  }

  const roadmap: RoadmapItem[] = (itens ?? []).map((it) => ({
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
  }))

  const txt = buildRoadmapTxt(perfil, diagDom, roadmap)
  const prompt = buildClaudePrompt(perfil, diagDom, roadmap)

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10 md:py-16">
      <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
        Diagnóstico · Exportar
      </p>
      <h1 className="mt-2 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
        Dois outputs prontos
      </h1>
      <p className="mt-3 max-w-2xl font-sora text-sm leading-relaxed text-scient-gray">
        <strong>TXT</strong>: roadmap formatado pra você compartilhar com a liderança em um e-mail
        ou doc.
        <br />
        <strong>Prompt Claude</strong>: cole no Claude (ou outra IA com geração de HTML) e ele cria
        um artefato visual com a identidade da sua empresa.
      </p>

      <ExportClient txt={txt} prompt={prompt} empresa={perfil.empresa} />
    </div>
  )
}
