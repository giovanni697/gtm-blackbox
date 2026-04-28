import type { Diagnostico, NivelMaturidade, RoadmapItem, EsforcoEstimado } from './types'
import { PILARES } from './types'

type AcaoSeed = {
  acao: string
  descricao: string
  esforco: EsforcoEstimado
  gateOutput: string
}

// Para cada pilar × nível, ações canônicas para subir 1 nível.
const ACOES: Record<1 | 2 | 3 | 4 | 5, Record<NivelMaturidade, AcaoSeed[]>> = {
  1: {
    0: [
      {
        acao: 'Documentar nomenclatura canônica do CRM',
        descricao:
          'Para cada entidade (Conta, Contato, Negócio), declare 5-10 campos canônicos com formato {entidade}_{atributo}__{contexto}.',
        esforco: 'baixo',
        gateOutput: '95%+ dos campos novos seguem naming canônico',
      },
      {
        acao: 'Fechar picklists em campos categóricos críticos',
        descricao:
          'Indústria, motivo de perda, origem do lead, motion. Sem campo livre como regra.',
        esforco: 'baixo',
        gateOutput: '<5% dos registros usando "outros"',
      },
    ],
    1: [
      {
        acao: 'Implementar critérios objetivos M1-M8',
        descricao:
          'Cada estágio do funil tem checklist de saída. Sair de SQL exige 5 campos preenchidos. Sair de SAL exige 8.',
        esforco: 'medio',
        gateOutput: 'Auditoria mensal: <5% avanços sem checklist completa',
      },
      {
        acao: 'Declarar owner por campo crítico',
        descricao: 'Cada campo do CRM tem dono — pessoa responsável pela qualidade do dado.',
        esforco: 'baixo',
        gateOutput: '100% dos campos críticos com owner declarado',
      },
    ],
    2: [
      {
        acao: 'Implementar Semantic Layer',
        descricao:
          'ARR, MRR, NRR, CAC, LTV, Pipeline Coverage com uma definição única, consumida por todos os relatórios.',
        esforco: 'alto',
        gateOutput: '10+ métricas canônicas em uso, zero discrepâncias entre dashboards',
      },
      {
        acao: 'Auditoria automatizada de qualidade do dado',
        descricao:
          'Agentes detectam campos inconsistentes, duplicatas, drift. Alertam antes de virar problema.',
        esforco: 'alto',
        gateOutput: 'Latência de detecção <24h, taxa de remediação >90%',
      },
    ],
    3: [],
  },
  2: {
    0: [
      {
        acao: 'Escolher e treinar um framework de qualificação',
        descricao:
          'SPICED, MEDDPICC, Challenger, BANT, SPIN ou GPCT. Importa menos qual; importa que seja UM e que todo o time aplique.',
        esforco: 'medio',
        gateOutput: '100% do time treinado, framework declarado em onepager',
      },
      {
        acao: 'Documentar ICP em uma página',
        descricao:
          'Firmografia + Technografia + Success Fit (5 dimensões de Lincoln Murphy). Anti-ICP explícito.',
        esforco: 'baixo',
        gateOutput: 'ICP onepager pública, 5 dimensões cobertas',
      },
    ],
    1: [
      {
        acao: 'Operacionalizar framework no CRM',
        descricao:
          'Campos obrigatórios do framework no CRM com validation rules. Avanço bloqueado sem preenchimento.',
        esforco: 'medio',
        gateOutput: 'Validation rules ativas em todos os campos do framework',
      },
      {
        acao: 'GTM Blueprint com 12 momentos cognitivos',
        descricao: 'Mapear cada momento a colateral específico (asset, pergunta, ação esperada).',
        esforco: 'alto',
        gateOutput: '12 momentos × colaterais documentados',
      },
    ],
    2: [
      {
        acao: 'ROI Framework de 6 fases operacionalizado',
        descricao:
          'Discovery → Diagnosis → Proposal → Onboarding → Verification → Expansion. QBRs trimestrais.',
        esforco: 'alto',
        gateOutput: 'Forecast accuracy >80%, QBRs em 100% dos clientes ativos',
      },
    ],
    3: [],
  },
  3: {
    0: [
      {
        acao: 'Documentar Playbooks M1-M8 em formato 1 página',
        descricao:
          'Para cada estágio, objetivo + critério de saída + colaterais aplicáveis + perguntas-chave.',
        esforco: 'medio',
        gateOutput: 'Playbooks publicados, consumidos em pipeline review semanal',
      },
    ],
    1: [
      {
        acao: 'Construir Handbooks 2-3p por motion × momento',
        descricao:
          'Onboarding High/Mid/Low-touch, Retenção, Expansão, Renovação, Risco. Cada handbook com KPI principal e definition of done.',
        esforco: 'alto',
        gateOutput: '8-16 handbooks publicados, owner declarado, revisão trimestral',
      },
      {
        acao: 'Declarar e mensurar TTFI por motion',
        descricao:
          'Tempo entre contrato e first impact mensurável. High-touch ≤90d, Low-touch 30-60d.',
        esforco: 'medio',
        gateOutput: 'TTFI reportado em MBR, GRR primeiro ano ≥85%',
      },
    ],
    2: [
      {
        acao: 'Coaching automatizado via Conversation Intelligence',
        descricao: 'Agente identifica desvios do playbook em chamadas. Feedback em <24h.',
        esforco: 'alto',
        gateOutput: 'Cobertura de coaching automatizado >70% das chamadas',
      },
    ],
    3: [],
  },
  4: {
    0: [
      {
        acao: 'CRM como source of truth (matar planilhas paralelas)',
        descricao:
          'Forecast vem do CRM. Pipeline review usa dashboards do CRM. Planilhas paralelas são deletadas com cerimônia.',
        esforco: 'medio',
        gateOutput: 'Forecast vindo 100% do CRM, sem planilha paralela',
      },
    ],
    1: [
      {
        acao: 'Separar pipelines macro por (tipo × motion)',
        descricao:
          'New Business High-touch, New Business Low-touch, Expansion, Renewal — pipelines distintos com estágios e critérios próprios.',
        esforco: 'medio',
        gateOutput: 'Mínimo 4 pipelines macro em ARPE, dashboards segmentados',
      },
      {
        acao: 'Configurar 5-8 dashboards canônicos',
        descricao:
          'Pipeline Coverage, Velocity, Win Rate, Forecast, GTM-5, Health, Capacity, Forecast por motion.',
        esforco: 'medio',
        gateOutput: 'Dashboards consumidos em ritual semanal pela liderança',
      },
    ],
    2: [
      {
        acao: 'Reverse ETL: Health Score e Lead Score vindo de ML',
        descricao:
          'Modelo treinado em dados próprios calcula scores e empurra para o CRM como campos.',
        esforco: 'alto',
        gateOutput: 'Score atualizado semanalmente, usado em workflows de priorização',
      },
    ],
    3: [],
  },
  5: {
    0: [
      {
        acao: 'Estabelecer ritual MBR mensal',
        descricao:
          'Pauta canônica de 90min: Big Numbers · GTM-5 · Funil · TOC · Pensamento Lógico · Plano de Ação · Roadmap.',
        esforco: 'baixo',
        gateOutput: 'MBR mensal acontecendo sem cancelamento por 3+ meses',
      },
      {
        acao: 'Declarar GTM-5',
        descricao: 'CAC, LTV, GRR, Pipeline Creation Rate, ROI Rate. Reportar mensalmente.',
        esforco: 'baixo',
        gateOutput: 'GTM-5 reportado em MBR, fonte canônica',
      },
    ],
    1: [
      {
        acao: 'Aplicar TOC explicitamente',
        descricao:
          'Identificar gargalo do mês, comparar com benchmark, atacar prioritariamente. 1 gargalo por vez.',
        esforco: 'medio',
        gateOutput: 'Gargalo identificado em todos os MBRs, nomeado e atacado',
      },
      {
        acao: 'Plano de Ação canônico',
        descricao:
          'Hipótese · Owner · Prazo · Métrica de validação · Custo · Trade-off. Padrão fixo.',
        esforco: 'baixo',
        gateOutput: '100% dos planos no formato; taxa de entrega >60%',
      },
    ],
    2: [
      {
        acao: 'Anomaly Detection automática',
        descricao: 'Agentes monitoram métricas-chave 24/7. Alertam quando desvio significativo.',
        esforco: 'alto',
        gateOutput: 'Cobertura de monitoring >10 métricas; latência de alerta <24h',
      },
    ],
    3: [],
  },
}

