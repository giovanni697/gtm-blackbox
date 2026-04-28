# ADR 0005 — Telemetria PostHog (deferida v2)

**Status:** Deferred · 2026-04-26

## Context

Prompt master §1.11 sugeriu PostHog Cloud free tier desde dia 1 (events: signup, diag_started, diag_completed, roadmap_exported, template_downloaded, forecast_calculated). Análise mais profunda mostrou que v1 ainda está em validação de produto e o plano open-source não tem escala que justifique telemetria de terceiros.

## Decision

**Não incluir PostHog em v1.** Sem SDK no client, sem eventos. Apenas telemetria nativa:

- Logs do Vercel (acesso por rota)
- Logs do Supabase (auth events, RLS hits)
- `console.log` em rotas de API críticas (apagar antes de prod)

## Consequences

- Sem visibilidade granular de funil (signup→diagnóstico→export)
- Decisões de UX baseadas em conversas com usuários, não dados quantitativos
- Sem opt-in/opt-out de cookies necessário (LGPD simplificado)

## Trigger para reativar

- 50+ usuários ativos
- Necessidade de A/B testar copy ou fluxo de wizard
- Interesse comercial em métrica de conversão freemium → cert/GTM OS
