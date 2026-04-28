---
pilar: 1
nome: 'Arquitetura de Dados'
perguntas:
  # ─── Sub-camada 1 — Nomenclatura ──────────────────────────────────
  - id: p1_nom_armv_1
    subcamada: nomenclatura
    estagioMinimo: ARMV
    texto: 'Existe uma convenção de nomenclatura documentada para os campos do CRM?'
    hint: 'Padrão tipo {entidade}_{atributo}__{contexto} em snake_case.'

  - id: p1_nom_armv_2
    subcamada: nomenclatura
    estagioMinimo: ARMV
    texto: 'Picklists fechadas em campos categóricos críticos (origem, indústria, motivo de perda)?'
    hint: "Sem campo livre 'outros — descrever' como regra."

  - id: p1_nom_arpe_1
    subcamada: nomenclatura
    estagioMinimo: ARPE
    texto: 'Cada campo crítico tem owner declarado (responsável pela qualidade do dado)?'

  - id: p1_nom_are_1
    subcamada: nomenclatura
    estagioMinimo: ARE
    texto: 'Auditoria mensal automatizada de campos fora-do-padrão (>5% do total triggera alerta)?'

  # ─── Sub-camada 2 — Critérios ─────────────────────────────────────
  - id: p1_cri_armv_1
    subcamada: criterios
    estagioMinimo: ARMV
    texto: 'Critérios de SQL/SAL/Won são objetivos (checklist) e iguais para todo vendedor?'

  - id: p1_cri_armv_2
    subcamada: criterios
    estagioMinimo: ARMV
    texto: 'Discovery call documenta dor + decisor + orçamento + urgência em campos do CRM?'

  - id: p1_cri_arpe_1
    subcamada: criterios
    estagioMinimo: ARPE
    texto: 'Avanço entre estágios é bloqueado por validation rules quando campos críticos estão vazios?'

  - id: p1_cri_arpe_2
    subcamada: criterios
    estagioMinimo: ARPE
    texto: 'Auditoria mensal de aderência: <5% de avanços sem checklist completa?'

  # ─── Sub-camada 3 — Originação ────────────────────────────────────
  - id: p1_ori_armv_1
    subcamada: originacao
    estagioMinimo: ARMV
    texto: 'Toda conta nova entra com firmografia mínima preenchida (industry, employee count, revenue band)?'

  - id: p1_ori_arpe_1
    subcamada: originacao
    estagioMinimo: ARPE
    texto: 'Enrichment-at-source funciona para 80%+ dos novos registros (não em batch noturno)?'

  - id: p1_ori_arpe_2
    subcamada: originacao
    estagioMinimo: ARPE
    texto: 'ICS (Ideal Customer Signals) — sinais comportamentais — estão mapeados e populados?'

  # ─── Sub-camada 4 — Centralização ─────────────────────────────────
  - id: p1_cen_armv_1
    subcamada: centralizacao
    estagioMinimo: ARMV
    texto: 'CNPJ (ou identificador único equivalente) é a chave canônica de Conta?'

  - id: p1_cen_arpe_1
    subcamada: centralizacao
    estagioMinimo: ARPE
    texto: 'Existe uma fonte única de verdade declarada por entidade (Conta, Contato, Assinatura)?'

  - id: p1_cen_arpe_2
    subcamada: centralizacao
    estagioMinimo: ARPE
    texto: 'Matching/merge engine ativo: duplicatas residuais <1%?'

  - id: p1_cen_are_1
    subcamada: centralizacao
    estagioMinimo: ARE
    texto: 'Semantic Layer com 10+ métricas canônicas (ARR, MRR, NRR, CAC, LTV) consumidas por todos os relatórios?'

  # ─── Sub-camada 5 — Enriquecimento ────────────────────────────────
  - id: p1_enr_armv_1
    subcamada: enriquecimento
    estagioMinimo: ARMV
    texto: 'Existe ferramenta de enrichment ativa (ZoomInfo, Apollo, Clay ou similar)?'

  - id: p1_enr_arpe_1
    subcamada: enriquecimento
    estagioMinimo: ARPE
    texto: 'Cobertura de enrichment >80% e latência <24h?'

  - id: p1_enr_are_1
    subcamada: enriquecimento
    estagioMinimo: ARE
    texto: 'Refresh automático por tipo de campo (firmográfico anual; decisor identificado por trimestre)?'
---
