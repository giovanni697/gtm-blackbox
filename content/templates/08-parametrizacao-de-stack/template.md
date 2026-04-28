---
slug: '08-parametrizacao-de-stack'
---

## Bloco 1 — Pipelines macro (separação por motion)

| Pipeline                | Quando usar                          | Etapas (M1-M8 mapeadas)                                                                  |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| New Business High-touch | ACV >R$100K, ciclo 60-180d           | Account · Engagement · Discovery · Validation · Proposal · Negotiation · Closed Won/Lost |
| New Business Low-touch  | ACV R$5K-50K, ciclo 1-4 sem          | Account · Engagement · Discovery · Demo · Closed Won/Lost                                |
| Expansion               | Cliente ativo com whitespace mapeado | Whitespace · Discovery Expansion · Proposal · Closed                                     |
| Renewal                 | Próximo de renovar                   | Risk Assessment · Renewal Discussion · Renewed/Churned                                   |

## Bloco 2 — Etapas do CRM (exemplo High-touch)

| Etapa CRM   | M   | Critério de saída (resumido)        |
| ----------- | --- | ----------------------------------- |
| Account     | M1  | Está na LCA, firmografia mínima     |
| Engagement  | M2  | MQA — engajamento qualificado       |
| Discovery   | M3  | SQL — dor + decisor + urgência      |
| Validation  | M4a | SAL parcial — framework score >40%  |
| Proposal    | M4b | SAL completo — proposta apresentada |
| Negotiation | M4c | SAL avançado — termos discutidos    |
| Closed Won  | M5  | Contrato — minuta assinada          |
| Closed Lost | —   | lost_reason preenchido              |

## Bloco 3 — Campos obrigatórios por etapa

```
PARA SAIR DE DISCOVERY (M3) → VALIDATION (M4a):
- deal_dor_principal__text (preenchido, min 50 chars)
- deal_decisor_economico__contact_id (não vazio)
- deal_orcamento__band (selecionado da picklist)
- deal_urgencia__months (preenchido, número)
- deal_metric_baseline__brl (preenchido, valor > 0)
- deal_motion__primary (selecionado: high/mid/low)

PARA SAIR DE VALIDATION → PROPOSAL:
- deal_framework_score (≥40%)
- deal_stakeholders_count (≥3 mapeados em high-touch)
- deal_competitors_identified (preenchido)

PARA SAIR DE PROPOSAL → NEGOTIATION:
- proposal_value (preenchido)
- proposal_validity_days (preenchido)
- proposal_sent_at (timestamp)
- champion_identified (boolean true)

PARA SAIR DE NEGOTIATION → CLOSED WON:
- contract_terms_agreed (boolean true)
- minute_approved_at (timestamp)
```

## Bloco 4 — Picklists canônicas

```
account_industry__primary
- saas_b2b
- fintech
- e_commerce
- saude
- educacao
- industria
- servicos_profissionais
- retail
- midia
- agro
- governo
- outros

account_revenue_band__brl
- ate_20M_brl
- 20M_200M_brl
- acima_200M_brl

account_employee_count__band
- 1_50
- 51_200
- 201_1000
- acima_1000

deal_motion__primary
- no_touch
- low_touch
- mid_touch
- high_touch
- canal

deal_lost_reason__primary
- no_decision
- competitor_won
- timing_off
- budget_constraint
- product_fit_low
- pricing_too_high
- champion_left
- legal_blocker
- other
```

## Bloco 5 — Workflows automáticos críticos

| Workflow               | Trigger                                              | Ação                                            |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Auto-advance MQA→SQL   | Critérios MQA todos preenchidos + Discovery agendada | Move deal para SQL                              |
| Notificação ao Decisor | deal_decisor_economico\_\_contact_id preenchido      | E-mail personalizado ao decisor                 |
| Tarefa CSM TTFI        | D-7 antes do TTFI alvo                               | Cria task "validar caminho do first impact"     |
| Alert Sales Manager    | Deal em SQL >14 dias sem atividade                   | Notificação + escalation se >21d                |
| Re-engajamento         | Account em Engagement há 30+ dias                    | Move para "re-engagement" + cadência automática |
| Renewal Reminder       | 90 dias antes da renovação                           | Cria task pra CSM iniciar conversa              |

## Bloco 6 — Dashboards canônicos

| Dashboard           | Conteúdo                                   | Frequência consumo |
| ------------------- | ------------------------------------------ | ------------------ |
| Pipeline Coverage   | Pipeline aberto vs meta (3-4x benchmark)   | Semanal            |
| Velocity            | Ciclo médio por estágio vs benchmark       | Mensal             |
| Win Rate            | Por modal, por persona, por origem         | Mensal             |
| Forecast            | Projeção mensal vs realizado               | Semanal            |
| GTM-5               | CAC, LTV, GRR, NRR, Pipeline Creation Rate | Mensal             |
| Health Score        | Distribuição da base ativa                 | Semanal            |
| Capacity            | Utilização vs target por função            | Mensal             |
| Forecast por motion | Visão segmentada multi-motion              | Mensal             |

## Bloco 7 — Integrações canônicas

| Sistema → Sistema                  | Padrão        | Frequência     | Owner         |
| ---------------------------------- | ------------- | -------------- | ------------- |
| CRM ↔ ERP                          | API real-time | Imediato       | RevOps + TI   |
| CRM → Data Warehouse               | CDC           | Near-real-time | RevOps        |
| Marketing Automation → CRM         | Event-driven  | Imediato       | Marketing Ops |
| Data Warehouse → CRM (Reverse ETL) | Batch         | Diário         | RevOps        |
| CS Platform ↔ CRM                  | API real-time | Imediato       | CS Ops        |
