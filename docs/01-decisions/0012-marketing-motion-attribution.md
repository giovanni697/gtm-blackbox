# ADR 0012 — Marketing Motion Attribution

**Status:** Accepted · 2026-04-26

## Context

Forecast multi-motion calcula necessidades por funil (Marketing/Pré/Vendas/CS) **por motion**. Quando empresa tem campanhas de marketing **dedicadas** por motion (ex: PLG vs Enterprise), atribuição é direta. Quando marketing é agregado, precisa de heurística.

## Decision

### Caminho A — Campanhas dedicadas (preferido)

Se usuário declara `marketing.dedicado_por_motion = true`:

- Cada motion tem `custoPorMqa` próprio
- Engine calcula MQAs/SQLs/SALs/Deals por motion isoladamente
- Output: linha de marketing por motion no resultado

### Caminho B — Marketing agregado (fallback)

Se usuário declara `marketing.dedicado_por_motion = false`:

- Custo total de marketing rateado **proporcionalmente ao `pct_arr` de cada motion**
- Ex: Marketing R$200K/mês · High-touch 60% ARR · Low-touch 40% ARR → R$120K para HT, R$80K para LT
- Engine usa esse rateio para calcular CAC por motion
- Output: linha de marketing agregada + breakdown proporcional no detalhe

## Consequences

- Engine sempre suporta os dois caminhos sem branching no código de cálculo principal
- Wizard pergunta **uma vez** no bloco Marketing: "Vocês operam campanhas dedicadas por motion?"
- Validação: warning se user declara dedicado mas só preenche custo único

## Trade-offs

- Caminho B perde precisão real (campanha de PLG geralmente é mais barata por MQA que ABM Enterprise)
- Mitigação: warning explicito no output: _"Atribuição proporcional pode mascarar diferenças reais de CAC entre motions. Recomendado segregar campanhas e re-rodar."_
