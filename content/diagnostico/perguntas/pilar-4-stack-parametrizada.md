---
pilar: 4
nome: 'Stack Parametrizada'
perguntas:
  - id: p4_armv_1
    estagioMinimo: ARMV
    texto: 'Existe um CRM único como source of truth (não planilhas paralelas para forecast)?'

  - id: p4_armv_2
    estagioMinimo: ARMV
    texto: 'Etapas do CRM seguem nomenclatura M1-M8 (ou equivalente declarado)?'

  - id: p4_arpe_1
    estagioMinimo: ARPE
    texto: 'Pipelines macro separados por (tipo de receita × motion)? Ex: New Business High-touch + New Business Low-touch + Expansion + Renewal.'

  - id: p4_arpe_2
    estagioMinimo: ARPE
    texto: 'Validation rules ativas: 0 deals avançam sem campos críticos preenchidos?'

  - id: p4_arpe_3
    estagioMinimo: ARPE
    texto: "Picklists fechadas em todos os campos categóricos críticos (<5% de uso de 'outros')?"

  - id: p4_arpe_4
    estagioMinimo: ARPE
    texto: 'Workflows automáticos rodando: auto-advance de estágios, notificações, alertas de deal stagnation?'

  - id: p4_arpe_5
    estagioMinimo: ARPE
    texto: '5-8 dashboards canônicos (Pipeline Coverage, Velocity, Win Rate, Forecast, GTM-5, Health, Capacity) consumidos pela liderança em ritual semanal?'

  - id: p4_arpe_6
    estagioMinimo: ARPE
    texto: 'Setup de novo usuário no CRM <2 semanas para produtividade plena?'

  - id: p4_are_1
    estagioMinimo: ARE
    texto: 'Integrações com ERP/produto/marketing tools com SLA de freshness declarado?'

  - id: p4_are_2
    estagioMinimo: ARE
    texto: 'Reverse ETL ativo: Health Score, Lead Score, Churn Risk calculados em ML e levados ao CRM?'

  - id: p4_are_3
    estagioMinimo: ARE
    texto: 'Auditoria contínua de qualidade do dado por agentes (campos inconsistentes, drift de schema)?'
---
