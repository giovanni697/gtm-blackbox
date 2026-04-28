# PROMPT MASTER — Q&A Pré-Lançamento · GTM BlackBox

> **Para colar inteiro em uma nova sessão (Claude.ai, ChatGPT, Claude Code) antes do Giovanni começar testes manuais.**
> Este prompt orienta uma auditoria sistemática de toda a plataforma — código, conteúdo, fluxos, compliance.
> Tempo estimado de execução completa: 4-6h por agente; ou 2-3h se rodado por múltiplos agentes em paralelo.

---

## 0 · COMO USAR ESTE PROMPT

### Caminho A — IA conduz a revisão (recomendado)

1. Abra uma nova sessão do Claude Code dentro de `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`.
2. Cole este prompt inteiro como primeira mensagem.
3. Permita que a IA leia os arquivos do projeto (será necessário aprovar ferramentas de leitura).
4. A IA vai gerar um Q&A_REPORT.md com findings priorizados por severidade.
5. Você (Giovanni) revisa o report e prioriza os fixes antes de testes manuais.

### Caminho B — Roteiro manual pelo Giovanni

1. Use as checklists das seções 4 e 5 deste prompt como roteiro de teste no browser.
2. Marque ✅/❌ em cada item conforme valida.
3. Issues encontradas viram tarefas para próxima sessão de coding.

### Caminho C — Múltiplos agentes em paralelo

Quebre por área (cada um pega 1 seção):

- Agente 1: §4.1 + §4.2 (Conteúdo Ebook + Diagnóstico)
- Agente 2: §4.3 + §4.4 (Templates + Forecast)
- Agente 3: §4.5 + §4.6 + §4.7 (Auth/Segurança + Visual/A11y + Cross-links)
- Agente 4: §4.8 + §4.9 + §5 (Compliance + Técnico + E2E)

Cada agente entrega seu pedaço; um agente final consolida.

---

## 1 · CONTEXTO DA PLATAFORMA

O **GTM BlackBox** é uma plataforma freemium open-source com 4 módulos integrados, construída pela SCIENT como porta de entrada para a Certificação GTM Engineer (`gtme.scient.cc`) e o GTM OS pago.

**Stack:** Next.js 14.2.35 (App Router) · TypeScript estrito · Tailwind com tokens SCIENT · Supabase (Auth + Postgres + RLS) · MDX via `next-mdx-remote/rsc` · Recharts (com `dynamic ssr:false`) · Sora + Lexend.

**Os 4 módulos:**

1. **Ebook · Metodologia** — 12 capítulos top-down a partir dos princípios do Edson Rigonatti.
2. **Diagnóstico · Maturidade** — wizard dos 5 pilares com radar, gargalo via TOC, roadmap, exportar.
3. **Templates · Implementação** — 8 templates implementáveis (T1-T8) com README + template + rubrica 0-3.
4. **Forecast · Capacity Planning** — calculadora multi-motion com verdict de capacity, hiring plan e scientific forecast.

**Os 5 pilares (taxonomia BlackBox):**

- P1 — Arquitetura de Dados (5 sub-camadas: Nomenclatura · Critérios · Originação · Centralização · Enriquecimento)
- P2 — Metodologia Unificada (frameworks de qualificação como SPICED entre opções, GTM Blueprint)
- P3 — Processos Padronizados (Playbooks M1-M8, Handbooks 2-3 páginas, TTFI)
- P4 — Stack Parametrizada (CRM: pipelines, validation rules, dashboards)
- P5 — Loop de Melhoria Contínua (MBR + TOC + Roadmap + Planos de Ação)

**Princípios mestres (do Edson Rigonatti, fundadores Astella):**

1. Produtividade humana é o núcleo
2. Velocidade compatível com tropa de elite (triple-triple-double-double-double)
3. Metabolismo 60/30/10
4. Foco 1×1×1×1 (1 persona × 1 produto × 1 fonte × 1 modal)
5. 4 modais de fechamento (No-touch, Low, Mid, High-touch, Canal)
6. 12 passos cognitivos da venda
7. Templetização da venda consultiva

**Frase âncora editorial:** "Workflows, decisões, colaterais. Aí você começa a automatizar. Depois usa IA. Não antes."

---

## 2 · ENTRADAS PARA A REVISÃO

### 2.1 Documentos canônicos (leitura obrigatória antes de auditar)

```
/Users/giovannisalvador/Desktop/GTMBLackBox/
├── PROMPT_CLAUDE_CODE.md                  # contrato original do projeto (3.000 linhas)
├── METODOLOGIA_SCIENT.md                  # síntese-mãe da metodologia
├── VERSAO_3_5_METODOLOGIA.md             # v3.5 canônica
├── Princípios_Edson Rigonatti...txt      # masterclass (princípios mestres)
└── gtm-blackbox/
    ├── docs/00-research/PROGRESS.md       # log de execução das 9 fases (gitignored)
    ├── docs/00-research/RESEARCH_LOG.md   # síntese da pesquisa (gitignored)
    ├── docs/01-decisions/0001..0013-*.md  # 13 ADRs com decisões fechadas
    ├── content/                           # conteúdo editorial
    └── src/                               # código TypeScript
```

### 2.2 Estrutura de pastas a auditar

```
gtm-blackbox/content/
├── ebook/                          # 12 capítulos .mdx
├── diagnostico/perguntas/          # 5 arquivos .md (~50 perguntas)
├── templates/                      # 8 pastas (24 arquivos .md no total)
└── forecast/                       # specs .md (não-renderizados ainda — só engine)

gtm-blackbox/src/
├── app/(marketing)/                # landing /
├── app/(auth)/                     # /login, /signup, /reset
├── app/(app)/                      # /hub, /ebook, /diagnostico, /templates, /forecast
├── app/auth/                       # /auth/callback, /auth/logout (route handlers)
├── components/                     # ebook, diagnostico, forecast, layout, ui
├── lib/                            # supabase, content, diagnostico, forecast
└── middleware.ts                   # auth guard

gtm-blackbox/supabase/migrations/
└── 20260427_001_init_schema.sql    # 6 tabelas + RLS + triggers
```

