---
slug: '01-arquitetura-de-dados'
---

## Como usar

Avalie cada dimensão de 0 a 3. A média ponderada gera o nível do template.

## Dimensão 1 — Nomenclatura (peso 20%)

- **0 — Não iniciado:** campos ad-hoc, sem padrão. Picklists abertas. Naming inconsistente.
- **1 — Estrutura básica:** existe documento de naming, mas não há enforcement. Vendedor cria campo se quiser.
- **2 — Implementado:** naming aplicado em 80%+ dos campos novos. Picklists fechadas em campos críticos. Validation rules bloqueiam fora-do-padrão.
- **3 — Otimizado:** naming auditado mensalmente automaticamente, alertas para fora-do-padrão. Owner declarado por campo.

## Dimensão 2 — Critérios de transição (peso 20%)

- **0 — Não iniciado:** SQL/SAL/Won são interpretação do vendedor.
- **1 — Estrutura básica:** documento define critérios, mas sem checklist auditável. Vendedores aplicam parcialmente.
- **2 — Implementado:** checklist por estágio com campos do CRM. Validation rules ativas. Auditoria mensal.
- **3 — Otimizado:** Conversation Intelligence valida critérios em chamadas. Coaching automatizado em desvios.

## Dimensão 3 — Originação (peso 20%)

- **0 — Não iniciado:** dado crítico cai sem dono. Enrichment manual ou inexistente.
- **1 — Estrutura básica:** alguns campos têm enrichment automático em batch noturno.
- **2 — Implementado:** enrichment-at-source para 80%+ dos novos registros. Owner declarado por campo crítico.
- **3 — Otimizado:** ICS (Ideal Customer Signals) populados. Refresh automático por tipo de campo. SLAs por fonte.

## Dimensão 4 — Centralização (peso 20%)

- **0 — Não iniciado:** múltiplas fontes de verdade conflitantes (CRM, planilha, ERP, BI).
- **1 — Estrutura básica:** CRM é declaradamente a fonte primária, mas sincronização entre sistemas é manual ou frágil.
- **2 — Implementado:** Entity Model documentado, matching rate >99%, sync near-real-time entre sistemas críticos.
- **3 — Otimizado:** Semantic Layer com 10+ métricas canônicas. Data Contracts + SLOs. Catálogo + governança ativos.

## Dimensão 5 — Enriquecimento (peso 20%)

- **0 — Não iniciado:** sem ferramenta de enrichment ou dado bruto não-utilizável.
- **1 — Estrutura básica:** ferramenta de enrichment existe (ZoomInfo, Apollo, Clay), mas cobertura &lt;50%.
- **2 — Implementado:** cobertura >80%, latência &lt;24h, acurácia >90%, refresh definido.
- **3 — Otimizado:** múltiplos providers integrados, scoring de qualidade automatizado, alertas em drift.

## Score final

- 0-25%: Não iniciado
- 26-50%: Estrutura básica
- 51-80%: Implementado
- 81-100%: Otimizado

## Plano de promoção de nível

### De 0 → 1 (foundations)

1. Documentar nomenclatura canônica em uma página.
2. Fechar 5-10 picklists críticas.
3. Declarar owners para os 10 campos mais importantes.
4. Implementar enrichment automático em pelo menos 1 ponto de origem.

### De 1 → 2 (implementation)

1. Implementar validation rules nos campos críticos.
2. Estabelecer auditoria mensal de aderência.
3. Configurar matching/merge engine no CRM.
4. Aumentar cobertura de enrichment para 80%+.

### De 2 → 3 (optimization)

1. Construir Semantic Layer no Data Warehouse.
2. Implementar Conversation Intelligence para validar critérios em chamadas.
3. Adicionar ML scoring (Lead Score, Health Score) via Reverse ETL.
4. Monitoring automático com agentes para data quality.
