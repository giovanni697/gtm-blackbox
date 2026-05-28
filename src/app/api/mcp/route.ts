import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api/auth'
import { listPerguntas } from '@/lib/content/readPerguntas'
import { calcularNiveis } from '@/lib/diagnostico/scoring'
import { gerarRoadmap } from '@/lib/diagnostico/roadmap-engine'
import { PILARES } from '@/lib/diagnostico/types'
import { buildScientificForecast } from '@/lib/forecast/scientific-forecast'
import type { Resposta, Estagio } from '@/lib/diagnostico/types'
import type { ForecastInput } from '@/lib/forecast/types'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const METHODOLOGY_TEXT = `GTM BlackBox — Metodologia SCIENT v3.5

5 PILARES DE MATURIDADE GTM:
P1 — Arquitetura de Dados: nomenclatura, critérios M1-M8, originação, centralização, enriquecimento
P2 — Metodologia Unificada: frameworks de qualificação, GTM Blueprint, linguagem comum
P3 — Processos Padronizados: playbooks M1-M8, handbooks 2-3p, TTFI
P4 — Stack Parametrizada: CRM, pipelines, validation rules, integrações
P5 — Loop de Melhoria Contínua: MBRs, QBRs, retrospectivas, métricas ARMV/ARPE/ARE

ESTÁGIOS DE MATURIDADE (Teoria das Restrições):
ARMV — Área de Receita Mínima Viável (fundacional, tipicamente até R$20M ARR)
ARPE — Área de Receita Pronta para Escalar (máquina estabelecida, multi-motion controlado)
ARE  — Área de Receita Escalável (AI-Native, excelência operacional, expansão global)

NÍVEIS DE MATURIDADE POR PILAR: 0 (inexistente) → 1 (básico) → 2 (funcional) → 3 (avançado)

SCORING: sim=1, parcial=0.5, não=0. Cada pilar agrega por percentual.
GARGALO TOC: o pilar com menor nível define o ritmo do sistema.
ROADMAP: ações ordenadas do gargalo para o nível +1.

USE CASES PARA AGENTES:
1. get_questions → collect client answers → run_diagnostic → interpret roadmap
2. calculate_forecast com dados do CRM do cliente para projeção de ARR
3. Cruzar diagnóstico + forecast: identificar restrição TOC + impact no ARR`

