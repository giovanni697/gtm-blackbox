# ADR 0007 — Versionamento de Conteúdo

**Status:** Accepted · 2026-04-26

## Context

Conteúdo em Markdown (12 capítulos do ebook + perguntas + templates + forecast spec) evolui com o tempo. Leitores precisam saber se um capítulo foi atualizado recentemente. Editores precisam ter referência de quando algo mudou.

## Decision

- **Frontmatter `lastUpdated`** em todo `.mdx` e `.md` editorial: `lastUpdated: 2026-04-26`
- Atualização **manual** durante o PR (autor edita o campo no commit)
- Renderizar `lastUpdated` na sidebar/footer do capítulo: "Atualizado em 26/04/2026"
- Sem git pre-commit hook que atualize automaticamente — força disciplina editorial e evita conflitos de merge

## Consequences

- Editor que esquece de atualizar `lastUpdated` quebra a confiança da data → checklist em `CONTRIBUTING.md`
- Versionamento real (v1.0, v2.0) fica para release tags do repo, não no frontmatter

## Alternativa rejeitada

- **Hook pre-commit que atualiza `lastUpdated` automaticamente:** rejeitado — incentiva edições micro que sempre aparecem como "atualizado", inflacionando confiança falsa
