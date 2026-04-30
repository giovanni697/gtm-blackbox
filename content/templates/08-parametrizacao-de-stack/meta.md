---
title: 'Template T8 — Parametrização de Stack (CRM)'
slug: '08-parametrizacao-de-stack'
pilar: 4
number: 'T8'
estagioMinimo: 'ARMV'
duracaoImplementacao: '3-6 semanas (HubSpot/Salesforce)'
outputEsperado: 'CRM operacional com pipelines macro, validation rules, dashboards canônicos'
preRequisitos: ['T1 — Arquitetura de Dados (mínimo nível 1)']
lastUpdated: '2026-04-26'
---

## Objetivo

Parametrizar o CRM principal e a stack adjacente para fazer enforcement das decisões dos pilares anteriores: foco vira picklist fechada, metodologia vira validation rule, processo vira workflow.

## Quando usar

- Você tem CRM mas ele é usado como agenda, não como source of truth.
- Forecast vem de planilha paralela.
- Cada gerente faz relatório próprio com métrica diferente.

## O que este template entrega

- Estrutura de pipelines macro por (tipo × motion).
- Etapas M1-M8 com critérios de saída.
- Lista de campos obrigatórios por etapa.
- Picklists canônicas.
- Workflows automáticos críticos.
- 5-8 dashboards canônicos.
- Padrões de integração com ERP/produto/marketing tools.
