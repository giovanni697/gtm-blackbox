# ADR 0011 — Faturamento BRL Canônico

**Status:** Accepted · 2026-04-26

## Context

ICP da SCIENT é Brasil. Benchmarks do mercado (ICONIQ, Pavilion) são em USD. Misturar moedas no produto causa confusão e erros de cálculo no Forecast.

## Decision

### Moeda canônica do produto: **BRL**

- Inputs do usuário em BRL (ARR, MRR, ACV, ticket médio, custo por MQA)
- Outputs em BRL
- Schema `profiles.faturamento_atual` usa enums em BRL: `ate_20M_brl` / `20M_200M_brl` / `acima_200M_brl`
- Mapping para estágio Edson: ARMV / ARPE / ARE (independente da moeda)

### Benchmarks ICONIQ/Pavilion: convertidos com taxa fixa documentada

- **Taxa de conversão fixa: 1 USD = 5,00 BRL** (referência abr/2026, conservadora para arredondamentos)
- Documentar a taxa em `content/forecast/constantes-mercado.md`
- Benchmarks ICONIQ (ex: ARR $5-10M = 95% GRR) ficam em USD nos textos do ebook **com tradução de range em BRL** entre parênteses: _"$5-10M (~R$25-50M)"_

### Comparativo entre moedas no Forecast

- **Não** fazer conversão dinâmica USD↔BRL em runtime
- Se Giovanni quiser trocar a taxa, edita constante e regenera build

## Consequences

- Usuário entra valores em BRL sem ambiguidade
- Benchmarks documentados em ambas moedas para credibilidade técnica
- Refactor para multi-moeda (caso BlackBox internacionalize) = adicionar `currency` no profile + bridge em `lib/forecast/currency.ts`

## Validação

Em testes do Forecast, comparar ouput com cálculo manual em planilha (BRL) para garantir parity numérica.
