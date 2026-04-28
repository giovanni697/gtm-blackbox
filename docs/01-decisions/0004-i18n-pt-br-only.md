# ADR 0004 — i18n: PT-BR only (v1)

**Status:** Accepted · 2026-04-26

## Context

ICP atual da SCIENT é Brasil (mid-market R$50M–R$500M ARR). Adicionar EN no MVP triplicaria o trabalho de conteúdo (12 capítulos × 2 idiomas + perguntas + templates). Não há demanda comercial confirmada para EN agora.

## Decision

- **v1 PT-BR only**: HTML lang="pt-BR", todo conteúdo em português, copy de UI em PT
- Sem `next-intl` ou `next-i18next` por enquanto
- Frontmatter dos arquivos `/content/` não precisa de campo `locale`

## Consequences

- Traduções futuras = duplicar `/content/` em `/content-en/` + adicionar layer de roteamento `(en)/`
- ADR seria atualizado / superseded em release v2
- Sem complexidade de ICU pluralização nem detecção de browser locale

## Trigger para revisão

- Cliente internacional declara interesse em comprar consultoria via BlackBox
- Entrada da SCIENT em mercado LATAM-EN ou US
- Volume de tráfego orgânico com queries em inglês
