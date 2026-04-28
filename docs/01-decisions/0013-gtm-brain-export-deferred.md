# ADR 0013 — GTM_Brain Export Deferred to v2

**Status:** Accepted · 2026-04-26 · **Aplica decisão D5 desta sessão**

## Context

O módulo legado `GTMBlackBox-Module/lib/diagnostico/gtm-brain.ts` (94 linhas) tem duas funções:

- `buildGTMBrainSnapshot()` — transforma `Diagnostico` em `GTMBrainMaturitySnapshot` (JSONB)
- `exportToGTMBrain()` — insere snapshot em `gtm_brain_snapshots` + webhook POST opcional

Esse export depende de:

1. Tabela `gtm_brain_snapshots` (existe no schema legado, **não** no schema BlackBox v1)
2. Webhook URL externo do GTM_Brain (componente do GTM OS pago, não do BlackBox)

Verificação: zero deps internas — nenhum componente ou rota do BlackBox importa `gtm-brain.ts`.

## Decision

**Não copiar `gtm-brain.ts` para o v1**, nem como `_v2/` placeholder.

- Excluir do scope da Fase 4 (refactor do módulo legado)
- Schema do BlackBox v1 **não** inclui tabela `gtm_brain_snapshots`
- Wave futura (v2): se Giovanni quiser ativar export, adicionar:
  1. Migration nova: `CREATE TABLE gtm_brain_snapshots (...)`
  2. Reimportar `gtm-brain.ts` do legado para `src/lib/diagnostico/`
  3. Adicionar variável `GTM_BRAIN_WEBHOOK_URL` no `.env`
  4. Endpoint `/api/diagnostico/export-to-brain` que aciona

## Consequences

- BlackBox v1 é mais simples e standalone — nenhuma dependência de produto pago
- Diagnóstico exporta apenas TXT + prompt para Claude (§6.3 do prompt master)
- Quem comprar GTM OS depois consegue migrar diagnósticos manualmente ou via release v2

## Sinal para reativar

- 100+ diagnósticos completos no BlackBox
- Cliente pago do GTM OS pede import dos seus dados de BlackBox
- Funcionalidade "ver evolução do diagnóstico ao longo do tempo" entra no roadmap