### 2.3 Comandos de validação rápida

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox

# Lint zero erros
npm run lint

# TypeScript estrito zero erros
npm run type-check

# Build production limpo
npm run build

# Pre-flight strings banidas (deve retornar zero)
grep -riE "Amicci|V4 Company|V4 Cohort|CRMBonus|Galileo|Plannera|Assertiva|Housi|Piwi|LigueLead|Octo|Magazord|Vick|ClickSign|Resultados Digitais|Omie|Matheus Pinheiro|Felipe Barreiros|Konstantine|R\$300M|R\$10M NewARR|R\$937" content/

# Dev server local
npm run dev
# → abre http://localhost:3000
```

---

## 3 · METODOLOGIA DE Q&A

### 3.1 Critérios de severidade

Toda finding deve ser classificada em uma das 4 severidades:

| Sev   | Nome       | Critério                                                                    | Tempo de fix     |
| ----- | ---------- | --------------------------------------------------------------------------- | ---------------- |
| 🔴 P0 | Bloqueante | Plataforma não funciona, dado vaza, login quebra, build falha               | Antes de testar  |
| 🟠 P1 | Crítico    | Fluxo principal degradado, conteúdo factualmente errado, compliance violado | Antes de deploy  |
| 🟡 P2 | Médio      | UX subóptimo, inconsistência visual, falta link cross-módulo                | Próxima iteração |
| 🟢 P3 | Baixo      | Polish, typo, sugestão de melhoria                                          | Backlog          |

**Regra dura:** se você está em dúvida entre P1 e P2, escolha P1. Melhor over-flag que ignorar.

### 3.2 Output esperado

Gere um arquivo `docs/04-qa/Q&A_REPORT_YYYY-MM-DD.md` com este formato:

```markdown
# Q&A Report — GTM BlackBox · {data}

## Sumário executivo

- Total findings: {N}
- P0 (bloqueantes): {N}
- P1 (críticos): {N}
- P2 (médio): {N}
- P3 (baixo): {N}
- Comandos validação: lint {ok/fail} · type-check {ok/fail} · build {ok/fail} · pre-flight {ok/fail}

## Findings por severidade

### 🔴 P0 — Bloqueantes (FIX antes de QUALQUER teste)

| #   | Área | Arquivo | Descrição | Repro |
| --- | ---- | ------- | --------- | ----- |
| 1   | ...  | ...     | ...       | ...   |

### 🟠 P1 — Críticos (FIX antes de deploy)

[mesmo formato]

### 🟡 P2 — Médio

[mesmo formato]

### 🟢 P3 — Baixo

[mesmo formato]

## Pontos fortes detectados

[lista do que está bom — não é só achar problema]

## Recomendações de priorização

