# ADR 0003 — Renomeação de Pilares (7→5)

**Status:** Accepted · 2026-04-26

## Context

A v3.5 da metodologia SCIENT trabalha com **7 pilares** (Estratégia · Clientes · Dados · Processos · Metas · Times · Gestão). O módulo legado `GTMBlackBox-Module/` está nessa nomenclatura. Para o produto BlackBox, queremos **5 pilares mais diretos e top-down**, alinhados ao princípio de Produtividade Humana do Edson.

## Decision

**5 pilares na superfície do BlackBox**, com mapeamento interno preservado:

| #   | BlackBox (5)                  | Sub-temas                                                              | v3.5 absorvidos                          |
| --- | ----------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| P1  | **Arquitetura de Dados**      | Nomenclatura · Critérios · Originação · Centralização · Enriquecimento | Dados (P3) + parte de Clientes (P2)      |
| P2  | **Metodologia Unificada**     | Frameworks de qualificação (SPICED como uma opção) · GTM Blueprint     | Estratégia (P1) + parte de Clientes (P2) |
| P3  | **Processos Padronizados**    | Playbooks M1-M8 · Handbooks 2-3p · TTFI                                | Processos (P4)                           |
| P4  | **Stack Parametrizada**       | CRM (etapas, campos, dashboards, pipelines) · Integrações              | Times (P6) parcial + ferramentas         |
| P5  | **Loop de Melhoria Contínua** | MBR · TOC · Roadmap · Planos de Ação                                   | Metas (P5) + Gestão (P7)                 |

Bridge em `src/lib/diagnostico/pilar-mapping.ts` converte 5↔7 quando exporta para GTM_Brain ou interage com docs canônicos.

## Consequences

- Schema Supabase usa **5 colunas** estritas (`p1_nivel..p5_nivel`), não 7
- Perguntas migradas precisam ser re-bucketed: P1 Estratégia + P2 Clientes ARMV → BlackBox P2; P3 Dados → BlackBox P1; etc.
- Engine TOC opera com 5 índices; gargalo é número 1-5
- Foundational RevOps (capítulo 12) explica essa correspondência para o leitor

## Alternativas

- **Manter 7 pilares:** rejeitado — perde clareza top-down e dilui Produtividade Humana
- **Reduzir para 4:** rejeitado — Arquitetura de Dados é nuclear demais para fundir com outro
