import type { Diagnostico, PerfilOnboarding, RoadmapItem } from './types'
import { PILARES, ESTAGIO_LABEL, NIVEL_LABELS, ESTAGIO_FATURAMENTO } from './types'

const PILAR_CONTEXTO: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Nomenclatura canônica, critérios objetivos M1-M8, originação de dados, centralização no CRM, enriquecimento e qualidade.',
  2: 'Framework de qualificação único (SPICED/MEDDPICC), ICP documentado, GTM Blueprint com 12 momentos cognitivos, ROI Framework de 6 fases.',
  3: 'Playbooks M1-M8 em 1 página, Handbooks 2-3p por motion × momento, TTFI declarado e mensurado, coaching estruturado.',
  4: 'CRM como source of truth, pipelines separados por (tipo × motion), dashboards canônicos (Pipeline Coverage, Velocity, Win Rate, GTM-5, Health).',
  5: 'Ritual MBR mensal, GTM-5 (CAC, LTV, GRR, Pipeline Creation Rate, ROI Rate), TOC para identificar gargalo, Planos de Ação canônicos com hipótese falseável.',
}

const NIVEL_DETALHE: Record<0 | 1 | 2 | 3, string> = {
  0: 'Nível 0 — Não iniciou: ausência total do pilar. Estrutura precisa ser construída do zero.',
  1: 'Nível 1 — Estrutura básica: documentação existe, mas não está operacionalizada. Time conhece os conceitos, nem sempre aplica.',
  2: 'Nível 2 — Implementado: processos rodando e consumidos pela operação. Ainda há inconsistências pontuais.',
  3: 'Nível 3 — Otimizado: auditoria, automação e melhoria contínua. Loop de feedback fechado.',
}

const READINESS_EXPL = {
  aiReady:
    'AI-Ready: P1 ≥ 2 (dados estruturados) + P3 ≥ 2 (processos documentados) + P2 ≥ 1 (metodologia mínima). Sem isso, agentes de IA amplificam ruído, não sinal.',
  arpeReady:
    'ARPE-Ready: todos os pilares ≥ 1. Operação pode escalar de ARMV para o estágio de máquina de GTM previsível.',
  areReady:
    'ARE-Ready: todos os pilares ≥ 2. Operação está apta para excelência operacional e expansão multi-motion.',
}

function pilarNome(n: 1 | 2 | 3 | 4 | 5) {
  return PILARES.find((p) => p.numero === n)!.nome
}