[ordem sugerida para Giovanni atacar fixes]
```

### 3.3 Ordem de revisão

1. **Comandos de validação rápida** (§2.3) — se algum falha, vire P0 imediato.
2. **§4.5 Auth & Segurança** — mais crítico (vazamento de dado é game over).
3. **§4.8 Compliance** — strings banidas, anti-padrões editoriais (risco reputacional/legal).
4. **§4.1-4.4 Conteúdo + Funcional** — coração do produto.
5. **§4.6-4.7 Visual + Cross-links** — qualidade percebida.
6. **§4.9 Técnico** — lint, performance, bundle.
7. **§5 E2E scenarios** — confirmação de que o sistema funciona inteiro.

---

## 4 · CHECKLISTS POR ÁREA

### 4.1 CONTEÚDO EDITORIAL — Ebook (12 capítulos)

**Localização:** `content/ebook/01-*.mdx` até `content/ebook/12-*.mdx`

#### Tom e voz

- [ ] Cap 1 abre com posicionamento do Edson como mentor/parceiro/instrutor convidado da Certificação (NÃO como "moldura filosófica suprema").
- [ ] Voz do Giovanni absorvida: "menos FOMO", "10 anos desde 2015 Endeavor", "sempre tem uma camada extra", "Foco é uma restrição física, não escolha filosófica", "Workflows, decisões, colaterais. Depois IA. Não antes."
- [ ] Caps 2-12 mantêm tom mentor/advisor/parceiro (NÃO endeusamento, NÃO categórico).
- [ ] Citações do Edson têm atribuição "— Edson Rigonatti" SEM datas (ex: NÃO usar "abril/2026").
- [ ] "Princípios" são tratados como "Primeiros Princípios que inspiram", não dogma submisso.

#### Anti-padrões editoriais (regra dura — qualquer ocorrência = P1)

- [ ] **Sem** menções a "Winning by Design", "WbD", "Bowtie", "Jacco" em qualquer arquivo de `/content/`.
- [ ] **Sem** "Felipe Barreiros" (nome interno SCIENT) — substituir por menção genérica.
- [ ] **Sem** datas específicas de masterclass ("abril 2026") — só "— Edson Rigonatti" como atribuição.
- [ ] **IA não é protagonista nos Caps 1-10.** Menções pontuais a ferramentas IA-driven (Clay, Fathom) são OK desde que não-protagonistas.
- [ ] IA aparece como protagonista APENAS no Cap 11 (Componente AI-Native).
- [ ] Disclaimer SCIENT no rodapé de cada capítulo (renderizado pelo `[slug]/page.tsx`, não no MDX).

#### Estrutura editorial canônica (validar em cada capítulo)

| Cap | Título esperado                          | Pilar | Cap deve cobrir                                                                    |
| --- | ---------------------------------------- | ----- | ---------------------------------------------------------------------------------- |
| 01  | Princípios — moldura antes da engenharia | —     | 7 princípios + frase âncora IA                                                     |
| 02  | Do princípio à engenharia                | —     | Mapa princípio → pilar; descida rastreável                                         |
| 03  | Pilar 1 — Arquitetura de Dados           | P1    | 5 sub-camadas + ICS + gates de saída                                               |
| 04  | Pilar 2 — Metodologia Unificada          | P2    | Frameworks · GTM Blueprint · ROI 6 fases                                           |
| 05  | Pilar 3 — Processos Padronizados         | P3    | Playbooks M1-M8 · Handbooks 2-3p · TTFI                                            |
| 06  | Pilar 4 — Stack Parametrizada            | P4    | 7 áreas (pipelines, etapas, campos, picklists, workflows, dashboards, integrações) |
| 07  | Pilar 5 — Loop de Melhoria Contínua      | P5    | MBR · TOC · Pensamento Lógico · Roadmap                                            |
| 08  | Modais de GTM e GTM-fit                  | —     | 4 motions com economia separada                                                    |
| 09  | Jornada ARMV/ARPE/ARE                    | —     | Diagnóstico de estágio + sinais de saída                                           |
| 10  | TOC e MBR                                | —     | 5 Focusing Steps + pauta canônica 90min                                            |
| 11  | Componente AI-Native                     | —     | 7 agentes canônicos + cálculo de ROI por agente                                    |
| 12  | Foundational RevOps                      | —     | Diagnóstico do estado: Foundational em pé?                                         |

#### Decisões canônicas a verificar (§1.7.2 do prompt master original)

- [ ] **ROI Framework: 6 fases** (Discovery / Diagnosis / Proposal / Onboarding / Verification / Expansion). NÃO 5, NÃO 7. Aplicado no Cap 4 e 8.
- [ ] **Funil M1-M8:** Account · MQA · SQL · SAL · Contrato · Ativo · Adoção · Expansão.
- [ ] **4 modais Edson:** No-touch · Low-touch · Mid-touch · High-touch · Canal (5 contando Canal — verificar consistência).
- [ ] **Fórmula CS:** se aparecer, deve ser `CS = EC + RC × t` (soma, não multiplicação).
- [ ] **SPICED:** mencionado APENAS como uma opção entre 6 frameworks (Cap 4). Sem rodapé "WbD", sem citação "Jacco".

#### Frontmatter (validar em cada .mdx)

```yaml
---
title: '...'
slug: '...'
order: 1-12
estimatedReadingMinutes: 10-25
lastUpdated: 'YYYY-MM-DD'
pillar: '...'
status: 'published'
---
```

Schema validado por `src/lib/content/readEbook.ts` via Zod. Frontmatter inválido → capítulo não renderiza.

#### Cross-links no ebook

- [ ] Cada Pilar (Cap 3-7) menciona o template aplicável (T1-T8) por nome ou número.
- [ ] CalloutCertificacao aparece no fim dos Caps 1, 3, 7, 11 + 1 outro = **5 contextos diferentes**.
- [ ] Citações bibliográficas válidas em pelo menos 3 caps: ICONIQ, Mark Roberge, Geoffrey Moore, Lincoln Murphy, Eli Goldratt, Pavilion.

---

### 4.2 DIAGNÓSTICO

**Localização:** `src/app/(app)/diagnostico/` + `src/lib/diagnostico/` + `content/diagnostico/perguntas/`

#### Estrutura técnica

- [ ] 5 arquivos de perguntas em `content/diagnostico/perguntas/pilar-{1..5}-*.md` parseados via Zod (`readPerguntas.ts`).
- [ ] Frontmatter de cada pergunta tem: `id` (estável), `pilar` (1-5), `subcamada` (apenas P1), `estagioMinimo` (ARMV/ARPE/ARE), `texto`, `hint?`.
- [ ] **IDs estáveis** — verificar que mudar texto de pergunta NÃO muda ID.
- [ ] `getPerguntasParaEstagio('ARMV')` retorna apenas perguntas ARMV. Para ARPE retorna ARMV+ARPE. Para ARE retorna todas.

#### Re-bucketing das perguntas (verificar coerência semântica)

O módulo legado tinha 7 pilares. Foi re-bucketed para 5. Auditar:

- [ ] P1 BlackBox (Arquitetura de Dados) absorveu perguntas do P3 v3.5 (Dados) — coerente.
- [ ] P2 BlackBox (Metodologia Unificada) absorveu P1 v3.5 (Estratégia) + P2 v3.5 (Clientes) — coerente?
- [ ] P3 BlackBox (Processos Padronizados) absorveu P4 v3.5 (Processos) — coerente.
- [ ] P4 BlackBox (Stack Parametrizada) — perguntas focadas em CRM, pipelines, dashboards. Coerente?
- [ ] P5 BlackBox (Loop de Melhoria Contínua) absorveu P5 v3.5 (Metas) + P7 v3.5 (Gestão) — coerente.
- [ ] Perguntas sobre Capacity Planning / Forecast NÃO estão no diagnóstico (ficam no Módulo 4).

#### Engine TOC (`src/lib/diagnostico/scoring.ts`)

- [ ] `calcularNiveis()` retorna níveis 0-3 por pilar. Mapeamento: <25% = 0, 25-55% = 1, 55-85% = 2, ≥85% = 3.
- [ ] `identificarGargalo()` retorna o pilar com **menor nível** (em empate, prioridade fundacional P1>P2>P3>P4>P5).
- [ ] `avaliarReadiness()` retorna `aiReady` apenas se P1 e P3 ≥ 2 e P2 ≥ 1.
- [ ] Sub-camadas P1 (Nomenclatura, Critérios, Originação, Centralização, Enriquecimento) calculadas separadamente.

#### Roadmap Engine (`src/lib/diagnostico/roadmap-engine.ts`)

- [ ] Gera **3 ações no gargalo** (Sprints 1-3) + **2 ações nos próximos 2 pilares mais fracos** (Sprint 4) = 5 itens total.
- [ ] Cada ação tem `templateSlug` + `chapterSlug` válidos (linkam para template e capítulo existentes).
- [ ] `gateOutput` declarado em cada ação.
- [ ] Esforço (baixo/médio/alto) coerente com o tipo de ação.

#### Fluxo end-to-end

- [ ] `/diagnostico` mostra status (onboarding feito? wizard feito? quantos % concluído?).
- [ ] `/diagnostico/onboarding` — form com nome, empresa, faturamento (ARMV/ARPE/ARE) — obrigatório antes do wizard.
- [ ] `/diagnostico/wizard` — apresenta perguntas agrupadas por pilar; autosave em `wizard_sessions`.
- [ ] `/diagnostico/resultado` — RadarChart + GargaloBanner + ReadyBadges + detalhamento.
- [ ] `/diagnostico/roadmap` — 5 cards organizados por sprint, com cross-links.
- [ ] `/diagnostico/exportar` — TXT + Prompt Claude com botões copy/download.

#### Output do prompt Claude (auditar formato)

- [ ] Prompt gerado tem placeholder claro `[USUÁRIO PREENCHE]` para cor, fonte, logo.
- [ ] Inclui dados específicos: nome, empresa, estágio, % maturidade, gargalo nomeado.
- [ ] Solicita 6 seções: capa · radar · gargalo · 90 dias · métricas de saída · footer.
- [ ] Output esperado: HTML inline-CSS auto-contido.

---

### 4.3 TEMPLATES (T1-T8)

**Localização:** `content/templates/` + `src/app/(app)/templates/` + `src/lib/content/readTemplates.ts`

#### Estrutura por template (cada uma das 8 pastas)

- [ ] `README.md` com frontmatter completo: title, slug, pilar, number, estagioMinimo, duracaoImplementacao, outputEsperado, preRequisitos, lastUpdated.
- [ ] `template.md` com a estrutura preenchível (tabelas, exemplos, blocos).
- [ ] `rubrica-implementacao.md` com rubrica 0-3 em 4-5 dimensões.
- [ ] Frontmatter parseado por Zod sem erro.

#### Coerência cross-template

- [ ] Pilar declarado bate com o pilar real (T1=P1, T2=P2, T3=P3, T8=P4, T4-T7=P5).
- [ ] `preRequisitos` coerentes (T2 depende de T1; T3 depende de T1+T2; T5/T6/T7/T8 dependem das outras).
- [ ] Rubrica 0-3 em todos os 8 templates segue o mesmo padrão (4-5 dimensões com pesos somando 100%).

#### Conteúdo dos templates (auditar substantividade)

- [ ] **T1 Arquitetura de Dados** — cobre 5 sub-camadas com tabelas de Field Architecture, Event Instrumentation, Ownership Map, Validation Rules, Gates.
- [ ] **T2 Workflow GTM** — 12 momentos cognitivos × 3 swim-lanes (Mkt/Vendas/CS).
- [ ] **T3 Handbook 2-3p** — estrutura P1 (KPI+DoD), P2 (cadência+handoffs), P3 (FAQ).
- [ ] **T4 Roadmap GTM** — formato Now/Next/Later com card padrão.
- [ ] **T5 MBR** — pauta canônica 90min com 8 blocos.
- [ ] **T6 Identificação de Gargalos** — 5 Focusing Steps de Goldratt + cálculo de custo do gap.
- [ ] **T7 Planos de Ação** — formato canônico (hipótese, owner, prazo, métrica, custo, trade-off).
- [ ] **T8 Parametrização de Stack** — 7 áreas (pipelines, etapas, campos, picklists, workflows, dashboards, integrações).

#### Páginas

- [ ] `/templates` — catálogo grid 2 colunas, 8 cards, link para detalhe.
- [ ] `/templates/[slug]` — renderiza README + template + rubrica via MDXRemote.
- [ ] `generateStaticParams` — todos os 8 prerendered no build.
- [ ] Cross-links: cada template linka para capítulo do ebook + diagnóstico.

---

### 4.4 FORECAST MULTI-MOTION

**Localização:** `src/lib/forecast/` + `src/app/(app)/forecast/`

#### Engine — `src/lib/forecast/relacoes-matematicas.ts`

- [ ] `calcularPorMotion()` calcula `accountsNecessarios → mqasNecessarios → sqlsNecessarios → salsNecessarios → dealsNecessariosMotion` corretamente via cascata reversa do funil.
- [ ] `dealsNecessariosMotion = arrMetaPorMotion / acvBrl`.
- [ ] `salsNecessarios = dealsNecessariosMotion / (winRate / 100)`.
- [ ] `sdrsNecessarios = sqlsNecessarios / 12 / sdrsCapacityPorMes` (anualiza).
- [ ] `aesNecessarios = dealsNecessariosMotion / 12 / aesDealsPorMes` (anualiza).

#### Validation Warnings — `src/lib/forecast/input-validators.ts`

- [ ] Win Rate >40% dispara warning ('warn') sobre conservadorismo.
- [ ] Win Rate <10% dispara warning sobre pipeline mal qualificado.
- [ ] GRR <80% dispara 'critical' sobre retenção.
- [ ] NRR <100% dispara warning sobre encolhimento da base.
- [ ] Soma dos `pctArr` ≠ 100% dispara 'critical'.
- [ ] ACV/cycle/capacity fora da banda do motion declarado dispara 'info' ou 'warn'.

#### Verdict Engine — `src/lib/forecast/verdict-engine.ts`

- [ ] `<60%` capacity = `critico` 🔴
- [ ] `60-79%` = `falta` 🟠
- [ ] `80-110%` = `ok` 🟢
- [ ] `>110%` = `sobra` 🟡
- [ ] Mensagem coerente com o status.

#### Hiring Engine — `src/lib/forecast/hiring-engine.ts`

- [ ] `capacityNoMes()` retorna 0 se mês_atual < mês_contratacao.
- [ ] Curva linear: 0.1 no mês 1, 1.0 no mês `rampMeses`.
- [ ] `buildHiringPlan()` retorna `viavel: false` se algum `mesContratacao < 1` (contratação retroativa impossível).
- [ ] Quando inviável, retorna `alternativasSeInviavel` com 4 opções (revisar meta, transferir senior, consultoria, aceitar gap).

#### Scientific Forecast — `src/lib/forecast/scientific-forecast.ts`

- [ ] Gera `horizonMeses` linhas (default 12).
- [ ] BoP MRR do mês N = EoP MRR do mês N-1.
- [ ] `eopMrr = bopMrr - churnMrr + expansionMrr + newLogoMrr`.
- [ ] `pipelineCoverage = newLogoMrr × 12 × pipelineCoverageTarget`.

#### Benchmarks por motion — `src/lib/forecast/benchmarks-por-motion.ts`

- [ ] 5 motions com bands canônicas: SQLs/SDR/mês, deals/AE/mês, contas/CSM, TTFI, ciclo, ACV.
- [ ] Valores coerentes com Pavilion / ICONIQ:
  - High-touch: 15-25 SQLs/SDR · 1-3 deals/AE · ≤25 contas/CSM
  - Mid-touch: 30-50 · 4-8 · ≤50
  - Low-touch: 60-100 · 8-15 · ≤200
  - No-touch: N/A · N/A · ≤500

#### Wizard

- [ ] Permite adicionar até 5 motions (1 inicial + 4 extras).
- [ ] Permite remover motion (mínimo 1).
- [ ] Defaults realistas por motion mudam quando se troca o `<select>`.
- [ ] Pode submeter com 1 motion (single) OU múltiplos.

#### Resultado

- [ ] Verdict textual no topo.
- [ ] Avisos coloridos (vermelho/laranja/cinza) por severidade.
- [ ] Capacity verdicts em cards coloridos por status.
- [ ] Hiring plan com flag verde (viável) ou vermelho (inviável + alternativas).
- [ ] Métricas por função (Marketing/Pré/Vendas/CS).
- [ ] Tabela Scientific Forecast 12 meses (BoP, New Logo, Expansion, Churn, EoP, Pipeline).

---

### 4.5 AUTH & SEGURANÇA

**Localização:** `src/lib/supabase/` + `src/middleware.ts` + `src/app/(auth)/` + `supabase/migrations/`

#### Variáveis de ambiente

- [ ] `.env.local` existe e está em `.gitignore` (verificar `git status .env.local` → "nothing to commit").
- [ ] `NEXT_PUBLIC_SUPABASE_URL` declarado.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` declarado (publishable key — safe para client).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` declarado (secret key — server-only).

#### Crítico — Service Role NUNCA no client

- [ ] `grep -r "SUPABASE_SERVICE_ROLE_KEY" src/` deve retornar resultados APENAS em arquivos server (route handlers, server actions, lib/supabase/server.ts).
- [ ] **Nenhum** arquivo `'use client'` referencia `SUPABASE_SERVICE_ROLE_KEY`.

#### RLS (Row Level Security)

- [ ] Migration declara `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` para todas as 6 tabelas (profiles, diagnosticos, checklist_respostas, roadmap_itens, wizard_sessions, forecast_sessions).
- [ ] Policies criadas com `auth.uid() = user_id` (ou `auth.uid() = id` para profiles).
- [ ] `profiles` tem 3 policies: SELECT, UPDATE, INSERT (todas com `auth.uid() = id`).

#### Trigger handle_new_user

- [ ] Function tem `SECURITY DEFINER` + `SET search_path = public` (best practice).
- [ ] Trigger `on_auth_user_created` dispara AFTER INSERT em `auth.users`.
- [ ] `ON CONFLICT (id) DO NOTHING` previne erro se profile já existe.

#### Middleware

- [ ] Protege `/hub`, `/ebook`, `/diagnostico`, `/templates`, `/forecast` (redireciona não-logados para `/login?next=...`).
- [ ] Bloqueia `/login`, `/signup`, `/reset` para usuários já logados (redireciona para `/hub`).
- [ ] `getUser()` (não `getSession()`) revalida sessão server-side.

#### Server Actions (login, signup, reset, onboarding, wizard, forecast)

- [ ] Validation com Zod em todas as actions.
- [ ] Erros retornados como `{ error: string }`, não throw.
- [ ] Não logam dados sensíveis em produção (`process.env.NODE_ENV === 'development'` guards).
- [ ] `revalidatePath` chamado após mutations relevantes.

#### Auth callback (`/auth/callback`)

- [ ] `exchangeCodeForSession(code)` chamado.
- [ ] Falha redireciona para `/login?error=callback_failed`.

#### Logout (`/auth/logout`)

- [ ] **Apenas POST** (não GET — previne CSRF via link malicioso).
- [ ] Form usa `method="POST"`.

---

### 4.6 VISUAL & ACESSIBILIDADE (A11y)

#### Tokens SCIENT (`tailwind.config.ts`)

- [ ] Cor primária `#0030E8` aplicada em CTAs principais.
- [ ] Sidebar dark `#111111`.
- [ ] Accent verde `#40E0A8` em status positivo.
- [ ] Gray `#585858` em texto secundário.
- [ ] Divider `#E6E6E6` em borders.
- [ ] Background `#F5F5F7`.
- [ ] Fontes Sora (corpo) + Lexend (logo, headlines) carregadas via `next/font/google`.

