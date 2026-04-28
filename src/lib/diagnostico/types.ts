// GTM BlackBox — Diagnóstico Types (5 pilares)

export type Estagio = 'ARMV' | 'ARPE' | 'ARE'
export type NivelMaturidade = 0 | 1 | 2 | 3
export type Resposta = 'sim' | 'nao' | 'parcial'

export type SubcamadaP1 =
  | 'nomenclatura'
  | 'criterios'
  | 'originacao'
  | 'centralizacao'
  | 'enriquecimento'

// ─── Pilares (BlackBox: 5) ───────────────────────────────────────────

export interface PilarInfo {
  numero: 1 | 2 | 3 | 4 | 5
  nome: string
  descricao: string
  cor: string
  templateSlug: string
  chapterSlug: string
  subcamadas?: readonly SubcamadaP1[]
}

export const PILARES: readonly PilarInfo[] = [
  {
    numero: 1,
    nome: 'Arquitetura de Dados',
    descricao: 'Nomenclatura · Critérios · Originação · Centralização · Enriquecimento',
    cor: '#0030E8',
    templateSlug: '01-arquitetura-de-dados',
    chapterSlug: '03-pilar-1-arquitetura-de-dados',
    subcamadas: ['nomenclatura', 'criterios', 'originacao', 'centralizacao', 'enriquecimento'],
  },
  {
    numero: 2,
    nome: 'Metodologia Unificada',
    descricao: 'Frameworks de qualificação · GTM Blueprint · Linguagem comum',
    cor: '#0030E8',
    templateSlug: '02-workflow-de-gtm',
    chapterSlug: '04-pilar-2-metodologia-unificada',
  },
  {
    numero: 3,
    nome: 'Processos Padronizados',
    descricao: 'Playbooks M1-M8 · Handbooks 2-3p · TTFI',
    cor: '#0030E8',
    templateSlug: '03-handbook-2-3-paginas',
    chapterSlug: '05-pilar-3-processos-padronizados',
  },
  {
    numero: 4,
    nome: 'Stack Parametrizada',
    descricao: 'CRM · Pipelines · Validation rules · Integrações',
    cor: '#0030E8',
    templateSlug: '08-parametrizacao-de-stack',
    chapterSlug: '06-pilar-4-stack-parametrizada',
  },
  {
    numero: 5,
    nome: 'Loop de Melhoria Contínua',
    descricao: 'MBR · TOC · Roadmap · Planos de Ação',
    cor: '#0030E8',
    templateSlug: '05-mbr',
    chapterSlug: '07-pilar-5-loop-de-melhoria-continua',
  },
] as const

export const NIVEL_LABELS: Record<NivelMaturidade, string> = {
  0: 'Não iniciou',
  1: 'Estrutura básica',
  2: 'Implementado',
  3: 'Otimizado',
}

export const NIVEL_CORES: Record<NivelMaturidade, string> = {
  0: '#94A3B8',
  1: '#F97316',
  2: '#0030E8',
  3: '#40E0A8',
}

export const ESTAGIO_LABEL: Record<Estagio, string> = {
  ARMV: 'ARMV — Área de Receita Mínima Viável',
  ARPE: 'ARPE — Área de Receita Pronta para Escalar',
  ARE: 'ARE — Área de Receita Escalável',
}

export const ESTAGIO_FATURAMENTO: Record<Estagio, string> = {
  ARMV: 'até R$20M de Receita',
  ARPE: 'R$20M a R$200M de Receita',
  ARE: 'acima de R$200M de Receita',
}

export type FaturamentoKey = 'ate_20M_brl' | '20M_200M_brl' | 'acima_200M_brl'

export const FATURAMENTO_TO_ESTAGIO: Record<FaturamentoKey, Estagio> = {
  ate_20M_brl: 'ARMV',
  '20M_200M_brl': 'ARPE',
  acima_200M_brl: 'ARE',
}

// ─── Domain ──────────────────────────────────────────────────────────

export interface Pergunta {
  id: string
  pilar: 1 | 2 | 3 | 4 | 5
  subcamada?: SubcamadaP1
  estagioMinimo: Estagio
  texto: string
  hint?: string
}

export interface ChecklistResposta {
  perguntaId: string
  resposta: Resposta
}

export interface Diagnostico {
  id?: string
  userId: string
  estagio: Estagio
  niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>
  subcamadasP1: Record<SubcamadaP1, NivelMaturidade>
  scoreTotal: number
  percentualMaturidade: number
  gargaloPilar: 1 | 2 | 3 | 4 | 5
  aiReady: boolean
  arpeReady: boolean
  areReady: boolean
  createdAt?: string
}

// ─── Roadmap ─────────────────────────────────────────────────────────

export type EsforcoEstimado = 'baixo' | 'medio' | 'alto'

export interface RoadmapItem {
  id: string
  pilar: 1 | 2 | 3 | 4 | 5
  acao: string
  descricao: string
  esforco: EsforcoEstimado
  prioridade: number
  isGargalo: boolean
  sprintSugerido: 1 | 2 | 3 | 4
  templateSlug?: string
  chapterSlug?: string
  gateOutput?: string
}

export interface PerfilOnboarding {
  nome: string
  empresa: string
  cargo?: string
  setor?: string
  faturamentoAtual: FaturamentoKey
  estagio: Estagio
}
