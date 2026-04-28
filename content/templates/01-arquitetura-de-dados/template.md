---
slug: '01-arquitetura-de-dados'
---

## Bloco 1 — Field Architecture (Nomenclatura)

Lista canônica de campos. Padrão de naming: `{entidade}_{atributo}__{contexto}` em snake_case.

### Entidade: Conta

| Campo                          | Tipo     | Picklist (se aplicável)                                         | Owner         | Obrigatório em |
| ------------------------------ | -------- | --------------------------------------------------------------- | ------------- | -------------- |
| `account_cnpj`                 | text     | —                                                               | Marketing     | M1             |
| `account_industry__primary`    | picklist | (12 valores fixos)                                              | Marketing     | M1             |
| `account_revenue_band__brl`    | picklist | `ate_20M_brl` / `20M_200M_brl` / `acima_200M_brl`               | Marketing     | M1             |
| `account_employee_count__band` | picklist | `1_50` / `51_200` / `201_1000` / `acima_1000`                   | Marketing     | M1             |
| `account_motion__primary`      | picklist | `no_touch` / `low_touch` / `mid_touch` / `high_touch` / `canal` | RevOps        | M2             |
| `account_owner__sales`         | user     | —                                                               | Sales Manager | M3             |

### Entidade: Negócio (Deal)

| Campo                                | Tipo      | Picklist          | Owner | Obrigatório em  |
| ------------------------------------ | --------- | ----------------- | ----- | --------------- |
| `deal_dor_principal__text`           | textarea  | —                 | AE    | M3              |
| `deal_decisor_economico__contact_id` | reference | —                 | AE    | M3              |
| `deal_orcamento__band`               | picklist  | (5 bandas em BRL) | AE    | M3              |
| `deal_urgencia__months`              | number    | —                 | AE    | M3              |
| `deal_metric_baseline__brl`          | currency  | —                 | AE    | M3              |
| `deal_lost_reason__primary`          | picklist  | (8-12 motivos)    | AE    | M5 (se perdido) |

## Bloco 2 — Event Instrumentation

Eventos críticos a capturar. Cada evento tem timestamp + actor + payload.

| Evento                   | Quando dispara           | Payload mínimo                              |
| ------------------------ | ------------------------ | ------------------------------------------- |
| `account_created`        | Conta criada no CRM      | source, owner, firmographic snapshot        |
| `mqa_qualified`          | Conta atinge MQA         | trigger source (webinar/asset/conv), score  |
| `discovery_completed`    | Discovery call concluída | duration, dor mapeada, decisor identificado |
| `deal_stage_change`      | Deal muda de estágio     | from_stage, to_stage, reason                |
| `proposal_sent`          | Proposta enviada         | proposal_value, validity_days               |
| `deal_won` / `deal_lost` | Deal fechado             | outcome, lost_reason (se aplicável)         |
| `kickoff_completed`      | Onboarding iniciado      | scheduled_ttfi_days                         |
| `first_impact_validated` | TTFI atingido            | actual_days, metric_delta                   |

## Bloco 3 — Ownership Map

Cada campo crítico tem dono — pessoa responsável pela qualidade do dado.

| Domínio                | Owner               | Responsabilidades                                 |
| ---------------------- | ------------------- | ------------------------------------------------- |
| Firmografia (Conta)    | Head de Marketing   | Garantir 95%+ preenchido via enrichment           |
| Qualificação (Negócio) | Head de Vendas      | Auditoria mensal de aderência aos critérios M1-M8 |
| Health Score (Cliente) | Head de CS          | Garantir cálculo semanal e ações preventivas      |
| Enrichment             | Head de RevOps      | Latência &lt;24h, cobertura >80%, acurácia >90%   |
| Integrações            | Head de RevOps + TI | SLAs declarados, monitoring ativo                 |

## Bloco 4 — Validation Rules

Regras que bloqueiam avanço/criação quando dado crítico está vazio ou inválido.

```
Exemplo: avanço de Discovery (M3) → Validation (M4):
- deal_dor_principal__text não vazio (min 50 chars)
- deal_decisor_economico__contact_id não vazio
- deal_orcamento__band selecionado
- deal_urgencia__months preenchido (número)
- deal_metric_baseline__brl preenchido (>0)

Se qualquer falhar → erro ao mover deal.
```

## Bloco 5 — Gates de Saída

A operação considera Pilar 1 implementado quando:

- [ ] 95%+ dos campos novos seguem naming canônico
- [ ] Picklists fechadas em campos críticos (&lt;5% de "outros")
- [ ] Critérios M1-M8 com checklists auditadas mensalmente (&lt;5% de avanços sem checklist completa)
- [ ] Cada campo crítico com owner declarado
- [ ] Enrichment-at-source funcionando para 80%+ dos novos registros
- [ ] Matching rate >99% (duplicatas residuais &lt;1%)
- [ ] Semantic Layer com 10+ métricas canônicas em uso
- [ ] Cobertura de enrichment >80%, latência &lt;24h, acurácia >90%