#### Sidebar (Cap 2)

- [ ] Sticky no scroll (não move com scroll do conteúdo).
- [ ] Active state em `bg-scient-primary text-white` no item correspondente à rota atual.
- [ ] Badge user com inicial + nome + email.
- [ ] CTA Certificação visível, link para `gtme.scient.cc`.
- [ ] Logout via POST (não GET).

#### Mobile (md breakpoint)

- [ ] Sidebar some abaixo de `md:` (768px).
- [ ] Hamburger button aparece no header mobile.
- [ ] Drawer off-canvas funciona (overlay + close button).
- [ ] Click fora do drawer fecha.
- [ ] Esc fecha o drawer (idealmente).

#### RadarChart (Recharts)

- [ ] Renderizado via `dynamic(import, { ssr: false })` (verificar em RadarMaturidade.tsx).
- [ ] Table fallback `sr-only` para screen readers (com caption + thead + tbody + scope).

#### Acessibilidade WCAG 2.1 AA

- [ ] Contraste de texto ≥ 4.5:1 (cinza `#585858` em branco passa; verificar em backgrounds dark).
- [ ] Todos os `<button>` têm texto OU `aria-label`.
- [ ] Forms têm `<label>` associado a cada input (`htmlFor` ou wrap).
- [ ] Cores não são o único sinal (status sempre acompanha texto/ícone).
- [ ] Focus visible em todos os interactivos.
- [ ] HTML semântico (`<main>`, `<nav>`, `<header>`, `<article>`, `<section>`).
- [ ] `lang="pt-BR"` no `<html>`.

