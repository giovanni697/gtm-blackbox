# ADR 0008 — Canonical Sources & Conflict Resolution

**Status:** Accepted · 2026-04-26 · **Atualizado com D1 (ROI fases)**

## Context

Múltiplos documentos da SCIENT trazem versões diferentes de conceitos centrais (ROI Framework, Flywheel, motions, fórmulas). Sem hierarquia clara, o agente pode escolher errado.

## Decision

### Hierarquia de prioridade (mais novo manda)

| #   | Documento                                           | Data        | Autoridade                                   |
| --- | --------------------------------------------------- | ----------- | -------------------------------------------- |
| 1   | `Princípios_Edson Rigonatti.txt`                    | 22 abr 2026 | Moldura filosófica suprema                   |
| 2   | `CORE_Metodologia_GTM_Engineering_SCIENT_v3.5.docx` | mar 2026    | Canônico operacional                         |
| 3   | `VERSAO_3_5_METODOLOGIA.md`                         | 16 abr 2026 | Síntese curadoria v3.5                       |
| 4   | `gtm-engineering-dados-ia.pdf`                      | mar 2026    | Base do Pilar Arquitetura de Dados           |
| 5   | `Deck_GTM_Engineering_v3.5.pptx`                    | mar 2026    | Reforço visual                               |
| 6   | Workbook V4                                         | mar 2026    | Padrões editoriais — **filtrar V4-specific** |
| 7   | `[WIP] [CORE] v3.0.docx`                            | jan 2026    | Histórica — só onde v3.5 silenciar           |
| 8   | `METODOLOGIA_SCIENT.md`                             | 15 abr 2026 | Guia de leitura                              |

### Decisões fechadas (não re-debater)

| Conflito                | Decisão canônica                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ROI Framework fases** | **6 fases** — Discovery / Diagnosis / Proposal / Onboarding / Verification / Expansion (corrige o §1.7.2 do prompt master que dizia 5 fases — síntese D1 desta sessão) |
| Flywheel                | Jornada M1-M8 como espinha; flywheel 6 estágios vai para appendix                                                                                                      |
| Motions                 | 4 modais Edson: No-touch / Low-touch / High-touch / Canal                                                                                                              |
| Fórmula CS              | `CS = EC + RC × t` (soma)                                                                                                                                              |
| ICP nomenclatura        | "ICS — Ideal Customer Signals" como complemento                                                                                                                        |
| Princípio mestre        | Produtividade Humana — todos os pilares descem dela                                                                                                                    |
| SPICED                  | Uma opção entre 6 frameworks (sem rodapé WbD, sem citação Jacco, sem link)                                                                                             |

## Consequences

- Capítulo "Metodologia Unificada" (Pilar 2) descreve o ROI Framework com 6 fases
- Quando `[WIP] v3.0.docx` traz 5 fases, ignorar e usar v3.5
- Filtragem V4-specific: rejeitar CSP por tier, Saber/Ter/Executar/Potencializar (linguagem específica de cliente)

## Como usar

Ao escrever conteúdo, sempre validar contra esta hierarquia. Se conflito surgir, parar e pedir excerto canônico ao Giovanni.