function buildMcpServer(): McpServer {
  const server = new McpServer({
    name: 'gtm-blackbox',
    version: '1.0.0',
  })

  // Tool 1: get_questions
  server.tool(
    'get_questions',
    "Retorna as perguntas do diagnóstico GTM BlackBox. Use estagio='ARMV' (padrão), 'ARPE' ou 'ARE' para filtrar por estágio de maturidade.",
    {
      estagio: z.enum(['ARMV', 'ARPE', 'ARE']).optional(),
    },
    async ({ estagio }: { estagio?: Estagio }) => {
      const ESTAGIO_ORDER: Record<Estagio, number> = { ARMV: 0, ARPE: 1, ARE: 2 }
      let perguntas = await listPerguntas()
      if (estagio) {
        const limit = ESTAGIO_ORDER[estagio]
        perguntas = perguntas.filter((p) => ESTAGIO_ORDER[p.estagioMinimo] <= limit)
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { total: perguntas.length, estagio: estagio ?? 'all', perguntas },
              null,
              2,
            ),
          },
        ],
      }
    },
  )

  // Tool 2: run_diagnostic
  server.tool(
    'run_diagnostic',
    'Executa o diagnóstico GTM BlackBox. Recebe respostas para as 66 perguntas e retorna score por pilar (P1-P5), percentual de maturidade, gargalo TOC e roadmap priorizado.',
    {
      respostas: z.record(z.string(), z.enum(['sim', 'nao', 'parcial'])),
      perfil: z
        .object({
          nome: z.string().optional(),
          empresa: z.string().optional(),
          estagio: z.enum(['ARMV', 'ARPE', 'ARE']).optional(),
        })
        .optional(),
    },
    async ({
      respostas,
      perfil,
    }: {
      respostas: Record<string, 'sim' | 'nao' | 'parcial'>
      perfil?: { nome?: string; empresa?: string; estagio?: Estagio }
    }) => {
      const perguntas = await listPerguntas()
      const { niveis, subcamadasP1, scoreTotal, percentualMaturidade } = calcularNiveis(
        perguntas,
        respostas as Record<string, Resposta>,
      )

      const pilaresSorted = Object.entries(niveis)
        .map(([pilar, nivel]) => ({ pilar: Number(pilar) as 1 | 2 | 3 | 4 | 5, nivel }))
        .sort((a, b) => a.nivel - b.nivel)
      const gargaloEntry = pilaresSorted[0]!
      const gargaloPilarInfo = PILARES.find((p) => p.numero === gargaloEntry.pilar)

      const diagnosticData = {
        niveis,
        gargaloPilar: gargaloEntry.pilar,
      }
      const roadmap = gerarRoadmap(diagnosticData)

      const result = {
        diagnostico: {
          perfil: perfil ?? {},
          nivelP1: niveis[1],
          nivelP2: niveis[2],
          nivelP3: niveis[3],
          nivelP4: niveis[4],
          nivelP5: niveis[5],
          subcamadasP1,
          scoreTotal,
          percentualMaturidade,
          aiReady: niveis[1] >= 2 && niveis[2] >= 2,
          arpeReady: niveis[1] >= 1 && niveis[2] >= 1 && niveis[3] >= 1,
          areReady: Object.values(niveis).every((n) => n >= 2),
        },
        gargalo: {
          pilar: gargaloEntry.pilar,
          nivel: gargaloEntry.nivel,
          nome: gargaloPilarInfo?.nome,
          descricao: gargaloPilarInfo?.descricao,
        },
        roadmap,
        respondidas: Object.keys(respostas).length,
        totalPerguntas: perguntas.length,
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // Tool 3: calculate_forecast
  server.tool(
    'calculate_forecast',
    'Calcula projeção de receita 12 meses. Recebe inputs do funil (ARR atual, meta, motions, taxas) e retorna projeção MRR mês a mês, gap vs meta e capacity analysis.',
    {
      arrAtualBrl: z.number().min(0),
      arrMetaBrl: z.number().positive(),
      horizonMeses: z.number().int().min(1).max(36).default(12),
      motions: z
        .array(
          z.object({
            modal: z.enum(['no_touch', 'low_touch', 'mid_touch', 'high_touch', 'canal']),
            acvBrl: z.number().positive(),
            cicloDias: z.number().positive(),
            pctArr: z.number().min(0).max(100),
            recorrente: z.boolean().default(true),
            duracaoContrataMeses: z.number().default(12),
            sdrsAtuais: z.number().min(0).default(0),
            sdrsCapacityPorMes: z.number().min(0).default(10),
            aesAtuais: z.number().min(0).default(1),
            aesDealsPorMes: z.number().min(0).default(4),
            csmsAtuais: z.number().min(0).default(0),
            csmsContasMax: z.number().min(0).default(50),
            clientesAtivos: z.number().min(0).default(0),
          }),
        )
        .min(1),
      taxasFunil: z.object({
        accountMqa: z.number(),
        mqaSql: z.number(),
        sqlSal: z.number(),
        winRate: z.number(),
        grr: z.number().min(0).max(150),
        nrr: z.number().min(0).max(200),
      }),
      marketing: z.object({
        custoPorMqaBrl: z.number(),
        budgetMensalBrl: z.number(),
        campanhasDedicadasPorMotion: z.boolean().default(false),
      }),
    },
    async (args: {
      arrAtualBrl: number
      arrMetaBrl: number
      horizonMeses: number
      motions: ForecastInput['motions']
      taxasFunil: ForecastInput['taxasFunil']
      marketing: ForecastInput['marketing']
    }) => {
      const input: ForecastInput = {
        ...args,
        constantes: {
          rampMeses: 5,
          attritionPct: 10,
          atingimentoTopQuartilePct: 60,
          turnoverPct: 20,
          pipelineCoverageTarget: 3,
        },
      }

      const forecast = buildScientificForecast(input)
      const ultimo = forecast[forecast.length - 1]

      const result = {
        horizonMeses: input.horizonMeses,
        arrAtual: input.arrAtualBrl,
        arrMeta: input.arrMetaBrl,
        arrProjetado: ultimo ? ultimo.eopMrr * 12 : 0,
        gapVsMeta: ultimo ? ultimo.gapVsMeta : input.arrMetaBrl - input.arrAtualBrl,
        meses: forecast,
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // Tool 4: get_methodology
  server.tool(
    'get_methodology',
    'Retorna a metodologia GTM BlackBox — os 5 pilares, estágios ARMV/ARPE/ARE, TOC aplicado ao GTM e contexto para interpretar resultados do diagnóstico.',
    {},
    async () => {
      return {
        content: [{ type: 'text' as const, text: METHODOLOGY_TEXT }],
      }
    },
  )

  return server
}

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-gtm-key') ?? ''
  const auth = await validateApiKey(key)
  if (auth.status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized. Provide X-GTM-Key header.' }, { status: 401 })
  }
  if (auth.status === 'rate_limited') {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: auth.headers },
    )
  }

  // Create a fresh MCP server + stateless transport per request
  const mcpServer = buildMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    // No sessionIdGenerator = stateless mode
    enableJsonResponse: true,
  })

  await mcpServer.connect(transport)

  // Handle the request through the transport
  const response = await transport.handleRequest(req)
  return response
}

// Also handle GET for server info / tool listing via SSE
export async function GET(req: NextRequest) {
  const key = req.headers.get('x-gtm-key') ?? ''
  const auth = await validateApiKey(key)
  if (auth.status === 'unauthorized') {
    return NextResponse.json({ error: 'Unauthorized. Provide X-GTM-Key header.' }, { status: 401 })
  }
  if (auth.status === 'rate_limited') {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429, headers: auth.headers },
    )
  }

  const mcpServer = buildMcpServer()
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  })

  await mcpServer.connect(transport)
  const response = await transport.handleRequest(req)
  return response
}
