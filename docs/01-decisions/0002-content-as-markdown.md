# ADR 0002 — Content as Markdown

**Status:** Accepted · 2026-04-26

## Context

O projeto é open-source friendly: contribuições devem ser via PR no Markdown, não em código React. O conteúdo do ebook (12 capítulos), perguntas do diagnóstico, templates (8 pastas) e textos do forecast precisam ser editáveis sem que o contribuidor saiba TS/React.

## Decision

**Toda copy editável vive em `/content/`**, organizada por módulo:

- `/content/ebook/*.mdx` — 12 capítulos com frontmatter (`title`, `slug`, `order`, `estimatedReadingMinutes`, `lastUpdated`)
- `/content/diagnostico/perguntas/*.md` — perguntas com YAML frontmatter (id estável, pilar, subcamada, estagio)
- `/content/diagnostico/interpretacoes/*.md` — feedback por nível
- `/content/templates/{NN-slug}/{template,rubrica-implementacao}.md` — templates + rubricas
- `/content/forecast/{inputs,outputs,relacoes-matematicas,constantes-mercado}.md`

**Frontend renderiza via MDX** (`next-mdx-remote/rsc`) em build time.

## Consequences

- IDs de pergunta DEVEM ser estáveis no frontmatter (§1.8 #5) — editar texto não muda ID
- Documentar regra em `CONTRIBUTING.md`
- Capítulos compilados em build time evitam runtime parsing (bundle size)
- Tradução EN futura = nova pasta `/content-en/` sem refactor de código

## Trade-offs

- Markdown não tem type safety nativa; usamos Zod nos parsers (`readEbook.ts`, `readPerguntas.ts`) para validar frontmatter
- IDs estáveis exigem rigor editorial — vale a pena pelo ganho de previsibilidade nas sessions salvas