#### Lighthouse a11y target

- [ ] Score >90 em `/`, `/login`, `/hub`, `/ebook`, `/diagnostico/resultado`, `/forecast/resultado`.

---

### 4.7 CROSS-LINKS — coerência entre módulos

#### Hub (`/hub`)

- [ ] 4 ModuleCards apontam para `/ebook`, `/diagnostico`, `/templates`, `/forecast`.
- [ ] Status correto por usuário (concluído / em construção / não iniciado).

#### Sidebar

- [ ] 5 nav items: Hub, Ebook, Diagnóstico, Templates, Forecast.
- [ ] Active state quando rota corresponde.

#### Diagnóstico → outros módulos

- [ ] Cards do roadmap (`RoadmapCard`) linkam para `/templates/{templateSlug}` e `/ebook/{chapterSlug}` correspondentes.
- [ ] Slugs são válidos (existem como pages).

#### Templates → outros módulos

- [ ] Footer da página de detalhe do template linka para `/ebook/{capítulo correspondente}` e `/diagnostico`.

#### Ebook → outros módulos

- [ ] Pelo menos 5 ocorrências de `<CalloutCertificacao />` nos 12 capítulos com `chapter` prop variando (default, principios-edson, pilar-1, pilar-5, componente-ai-native).
- [ ] Cada Pilar (Cap 3-7) menciona "Templates aplicáveis: T{X}" no fim.

