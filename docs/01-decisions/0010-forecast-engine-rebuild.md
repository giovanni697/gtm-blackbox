# ADR 0010 — Forecast Engine: Rebuild from Inputs/Outputs

**Status:** Accepted · 2026-04-26

## Context

Existe uma planilha `Templates GTM/SCIENT Open Source Scientific Forecast @ 2025.xlsx` com lógica complexa (8 abas, fórmulas encadeadas, lookups, ramp-up histórico vs projetado). Tentar **replicar a planilha em código** preservando todas as fórmulas seria frágil e cresceria mal.

## Decision

**Inverter a lógica:**

1. Extrair INPUTS que a planilha pede (ticket médio, MRR start, taxas conversão, ciclo dias) — viram perguntas no wizard
2. Extrair OUTPUTS calculados (Total MRR, deals required, capacity match) — viram cards no resultado
3. **Reconstruir a engine em TypeScript** dentro de `src/lib/forecast/` partindo dos inputs/outputs canônicos da metodologia v3.5 (Pavilion benchmarks, ICONIQ Top Quartile, fórmulas Sprint 02)
4. Servir a `.xlsx` original para download como referência histórica/transparência (não dependência viva)

### Estrutura da engine

- `relacoes-matematicas.ts` — fórmulas canônicas multi-motion
- `benchmarks-por-motion.ts` — tabela High/Mid/Low/No-touch/Canal
- `input-validators.ts` — warnings (Win Rate >40%, Atingimento >80%, Pipeline <3x)
- `verdict-engine.ts` — bandas <60/60-79/80-110/>110%
- `hiring-engine.ts` — ramp em cascata + flag `viavel: boolean`
- `scientific-forecast.ts` — BOP/EOP MRR por safra, 12 meses

## Consequences

- Não há "biblioteca" da planilha presa ao código — manutenção é em TS puro
- Multi-motion suportado nativamente (planilha original não tinha)
- Ramp em cascata e flag `viavel: false` quando contratação seria retroativa
- Output é determinístico e testável (unit tests futuros possíveis)

## Trade-offs

- Quem editar a planilha original NÃO afeta o BlackBox (intencional — separação)
- Mudanças nos benchmarks (ex: ICONIQ atualizar Top Quartile de 60% para 65%) exigem PR no código, não edit numa célula