export function buildRoadmapTxt(
  perfil: PerfilOnboarding,
  diag: Diagnostico,
  roadmap: RoadmapItem[],
): string {
  const lines: string[] = []
  const data = new Date().toLocaleDateString('pt-BR')
  const gargaloNome = pilarNome(diag.gargaloPilar)

  lines.push('═══════════════════════════════════════════════════════')
  lines.push('GTM BLACKBOX · ROADMAP DE TRANSFORMAÇÃO')
  lines.push('Por SCIENT — Scientific AI-Native Go-to-Market')
  lines.push(`Gerado em: ${data}`)
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`EMPRESA:       ${perfil.empresa}`)
  lines.push(`RESPONSÁVEL:   ${perfil.nome}${perfil.cargo ? ` · ${perfil.cargo}` : ''}`)
  lines.push(`SETOR:         ${perfil.setor ?? 'Não declarado'}`)
  lines.push(`RECEITA ATUAL: ${ESTAGIO_FATURAMENTO[diag.estagio]}`)
  lines.push(`ESTÁGIO GTM:   ${ESTAGIO_LABEL[diag.estagio]}`)
  lines.push('')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('DIAGNÓSTICO POR PILAR — Metodologia GTM Engineering (0-3)')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('')
  for (const p of PILARES) {
    const n = diag.niveis[p.numero]
    const flag = p.numero === diag.gargaloPilar ? ' ← GARGALO (TOC)' : ''
    lines.push(`P${p.numero} · ${p.nome}`)
    lines.push(`     Nível ${n}/3 — ${NIVEL_LABELS[n]}${flag}`)
    lines.push(`     Escopo: ${p.descricao}`)
    if (p.numero === 1 && diag.subcamadasP1) {
      const sub = diag.subcamadasP1
      lines.push(`     Sub-camadas:`)
      lines.push(`       Nomenclatura: ${NIVEL_LABELS[sub.nomenclatura]} (${sub.nomenclatura}/3)`)
      lines.push(`       Critérios M1-M8: ${NIVEL_LABELS[sub.criterios]} (${sub.criterios}/3)`)
      lines.push(`       Originação: ${NIVEL_LABELS[sub.originacao]} (${sub.originacao}/3)`)
      lines.push(
        `       Centralização: ${NIVEL_LABELS[sub.centralizacao]} (${sub.centralizacao}/3)`,
      )
      lines.push(
        `       Enriquecimento: ${NIVEL_LABELS[sub.enriquecimento]} (${sub.enriquecimento}/3)`,
      )
    }
    lines.push('')
  }

  lines.push(
    `MATURIDADE GERAL: ${diag.percentualMaturidade.toFixed(1)}% (${diag.scoreTotal.toFixed(1)} pts)`,
  )
  lines.push('')
  lines.push('Leitura de readiness:')
  lines.push(
    `  AI-Ready:   ${diag.aiReady ? '✓ sim' : '✗ ainda não'} — ${READINESS_EXPL.aiReady.split(':')[1].split('.')[0].trim()}`,
  )
  lines.push(`  ARPE-Ready: ${diag.arpeReady ? '✓ sim' : '✗ ainda não'} — todos os pilares ≥ 1`)
  lines.push(`  ARE-Ready:  ${diag.areReady ? '✓ sim' : '✗ ainda não'} — todos os pilares ≥ 2`)
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push(`GARGALO IDENTIFICADO VIA TOC: P${diag.gargaloPilar} · ${gargaloNome}`)
  lines.push('───────────────────────────────────────────────────────')
  lines.push('')
  lines.push(
    `Theory of Constraints (Goldratt): o sistema cresce na velocidade do seu elo mais fraco.`,
  )
  lines.push(
    `Para ${perfil.empresa}, o pilar limitante é ${gargaloNome} (Nível ${diag.niveis[diag.gargaloPilar]}/3).`,
  )
  lines.push(`Atacar outros pilares antes de resolver este gargalo desperdiça capacidade.`)
  lines.push(`Escopo do pilar gargalo: ${PILAR_CONTEXTO[diag.gargaloPilar]}`)
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push('ROADMAP PRIORIZADO — 4 SPRINTS DE 90 DIAS')
  lines.push('(Sprints 1-3 atacam o gargalo. Sprint 4 trabalha pilares secundários.)')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('')

  const bySprint = new Map<number, RoadmapItem[]>()
  for (const item of roadmap) {
    const arr = bySprint.get(item.sprintSugerido) ?? []
    arr.push(item)
    bySprint.set(item.sprintSugerido, arr)
  }

  for (const sprint of [1, 2, 3, 4]) {
    const list = bySprint.get(sprint) ?? []
    if (list.length === 0) continue
    lines.push(
      `┌─ Sprint ${sprint}${sprint <= 3 ? ' [GARGALO]' : ' [PILARES SECUNDÁRIOS]'} ─ Semanas ${(sprint - 1) * 3 + 1}-${sprint * 3}`,
    )
    for (const item of list) {
      lines.push(`│  ▸ P${item.pilar} · ${item.acao}`)
      lines.push(`│    ${item.descricao}`)
      lines.push(`│    Esforço: ${item.esforco}`)
      if (item.gateOutput) {
        lines.push(`│    Definition of Done: ${item.gateOutput}`)
      }
    }
    lines.push('└' + '─'.repeat(54))
    lines.push('')
  }

  lines.push('───────────────────────────────────────────────────────')
  lines.push('COMO IMPLEMENTAR — CADÊNCIA MBR')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('')
  lines.push('A execução acontece no ritual MBR mensal (Monthly Business Review):')
  lines.push('  Bloco 1 · Big Numbers (15 min): CAC, LTV, GRR, Pipeline Creation, ROI Rate.')
  lines.push('  Bloco 2 · GTM-5 (15 min): as 5 métricas canônicas com trend e benchmark.')
  lines.push('  Bloco 3 · Funil M1-M8 (20 min): conversões, velocidade, mix por motion.')
  lines.push('  Bloco 4 · TOC (20 min): confirmar gargalo do mês, aplicar 5 Focusing Steps.')
  lines.push('  Bloco 5 · Pensamento Lógico (15 min): causa-raiz, conflito central, solução.')
  lines.push('  Bloco 6 · Plano de Ação (15 min): revisar planos em andamento + criar novos.')
  lines.push('')
  lines.push('Cada Plano de Ação deve ter: Hipótese (se X → então Y) · Owner único · Prazo')
  lines.push(
    'específico · Métrica de validação com baseline + alvo + source · Trade-off explícito.',
  )
  lines.push('')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('PRÓXIMOS PASSOS')
  lines.push('───────────────────────────────────────────────────────')
  lines.push('')
  lines.push('1. Sessão de 60 min com a liderança para alinhar o gargalo e validar Sprint 1.')
  lines.push(
    `2. Nomear owner para cada ação do Sprint 1 (foco em P${diag.gargaloPilar} · ${gargaloNome}).`,
  )
  lines.push('3. Agendar MBR mensal recorrente com pauta canônica de 90 min.')
  lines.push('4. Rever resultado em 90 dias — novo diagnóstico para medir avanço.')
  lines.push('5. Certificação GTM Engineer para acelerar o time: http://gtme.scient.cc')
  lines.push('')
  lines.push('═══════════════════════════════════════════════════════')

  return lines.join('\n')
}