#### Forecast → outros módulos

- [ ] Resultado linka para `/diagnostico` (sugere fazer diagnóstico para entender contexto).
- [ ] Forecast e Diagnóstico dependem ambos de `profile.faturamento_atual` (onboarding compartilhado).

#### Landing pública (`/`)

- [ ] Hero com 2 CTAs: signup + login.
- [ ] 4 módulos com descrição.
- [ ] 4 princípios do Edson em destaque.
- [ ] CTA Certificação para `gtme.scient.cc`.
- [ ] Footer com link GitHub.

---

### 4.8 COMPLIANCE & ANTI-PADRÕES

#### Pre-flight strings banidas (`/content/`)

Comando:

```bash
grep -riE "Amicci|V4 Company|V4 Cohort|CRMBonus|Galileo|Plannera|Assertiva|Housi|Piwi|LigueLead|Octo|Magazord|Vick|ClickSign|Resultados Digitais|Omie|Matheus Pinheiro|Felipe Barreiros|Konstantine|R\$300M|R\$10M NewARR|R\$937" content/
```

- [ ] Output: zero matches.

#### Permitido em `/content/` (NÃO bloquear)

- Nomes de autores externos: Edson Rigonatti, Mark Roberge, Geoffrey Moore, Lincoln Murphy, Eli Goldratt, Henry Schuck, Jared Brickman, Alexa Grabell.
- Nomes de empresas/ferramentas: ICONIQ, Pavilion, ZoomInfo, Apollo, Clay, Clearbit, Cnae.io, Gong, Chorus, Avoma.
- Cases anonimizados: "uma rede de franquias com 4.400 unidades", "uma fintech B2B em ARPE", "uma operação de comissões com R$1B+ ARR".

#### Anti-padrões editoriais

- [ ] **Sem** Winning by Design / WbD / Bowtie / Jacco em `/content/`.
- [ ] **Sem** transcrição literal do Edson (deve estar em prosa limpa).
- [ ] **Sem** mais de 1 CTA visível por viewport (regra: 1 CTA por scroll).
- [ ] **Sem** CTAs intrusivos antes do leitor terminar o capítulo.

#### Diferenciação SCIENT

- [ ] Renomeações canônicas aplicadas (ver §3.1 do prompt master original):
  - "Modelo de Dados" → "Arquitetura de Dados" ✓
  - "Bowtie" / "Ampulheta" → "Funil M1-M8" ou "Jornada GTM" ✓
  - "GTM Motion" → "Modais de GTM" ✓
  - "Modelo Operacional" → "Metodologia Unificada" ✓

#### LGPD / GDPR (preparação básica)

- [ ] Footer/landing menciona política de privacidade (ou link, mesmo que TBD).
- [ ] Email transacional declarado: o usuário aceita receber emails operacionais (signup, reset).
- [ ] Sem newsletter sem opt-in explícito (já textualmente declarado no signup).

---

### 4.9 TÉCNICO

#### Build & Lint

- [ ] `npm run lint` retorna zero warnings.
- [ ] `npm run type-check` retorna zero erros.
- [ ] `npm run build` compila sem warnings críticos.
- [ ] Build gera 32+ rotas (12 caps + 8 templates + 5 diagnostico + 4 forecast + auth + landing).

#### TypeScript estrito

- [ ] `tsconfig.json` tem `"strict": true`.
- [ ] **Nenhum** `any` no código (`grep -r ": any" src/` deve retornar zero — exceto em comentários ou tipagem de libs).
- [ ] **Nenhum** `@ts-ignore` exceto em comentários ou tipagem de libs.
- [ ] `target: "ES2020"` para suportar `for...of` em iterators (Maps, FormData).

#### Performance

- [ ] First Load JS shared: ~87 kB.
- [ ] Páginas individuais: <100 kB First Load JS.
- [ ] Middleware: ~80 kB (auth com Supabase).
- [ ] Imagens via `next/image` se houver (atualmente sem imagens grandes).
- [ ] Fontes carregadas com `display: 'swap'`.

#### Server vs Client components

- [ ] Pages sob `(app)/` que usam `createClient()` do server são server components (sem `'use client'`).
- [ ] Componentes interativos (forms, RadarChart) marcados `'use client'`.
- [ ] `RadarMaturidade` usa `dynamic()` para Recharts com `ssr: false`.

#### MDX

