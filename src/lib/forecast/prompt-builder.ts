import type { ForecastInput, ForecastOutput } from './types'
import { MOTION_LABEL } from './benchmarks-por-motion'

export function buildForecastTxt(
  empresa: string,
  input: ForecastInput,
  output: ForecastOutput,
): string {
  const date = new Date().toLocaleDateString('pt-BR')
  const lines: string[] = []
  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  const fmtBrl = (n: number) => `R$${fmt(n)}`

  lines.push('═══════════════════════════════════════════════════════')
  lines.push('GTM BLACKBOX · FORECAST & CAPACITY PLANNING')
  lines.push('Por SCIENT — Scientific AI-Native Go-to-Market')
  lines.push(`Gerado em: ${date}`)
  lines.push('═══════════════════════════════════════════════════════')
  lines.push('')
  lines.push(`EMPRESA: ${empresa}`)
  lines.push(`ARR ATUAL: ${fmtBrl(input.arrAtualBrl)}`)
  lines.push(`ARR META (${input.horizonMeses}m): ${fmtBrl(input.arrMetaBrl)}`)
  lines.push(`MOTIONS ATIVOS: ${input.motions.length}`)
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push('CAPACITY VERDICT POR FUNÇÃO × MOTION')
  lines.push('───────────────────────────────────────────────────────')
  for (const v of output.capacityVerdicts) {
    const flag =
      v.status === 'critico'
        ? '🔴'
        : v.status === 'falta'
          ? '🟠'
          : v.status === 'sobra'
            ? '🟡'
            : '🟢'
    lines.push(`${flag} ${v.funcao} (${v.motion}): ${v.message}`)
  }
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push('METAS POR FUNÇÃO (mensal)')
  lines.push('───────────────────────────────────────────────────────')
  lines.push(
    `Marketing: ${output.metricas.marketing.mqasPorMes} MQAs/mês · ${fmtBrl(output.metricas.marketing.rsPorMqa)}/MQA`,
  )
  lines.push(
    `Pré-vendas: ${output.metricas.preVendas.sqlsPorSdrPorMes} SQLs/SDR · ${output.metricas.preVendas.sqlsTotalPorMes} SQLs total/mês`,
  )
  lines.push(
    `Vendas: ${output.metricas.vendas.dealsPorAePorMes} deals/AE · ${output.metricas.vendas.dealsTotalPorMes} deals total/mês · ${fmtBrl(output.metricas.vendas.arrFechadoPorMes)} ARR/mês`,
  )
  lines.push(
    `CS: ${output.metricas.cs.contasPorCsm} contas/CSM · GRR ${output.metricas.cs.grrTarget}% · NRR ${output.metricas.cs.nrrTarget}%`,
  )
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push('HIRING PLAN')
  lines.push('───────────────────────────────────────────────────────')
  if (output.hiringPlan.viavel) {
    lines.push('🟢 PLANO VIÁVEL\n')
    if (output.hiringPlan.actions.length === 0) {
      lines.push('Capacity atual atende a meta sem necessidade de hiring adicional.')
    } else {
      for (const a of output.hiringPlan.actions) {
        lines.push(
          `+${a.headcount} ${a.role} em mês ${a.mesContratacao} (full capacity em mês ${a.mesFullCapacity})`,
        )
      }
    }
  } else {
    lines.push('🔴 PLANO INVIÁVEL via contratação\n')
    lines.push('Bloqueantes:')
    for (const a of output.hiringPlan.actions.filter((x) => x.bloqueante)) {
      lines.push(`  - ${a.role}: ${a.bloqueante}`)
    }
    lines.push('\nAlternativas:')
    output.hiringPlan.alternativasSeInviavel.forEach((alt, i) => {
      lines.push(`${i + 1}. ${alt}`)
    })
  }
  lines.push('')

  lines.push('───────────────────────────────────────────────────────')
  lines.push('VERDICT TEXTUAL')
  lines.push('───────────────────────────────────────────────────────')
  lines.push(output.verdictTextual)
  lines.push('')

  if (output.warnings.length > 0) {
    lines.push('───────────────────────────────────────────────────────')
    lines.push('AVISOS / VALIDAÇÕES')
    lines.push('───────────────────────────────────────────────────────')
    for (const w of output.warnings) {
      const icon = w.severity === 'critical' ? '🔴' : w.severity === 'warn' ? '🟠' : 'ℹ️'
      lines.push(`${icon} [${w.field}] ${w.message}`)
      if (w.benchmark) lines.push(`   Benchmark: ${w.benchmark}`)
    }
    lines.push('')
  }

  lines.push('═══════════════════════════════════════════════════════')
  lines.push('Disclaimer: outputs são estimativas estruturadas, não promessas.')
  lines.push('Use para orientar conversas com o time, não para travar metas.')
  lines.push('═══════════════════════════════════════════════════════')

  return lines.join('\n')
}

export function buildForecastClaudePrompt(
  empresa: string,
  input: ForecastInput,
  output: ForecastOutput,
): string {
  const motionsList = input.motions
    .map(
      (m) =>
        `- ${MOTION_LABEL[m.modal]}: ACV R$${m.acvBrl.toLocaleString('pt-BR')} · ciclo ${m.cicloDias}d · ${m.pctArr}% do ARR`,
    )
    .join('\n')

  return `PROMPT PARA CLAUDE (gerar Plano de Capacity em HTML)

CONTEXTO:
Empresa: ${empresa}
ARR atual: R$${(input.arrAtualBrl / 1_000_000).toFixed(2)}M
ARR meta (${input.horizonMeses}m): R$${(input.arrMetaBrl / 1_000_000).toFixed(2)}M

MOTIONS ATIVOS:
${motionsList}

CAPACITY VERDICT:
${output.capacityVerdicts
  .map((v) => `- ${v.funcao} (${v.motion}): ${v.status.toUpperCase()} (${v.pctAtendimento}%)`)
  .join('\n')}

HIRING PLAN: ${output.hiringPlan.viavel ? 'VIÁVEL' : 'INVIÁVEL via contratação'}
${output.hiringPlan.actions
  .map(
    (a) =>
      `- ${a.role}: +${a.headcount} pessoas em mês ${a.mesContratacao}${a.bloqueante ? ' [BLOQUEADO]' : ''}`,
  )
  .join('\n')}

INSTRUÇÃO:
Gere um artefato HTML único, auto-contido (inline CSS), no formato de "Plano de Capacity 2026", contendo:

1. Capa com nome da empresa (${empresa}) e identidade visual:
   - Cor primária: [USUÁRIO PREENCHE]
   - Logo URL: [USUÁRIO PREENCHE]
   - Fonte: [USUÁRIO PREENCHE]

2. Big Numbers: ARR atual, meta, % crescimento, # motions.

3. Tabela de Capacity Verdict (função × motion) com cores (verde/amarelo/vermelho).

4. Hiring Plan visual com timeline (qual contratação, mês de início, full capacity).

5. Scientific Forecast: gráfico simples MRR mês a mês (BOP / New Logo / Expansion / Churn / EOP).

6. Avisos críticos destacados.

7. Footer com link para http://gtme.scient.cc.

OUTPUT: HTML completo, inline CSS, sem dependências.
`
}
