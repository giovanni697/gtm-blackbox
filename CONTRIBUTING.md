# Contribuir com o GTM BlackBox

Este projeto é open-source. Conteúdo (ebook, perguntas do diagnóstico, templates, forecast spec) vive em `/content/` como Markdown — você pode contribuir **sem saber TS/React**, apenas editando arquivos `.md`/`.mdx`.

## Fluxo padrão

1. **Fork** o repo `scient-cc/gtm-blackbox`
2. Clone seu fork: `git clone https://github.com/SEU-USUARIO/gtm-blackbox.git`
3. Crie uma branch: `git checkout -b melhoria/cap-3-arquitetura-dados`
4. Edite o arquivo Markdown relevante em `/content/`
5. **Atualize `lastUpdated`** no frontmatter (formato `YYYY-MM-DD`)
6. Commit: `git commit -m "docs: clarify NRR formula in pilar 1"`
7. Push: `git push origin melhoria/cap-3-arquitetura-dados`
8. Abra Pull Request com título descritivo e descrição do "porquê" da mudança

---

## Editar o ebook

```
content/ebook/
├── 00-introducao.mdx
├── 01-principios-edson-rigonatti.mdx
├── 02-do-principio-a-engenharia.mdx
├── 03-pilar-1-arquitetura-de-dados.mdx
├── 04-pilar-2-metodologia-unificada.mdx
├── 05-pilar-3-processos-padronizados.mdx
├── 06-pilar-4-stack-parametrizada.mdx
├── 07-pilar-5-loop-de-melhoria-continua.mdx
├── 08-modais-de-gtm-e-gtm-fit.mdx
├── 09-jornada-de-maturidade-armv-arpe-are.mdx
├── 10-toc-e-mbr.mdx
├── 11-componente-ai-native.mdx
└── 12-foundational-revops.mdx
```

### Frontmatter obrigatório

```yaml
---
title: 'Pilar 1 — Arquitetura de Dados'
slug: 'pilar-1-arquitetura-de-dados'
order: 3
estimatedReadingMinutes: 18
lastUpdated: 2026-04-26
---
```

### Componentes MDX disponíveis

```mdx
import { CalloutCertificacao } from '@/components/ebook/CalloutCertificacao'

<CalloutCertificacao chapter="pilar-1" />
```

### Regras editoriais (obrigatórias)

1. **Sem WbD/Bowtie/Jacco/SPICED-as-only-framework** — use a renomeação SCIENT (Arquitetura de Dados, Funil M1-M8, ROI Framework). Veja `docs/01-decisions/0008-canonical-sources.md`.
2. **IA não pode ser protagonista nos capítulos 1-10** — só a partir do cap 11. Veja `0009-principles-centric-tone.md`.
3. **Anonimizar exemplos de cliente** — "uma rede de franquias com 4.400 unidades" em vez de nome real.
4. **Disclaimer SCIENT** no rodapé de cada capítulo (italics, font-size 10px).
5. **Atualizar `lastUpdated`** no commit que muda o conteúdo.

---

## Editar perguntas do diagnóstico

```
content/diagnostico/perguntas/
├── pilar-1-arquitetura-de-dados.md
├── pilar-2-metodologia-unificada.md
├── pilar-3-processos-padronizados.md
├── pilar-4-stack-parametrizada.md
└── pilar-5-loop-de-melhoria-continua.md
```

### Regra crítica — IDs estáveis

Cada pergunta tem `id` no frontmatter. **NUNCA mude o ID** depois de publicado, mesmo se reescrever o texto. Sessions salvas no banco fazem lookup por ID.

```yaml
---
- id: p1_armv_nomenclatura_1
  estagio: ARMV
  subcamada: nomenclatura
  texto: 'Existe uma convenção de nomenclatura documentada para campos do CRM?'
- id: p1_armv_nomenclatura_2
  estagio: ARMV
  subcamada: nomenclatura
  texto: '...'
```

Texto pode mudar (ex: clarificar pergunta). ID **nunca** muda.

---

## Editar templates

```
content/templates/01-arquitetura-de-dados/
├── README.md                      # overview + quando usar + dependências
├── template.md                    # o template em si (estrutura preenchível)
├── rubrica-implementacao.md       # critérios objetivos de "está bom" (rubrica 0-3)
└── exemplos/
    └── exemplo-anonimizado.md
```

Ver §7.2 e §7.3 do prompt master para estrutura padrão.

---

## Adicionar exemplos / cases

Sempre **anonimizar**. Exemplos de formato bom:

- ✅ "uma rede de franquias com ~4.000 unidades operando 5 motions"
- ✅ "uma fintech B2B em ARPE com ACV R$200K"
- ✅ "uma operação de comissões com R$1B+ ARR"

Exemplos **proibidos** (geram erro no pre-commit hook):

- ❌ "V4 Company", "Amicci", "CRMBonus", nomes de pessoas internas SCIENT
- ❌ Valores específicos identificáveis ("R$937.500 bookings 2026")

---

## Pre-commit hook automático

Antes de cada commit, o Husky roda:

1. **Verificação de root** — git deve estar em `gtm-blackbox/`, não na raiz pai
2. **Pre-flight strings banidas** — grep em `content/` retornar zero matches
3. **Lint-staged** — ESLint + Prettier nos arquivos staged

Se algum check falhar, o commit é abortado com mensagem explicativa.

---

## Code contributions (TS/React)

Para mudanças em `src/`, `supabase/migrations/`, `next.config.mjs`:

- Manter `npm run lint` zero erros
- Manter `npm run type-check` zero erros (TS estrito, sem `any`)
- Se adicionar componente novo, seguir padrão de tokens SCIENT (`scient-primary`, `scient-dark`, etc.) — não criar cores ad-hoc
- Server components por padrão; `'use client'` só onde necessário
- Mudanças significativas (>3 arquivos) merecem ADR em `docs/01-decisions/`

---

## Reportar bugs

Abra issue em [github.com/scient-cc/gtm-blackbox/issues](https://github.com/scient-cc/gtm-blackbox/issues) com:

- Versão do Node (`node -v`)
- Sistema operacional
- Passos para reproduzir
- Comportamento esperado vs observado
- Screenshots se UI

---

## Licença

MIT. Ao contribuir, você concorda com os termos da licença.

---

**Dúvidas?** Abra uma issue ou contate `giovanni@scient.cc`.