- [ ] Compilação via `next-mdx-remote/rsc` (NÃO `@next/mdx`).
- [ ] `generateStaticParams` em rotas dinâmicas (`[slug]`) gera todas as páginas em build time.
- [ ] `mdx-components.tsx` (em `MdxComponents.tsx`) com tipografia SCIENT customizada.

#### Husky + Pre-commit

- [ ] `.husky/pre-commit` existe e é executável.
- [ ] Hook valida `git rev-parse --show-toplevel` termina em `/gtm-blackbox`.
- [ ] Hook roda grep de strings banidas em `content/`.
- [ ] Hook roda `lint-staged` (ESLint + Prettier).

#### Git status

- [ ] `git rev-parse --show-toplevel` retorna `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox` (NÃO o diretório pai).
- [ ] **Nenhum** `.git` no diretório pai `/Users/giovannisalvador/Desktop/GTMBLackBox/`.
- [ ] `.env.local` em `.gitignore`.
- [ ] `docs/00-research/` em `.gitignore`.

---

## 5 · CASOS DE TESTE END-TO-END (E2E)

### 5.1 Fluxo: signup → diagnóstico → roadmap → exportar

```
1. Acesse http://localhost:3000/
2. Click "Acessar grátis" → /signup
3. Preencha nome, email (use seu+test1@scient.cc para evitar rate limit), senha 8+ chars
4. Submit → deve ir direto pro /hub (email confirmation off em dev)
5. Verifique: 4 ModuleCards, sidebar dark, badge com sua inicial
6. Click "Diagnóstico" → /diagnostico → "Onboarding"
7. Preencha empresa, faturamento (escolha "R$20M-200M" para ver perguntas ARMV+ARPE)
8. Submit → /diagnostico/wizard
9. Verifique: 5 sections (uma por pilar) com perguntas agrupadas
10. Responda mistura de Sim/Parcial/Não em todas
11. Verifique progresso atualizando + autosave (recarregue página, respostas mantidas)
12. Click "Finalizar e ver resultado" → /diagnostico/resultado
13. Verifique: RadarChart renderiza · Maturidade % · Banner gargalo · Detalhamento por pilar
14. Click "Ver Roadmap" → /diagnostico/roadmap
15. Verifique: 5 cards organizados por sprint (3 no gargalo, 2 fora) com cross-links
16. Click em "Capítulo do ebook" de um card → abre /ebook/{slug} correspondente
17. Volte e clique "Template aplicável" → abre /templates/{slug} correspondente
18. Volte para /diagnostico/roadmap → "Exportar TXT + Prompt Claude"
19. Verifique: 2 sections (TXT + Prompt) com botões "Copiar" e "Download .txt"
20. Click "Copiar" no TXT → cole em editor de texto → confirme conteúdo válido
21. Click "Copiar" no Prompt → cole em Claude.ai → veja se gera HTML válido
```

**Critério de sucesso:** todos os passos executam sem erro 500, sem console.error, sem dados perdidos.

### 5.2 Fluxo: forecast multi-motion (cenário inviável)

```
1. (logado) Click "Forecast" na sidebar → /forecast
2. Verifique: gateway com 3 steps (onboarding ✓ se já feito · calcular · resultado)
3. Click "Iniciar" → /forecast/wizard
4. Preencha:
   - ARR atual: 5000000 (R$5M)
   - ARR meta: 30000000 (R$30M — meta agressiva 6x)
   - Horizonte: 12 meses
5. Adicione 2 motions:
   - Motion 1: high_touch, ACV 300000, ciclo 120, pctArr 70
   - Motion 2: low_touch, ACV 25000, ciclo 21, pctArr 30
6. Capacity atual baixo: 1 SDR, 2 AEs, 1 CSM em cada motion
7. Funil: defaults
8. Marketing: defaults
9. Constantes: defaults
10. Click "Calcular" → /forecast/resultado
11. Verifique:
    - Verdict textual indica plano provavelmente inviável
    - Capacity verdicts mostram cards 🔴 (crítico) e 🟠 (falta)
    - Hiring plan: 🔴 INVIÁVEL com lista de bloqueantes + 4 alternativas
    - Métricas por função coerentes
    - Scientific Forecast: 12 linhas com BoP/EoP MRR
12. Click "Exportar" → veja TXT + prompt Claude com info correta
```

**Critério de sucesso:** flag `viavel: false` aparece, alternativas listadas, sem crash.

### 5.3 Fluxo: forecast multi-motion (cenário viável)

```
1. /forecast/wizard
2. ARR atual: 20000000 (R$20M); meta: 30000000 (R$30M — 50% growth)
3. 1 motion: mid_touch, ACV 100000, pctArr 100
4. Capacity OK: 4 SDRs cap 40, 6 AEs deals 6, 5 CSMs contas 50
5. Funil padrão
6. Calcular
7. Verifique: verdict 🟢 ou 🟡, hiring plan viável (vazio ou com 1-2 contratações).
```

### 5.4 Fluxo: navegação ebook + sticky sidebar

```
1. /ebook
2. Click no Cap 1 → /ebook/01-principios-edson-rigonatti
3. Verifique: ChapterNav à esquerda lista todos os 12 capítulos
4. Scroll a página até o footer
5. Verifique: ChapterNav permanece sticky (não move com scroll)
6. ProgressBar no topo cresce conforme rola
7. Click outro capítulo na sidebar → muda para o novo cap, sidebar permanece
8. Mobile: sidebar some, hamburger aparece, drawer abre/fecha corretamente
```

### 5.5 Fluxo: auth guard

```
1. Logout (botão "Sair" na sidebar)
2. Tente acessar /hub → deve redirecionar para /login?next=/hub
3. Tente acessar /diagnostico → /login?next=/diagnostico
4. Tente /ebook → /login?next=/ebook
5. Login → deve voltar para a URL `next` original
6. Logado, tente acessar /login → deve redirecionar para /hub (auth-only block)
```

### 5.6 Fluxo: RLS isolation (precisa de 2 contas)