export function gerarRoadmap(diag: Pick<Diagnostico, 'niveis' | 'gargaloPilar'>): RoadmapItem[] {
  const items: RoadmapItem[] = []
  let counter = 0

  // Sprints 1-3: 3 ações no gargalo
  const gargalo = diag.gargaloPilar
  const nivelGargalo = diag.niveis[gargalo]
  const acoesGargalo = ACOES[gargalo][nivelGargalo] ?? []

  acoesGargalo.slice(0, 3).forEach((a, idx) => {
    const pilarInfo = PILARES.find((p) => p.numero === gargalo)!
    items.push({
      id: `r${counter++}`,
      pilar: gargalo,
      acao: a.acao,
      descricao: a.descricao,
      esforco: a.esforco,
      prioridade: idx + 1,
      isGargalo: true,
      sprintSugerido: (idx + 1) as 1 | 2 | 3 | 4,
      templateSlug: pilarInfo.templateSlug,
      chapterSlug: pilarInfo.chapterSlug,
      gateOutput: a.gateOutput,
    })
  })

  // Sprint 4: 2 ações nos próximos pilares mais fracos (não gargalo)
  const outrosPilares = ([1, 2, 3, 4, 5] as const)
    .filter((p) => p !== gargalo)
    .sort((a, b) => diag.niveis[a] - diag.niveis[b])
    .slice(0, 2)

  let prio = items.length + 1
  for (const p of outrosPilares) {
    const acoes = ACOES[p][diag.niveis[p]] ?? []
    if (acoes.length === 0) continue
    const acao = acoes[0]!
    const pilarInfo = PILARES.find((pi) => pi.numero === p)!
    items.push({
      id: `r${counter++}`,
      pilar: p,
      acao: acao.acao,
      descricao: acao.descricao,
      esforco: acao.esforco,
      prioridade: prio++,
      isGargalo: false,
      sprintSugerido: 4,
      templateSlug: pilarInfo.templateSlug,
      chapterSlug: pilarInfo.chapterSlug,
      gateOutput: acao.gateOutput,
    })
  }

  return items
}
