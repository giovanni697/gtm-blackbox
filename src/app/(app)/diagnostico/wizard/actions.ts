'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { listPerguntas } from '@/lib/content/readPerguntas'
import { montarDiagnostico } from '@/lib/diagnostico/scoring'
import { gerarRoadmap } from '@/lib/diagnostico/roadmap-engine'
import type { Estagio, Resposta } from '@/lib/diagnostico/types'

const RespostaSchema = z.enum(['sim', 'nao', 'parcial'])
const RespostasMapSchema = z.record(z.string(), RespostaSchema)

export type WizardState = { error?: string }

export async function saveWizardSession(formData: FormData): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const respostas: Record<string, Resposta> = {}
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === 'string' && (value === 'sim' || value === 'nao' || value === 'parcial')) {
      respostas[key] = value
    }
  })

  await supabase
    .from('wizard_sessions')
    .upsert({ user_id: user.id, respostas, pilar_atual: null }, { onConflict: 'user_id' })
}

export async function submitDiagnostico(
  _prev: WizardState,
  formData: FormData,
): Promise<WizardState> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('estagio')
    .eq('id', user.id)
    .single()
  const estagio = (profile?.estagio ?? 'ARMV') as Estagio

  const respostasRaw: Record<string, unknown> = {}
  Array.from(formData.entries()).forEach(([key, value]) => {
    if (typeof value === 'string' && key !== '__action') {
      respostasRaw[key] = value
    }
  })

  const parsed = RespostasMapSchema.safeParse(respostasRaw)
  if (!parsed.success) return { error: 'Algumas respostas inválidas' }

  const perguntas = await listPerguntas()
  const diagDom = montarDiagnostico(user.id, estagio, perguntas, parsed.data)

  const { data: inserted, error: insertError } = await supabase
    .from('diagnosticos')
    .insert({
      user_id: user.id,
      estagio: diagDom.estagio,
      p1_nivel: diagDom.niveis[1],
      p2_nivel: diagDom.niveis[2],
      p3_nivel: diagDom.niveis[3],
      p4_nivel: diagDom.niveis[4],
      p5_nivel: diagDom.niveis[5],
      p1_nomenclatura: diagDom.subcamadasP1.nomenclatura,
      p1_criterios: diagDom.subcamadasP1.criterios,
      p1_originacao: diagDom.subcamadasP1.originacao,
      p1_centralizacao: diagDom.subcamadasP1.centralizacao,
      p1_enriquecimento: diagDom.subcamadasP1.enriquecimento,
      gargalo_pilar: diagDom.gargaloPilar,
      score_total: Math.round(diagDom.scoreTotal),
      percentual_maturidade: diagDom.percentualMaturidade,
      ai_ready: diagDom.aiReady,
      arpe_ready: diagDom.arpeReady,
      are_ready: diagDom.areReady,
    })
    .select('id')
    .single()

  if (insertError || !inserted)
    return { error: insertError?.message ?? 'Falha ao salvar diagnóstico' }

  // Salva respostas individuais
  const respostasInsert = Object.entries(parsed.data).map(([pid, resp]) => {
    const pergunta = perguntas.find((q) => q.id === pid)
    return {
      user_id: user.id,
      diagnostico_id: inserted.id,
      pilar: pergunta?.pilar ?? null,
      subcamada: pergunta?.subcamada ?? null,
      pergunta_id: pid,
      resposta: resp,
    }
  })
  if (respostasInsert.length > 0) {
    await supabase.from('checklist_respostas').insert(respostasInsert)
  }

  // Gera roadmap e salva
  const roadmap = gerarRoadmap({ niveis: diagDom.niveis, gargaloPilar: diagDom.gargaloPilar })
  if (roadmap.length > 0) {
    await supabase.from('roadmap_itens').insert(
      roadmap.map((r) => ({
        user_id: user.id,
        diagnostico_id: inserted.id,
        pilar: r.pilar,
        acao: r.acao,
        descricao: r.descricao,
        template_slug: r.templateSlug,
        chapter_slug: r.chapterSlug,
        esforco: r.esforco,
        prioridade: r.prioridade,
        is_gargalo: r.isGargalo,
        sprint_sugerido: r.sprintSugerido,
      })),
    )
  }

  await supabase.from('profiles').update({ diagnostico_concluido: true }).eq('id', user.id)
  await supabase.from('wizard_sessions').delete().eq('user_id', user.id)

  revalidatePath('/diagnostico')
  redirect('/diagnostico/resultado')
}