```
1. Crie user A (email_a@scient.cc), faça diagnóstico, salve
2. Logout
3. Crie user B (email_b@scient.cc, +test prefix)
4. (logado como B) Acesse /diagnostico — deve mostrar status "não iniciado", NÃO os dados de A
5. Console do browser: tente fetch direto para Supabase REST com anon key tentando buscar diagnostico de A (precisa do user_id de A)
   - Esperado: retorno [] (RLS bloqueia)
```

---

## 6 · OUTPUT — formato esperado

Gere `docs/04-qa/Q&A_REPORT_2026-04-27.md` (ou data atual) com:

### 6.1 Cabeçalho

```markdown
# Q&A Report — GTM BlackBox · 2026-04-27

**Auditor:** {nome do agente ou Giovanni}
**Tempo de auditoria:** {Xh}
**Versão da plataforma:** v0.1 (sessão noturna 2026-04-26)
**Comandos de validação:**

- npm run lint: {ok/fail}
- npm run type-check: {ok/fail}
- npm run build: {ok/fail}
- pre-flight strings banidas: {ok/fail}
```

### 6.2 Sumário executivo

- Total findings por severidade (P0/P1/P2/P3)
- Verdict geral: 🟢 pronto para testes manuais · 🟡 pequenos fixes antes · 🔴 fixes críticos antes

### 6.3 Findings detalhadas

Por severidade, em tabela:

```markdown
| #   | Área | Arquivo | Linha | Descrição | Sugestão de fix | Esforço |
| --- | ---- | ------- | ----- | --------- | --------------- | ------- |
```

### 6.4 Pontos fortes detectados

Liste o que está bom — útil para Giovanni saber o que NÃO mexer.

### 6.5 Roteiro de fix priorizado

Ordem para Giovanni atacar:

1. Todos os P0 (bloqueantes)
2. P1s do mesmo arquivo (reduz context switching)
3. P1s mais visíveis (afeta primeiro contato do usuário)
4. P2s agrupados por área
5. P3s vão para backlog

---

## 7 · PRÓXIMOS PASSOS APÓS Q&A

Após o report estar pronto:

### 7.1 Fix loop (Claude Code)

1. Giovanni abre nova sessão Claude Code com `/gtm-blackbox/`.
2. Cola o report como input.
3. Pede: "fix os P0 e P1 do report, na ordem priorizada".
4. Após cada fix, smoke test (`npm run lint && npm run build && grep pre-flight`).
5. Cada P0/P1 fixado vira commit local.

### 7.2 Testes manuais (Giovanni)

1. Após P0+P1 fixados, Giovanni roda `npm run dev`.
2. Executa os 6 cenários E2E (§5).
3. Reporta issues novas em `docs/04-qa/MANUAL_TEST_FINDINGS.md`.

### 7.3 Decisão de deploy

- ✅ Se zero P0 + ≤3 P1 + manuais OK → DEPLOY (seguir `DEPLOY.md`).
- ⚠️ Se P1+ não-resolvidos → mais 1 ciclo de fix.
- 🔴 Se P0 não-resolvido → não deploy.

---

## 8 · NOTAS PARA O AGENTE Q&A

### 8.1 Espírito da auditoria

Este Q&A é **rigoroso, mas justo**. O objetivo NÃO é encontrar problema em tudo — é identificar **o que realmente bloqueia ou degrada** a primeira experiência do usuário.

- ✅ Flag itens objetivamente errados (typo factual, regex inválido, link quebrado, dado vazado).
- ✅ Flag itens visualmente inconsistentes (cor errada, sidebar não-sticky, mobile quebrado).
- ✅ Flag anti-padrões editoriais (WbD, IA-protagonista cedo, datas em citações).
- ❌ NÃO flag escolhas estilísticas legítimas como "bug" (use P3 sugestão).
- ❌ NÃO flag itens que são "Phase 2" declarada (ex: i18n EN, telemetria PostHog — ADR 0004 e 0005 declaram fora-de-escopo v1).

### 8.2 Quando estiver em dúvida

- **Conteúdo:** consulte `docs/01-decisions/0008-canonical-sources.md` para hierarquia de fontes.
- **Tom editorial:** consulte `docs/01-decisions/0009-principles-centric-tone.md`.
- **Decisões fechadas:** §1.7.2 do `PROMPT_CLAUDE_CODE.md` (na pasta pai).
- **Anti-padrões:** §1.10 do prompt master + §3.1-3.4 (renomeações WbD).

### 8.3 Fora-de-escopo (NÃO flag como problema)

- i18n EN — ADR 0004 declara PT-BR only em v1.
- Telemetria PostHog — ADR 0005 declara deferida para v2.
- `gtm-brain.ts` ausente — ADR 0013 declara deferido para v2.
- Health Score CS detalhado (8 dimensões V4) — ADR documentado, schema v1 só tem `cs_health_proxy DECIMAL`.
- Mobile native PWA — README declara fora-de-escopo.
- Multi-tenant / orgs / roles — README declara fora-de-escopo.

### 8.4 Como tratar findings sobre conteúdo dos capítulos

Os Caps 2-12 do ebook foram escritos em **sessão noturna autônoma sem revisão prévia do Giovanni**. Tom seguiu o padrão do Cap 1 aprovado.

**Esperado:** ajustes pontuais de tom/estrutura em capítulos específicos. Isto é P2 (médio), não P0/P1.

**Excepão:** se um capítulo violar regra dura (WbD/IA-protagonista cedo/data em citação), aí vira P1.

---

## 9 · CHECKLIST FINAL DA AUDITORIA

Antes de fechar o report, valide:

- [ ] Comandos de validação rápida (§2.3) executados e resultados anotados.
- [ ] Cada uma das 9 seções (§4.1-§4.9) percorrida.
- [ ] Pelo menos 3 cenários E2E (§5) testados.
- [ ] Findings categorizadas em P0/P1/P2/P3.
- [ ] Pelo menos 5 pontos fortes detectados (NÃO seja só negativo).
- [ ] Roteiro de fix priorizado.
- [ ] Verdict claro no sumário: 🟢/🟡/🔴.

---

**Bom Q&A.** Lembre-se: o objetivo final é o Giovanni começar testes manuais com confiança de que os bloqueantes já foram resolvidos.