export function buildClaudePrompt(
  perfil: PerfilOnboarding,
  diag: Diagnostico,
  roadmap: RoadmapItem[],
): string {
  const gargaloInfo = PILARES.find((p) => p.numero === diag.gargaloPilar)!
  const data = new Date().toLocaleDateString('pt-BR')

  const pilaresTxt = PILARES.map((p) => {
    const n = diag.niveis[p.numero]
    const gargalo = p.numero === diag.gargaloPilar ? ' ← GARGALO (TOC)' : ''
    return `  P${p.numero} · ${p.nome}: Nível ${n}/3 — ${NIVEL_LABELS[n]}${gargalo}\n       ${NIVEL_DETALHE[n]}`
  }).join('\n')

  const sprintsTxt = [1, 2, 3, 4]
    .map((sprint) => {
      const itens = roadmap.filter((r) => r.sprintSugerido === sprint)
      if (itens.length === 0) return null
      const header = `Sprint ${sprint}${sprint <= 3 ? ' (gargalo P' + diag.gargaloPilar + ')' : ' (pilares secundários)'}`
      const body = itens
        .map(
          (i) =>
            `    • ${i.acao}\n      Por quê: ${i.descricao}\n      Definition of Done: ${i.gateOutput ?? 'ver capítulo correspondente'}\n      Esforço: ${i.esforco} | Template: ${i.templateSlug ?? '—'} | Capítulo Ebook: ${i.chapterSlug ?? '—'}`,
        )
        .join('\n')
      return `  ${header}:\n${body}`
    })
    .filter(Boolean)
    .join('\n\n')

  const sub = diag.subcamadasP1
  const subTxt = sub
    ? `\n  Sub-camadas P1 (Arquitetura de Dados):\n    Nomenclatura CRM:  ${NIVEL_LABELS[sub.nomenclatura]}\n    Critérios M1-M8:   ${NIVEL_LABELS[sub.criterios]}\n    Originação:        ${NIVEL_LABELS[sub.originacao]}\n    Centralização:     ${NIVEL_LABELS[sub.centralizacao]}\n    Enriquecimento:    ${NIVEL_LABELS[sub.enriquecimento]}`
    : ''

  return `PROMPT PARA CLAUDE — Plano de Transformação GTM (HTML Visual)
==============================================================

# CONTEXTO DA EMPRESA

Empresa: ${perfil.empresa}${perfil.setor ? ` · Setor: ${perfil.setor}` : ''}
Responsável: ${perfil.nome}${perfil.cargo ? ` · ${perfil.cargo}` : ''}
Receita atual: ${ESTAGIO_FATURAMENTO[diag.estagio]}
Estágio GTM: ${ESTAGIO_LABEL[diag.estagio]}

# FRAMEWORK: GTM ENGINEERING (SCIENT)

A metodologia GTM Engineering organiza a operação de receita em 5 pilares interdependentes,
avaliados numa escala 0-3 (Não iniciou → Estrutura básica → Implementado → Otimizado).
A Theory of Constraints (Goldratt) é aplicada para identificar o GARGALO — o pilar com menor
nível, que limita o crescimento de toda a operação. A ordem de intervenção segue o gargalo.

O pipeline é mapeado em 8 estágios (M1-M8): Account (LCA) → Engagement (MQA) → Lead (MQL) →
Discovery (SQL) → Proposal (SAL) → Negotiation (SQO) → Won → Onboarding/Retained.
Cada transição tem critérios objetivos de saída definidos no Pilar 1 (Critérios M1-M8).

# DIAGNÓSTICO DE MATURIDADE — ${data}

Maturidade geral: ${diag.percentualMaturidade.toFixed(1)}% (${diag.scoreTotal.toFixed(1)} pontos)

${pilaresTxt}
${subTxt}

## Readiness Flags
  AI-Ready:   ${diag.aiReady ? '✓ SIM' : '✗ NÃO'} — ${READINESS_EXPL.aiReady}
  ARPE-Ready: ${diag.arpeReady ? '✓ SIM' : '✗ NÃO'} — ${READINESS_EXPL.arpeReady}
  ARE-Ready:  ${diag.areReady ? '✓ SIM' : '✗ NÃO'} — ${READINESS_EXPL.areReady}

# GARGALO IDENTIFICADO

Pilar gargalo: P${diag.gargaloPilar} · ${gargaloInfo.nome} (Nível ${diag.niveis[diag.gargaloPilar]}/3)
Escopo do pilar: ${PILAR_CONTEXTO[diag.gargaloPilar]}

Por que este pilar limita o crescimento: o TOC (Theory of Constraints) mostra que escalar
processos de vendas ou CS sem resolver este pilar primeiro gera retorno decrescente.
Atacar o gargalo com esforço concentrado em Sprint 1-3 libera capacidade para o Sprint 4.

# ROADMAP PRIORIZADO — 90 DIAS (4 SPRINTS DE ~3 SEMANAS)

${sprintsTxt}

## Cadência de implementação (MBR mensal)
  A execução do roadmap é gerenciada no ritual MBR (Monthly Business Review) — 90 minutos mensais.
  Pauta canônica: Big Numbers · GTM-5 · Funil M1-M8 · TOC · Pensamento Lógico · Plano de Ação.
  Cada plano: Hipótese (se X → então Y) · Owner único · Prazo específico · Métrica com baseline.

# INSTRUÇÃO PARA GERAR O ARTEFATO HTML

Gere um artefato HTML único, auto-contido (inline CSS), no formato "Plano de Transformação GTM — 90 Dias".

## Identidade visual (usuário deve preencher):
  Cor primária: [PREENCHER — ex: #003366]
  Cor de destaque: [PREENCHER — ex: #FF6B35]
  Fonte: [PREENCHER — ex: Inter, Lato, Sora]
  Logo URL: [PREENCHER — ou remover o elemento]

## Estrutura do documento (seguir esta ordem):

1. CAPA
   - Nome da empresa: ${perfil.empresa}
   - Subtítulo: "Plano de Transformação GTM · ${diag.estagio} → próximo estágio"
   - Data: ${data}
   - Maturidade: ${diag.percentualMaturidade.toFixed(1)}%
   - Tagline: "Diagnóstico via GTM BlackBox · SCIENT"

2. SEÇÃO "ONDE ESTAMOS HOJE"
   - Radar chart SVG com os 5 pilares (escala 0-3, polígono preenchido)
   - Destaque visual no pilar gargalo (cor diferente ou borda pulsante)
   - Tabela com os 5 pilares, nível atual, nível alvo e breve descrição
   - Badges: AI-Ready (${diag.aiReady ? 'sim' : 'não'}) · ARPE-Ready (${diag.arpeReady ? 'sim' : 'não'}) · ARE-Ready (${diag.areReady ? 'sim' : 'não'})

3. SEÇÃO "GARGALO: ${gargaloInfo.nome.toUpperCase()}"
   - Explicar em 3-4 frases por que P${diag.gargaloPilar} está limitando o crescimento de ${perfil.empresa}
   - O que acontece se não for resolvido: outros investimentos retornam menos
   - O que muda quando resolvido: qual capacidade é desbloqueada para o próximo pilar

4. SEÇÃO "ROADMAP 90 DIAS"
   - 4 colunas (Sprint 1, 2, 3, 4) ou linha do tempo visual
   - Sprints 1-3 marcados como "[Gargalo P${diag.gargaloPilar}]", Sprint 4 como "[Pilares Secundários]"
   - Para cada ação: título, descrição curta (1 frase), esforço (baixo/médio/alto), Definition of Done

5. SEÇÃO "COMO EXECUTAR: O RITUAL MBR"
   - 6 blocos da pauta canônica em cards visuais
   - Explicação de como o Plano de Ação canônico funciona (Hipótese → Owner → Prazo → Métrica)
   - Benchmarks de taxa de entrega: <30% = teatro, 30-60% = formação, 60-80% = saudável, >80% = top quartile

6. SEÇÃO "MÉTRICAS DE AVANÇO (GTM-5)"
   - CAC · LTV · GRR · Pipeline Creation Rate · ROI Rate
   - Coluna: métrica | baseline atual (a preencher) | alvo em 90 dias (a preencher) | fonte

7. FOOTER
   - "Próximo passo: Certificação GTM Engineer → http://gtme.scient.cc"
   - "Diagnóstico gerado via GTM BlackBox by SCIENT em ${data}"

## Requisitos técnicos:
  - HTML + inline CSS. Nenhuma dependência externa além de Google Fonts.
  - Radar chart em SVG puro (não usar Chart.js).
  - Responsivo (funciona em desktop e A4 para impressão).
  - Paleta baseada na identidade visual declarada acima.
  - Sem lorem ipsum. Todo texto deve ser conteúdo real baseado nos dados acima.
`
}
