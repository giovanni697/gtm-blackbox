# GTM BlackBox

> A Engenharia de Go-to-Market em uma única plataforma.
> **Ebook · Diagnóstico · Templates · Forecast & Capacity.** Open-source, freemium, PT-BR.

Plataforma de entrada para a metodologia SCIENT de Engenharia de GTM. Em ~90 minutos, o usuário sai com um diagnóstico de maturidade dos 5 pilares, um roadmap priorizado por TOC, templates implementáveis e uma calculadora de capacity.

---

## Stack

- **Next.js 14.2.x** (App Router) + TypeScript estrito
- **Tailwind CSS** com tokens SCIENT
- **Supabase** (Auth email/senha + Postgres + RLS)
- **next-mdx-remote/rsc** para conteúdo do ebook
- **Recharts** + table fallback acessível (a11y WCAG AA)
- **Sora** + **Lexend** via `next/font/google`

## Setup local

```bash
# Pré-requisitos
node -v          # 20.x ou 22.x LTS
npm -v           # 10+

# Instalar deps
npm install

# Variáveis de ambiente
cp .env.example .env.local
# Preencher: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Aplicar migrations Supabase
# Opção A — Supabase CLI: supabase db push
# Opção B — Cole o SQL de supabase/migrations/* no painel SQL Editor

# Subir dev server
npm run dev   # → http://localhost:3000
```

## Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # build de produção
npm run start        # start produção (após build)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (validação tipos)
npm run format       # Prettier write
npm run format:check # Prettier check (CI)
```

## Estrutura

```
gtm-blackbox/
├── content/                  # Conteúdo editável via Markdown
│   ├── ebook/                # 12 capítulos .mdx
│   ├── diagnostico/          # perguntas + interpretações + prompts
│   ├── templates/            # 8 pastas (T1-T8)
│   └── forecast/             # spec inputs/outputs + interpretações
├── src/
│   ├── app/                  # rotas Next.js App Router
│   ├── components/           # componentes React por módulo
│   ├── lib/                  # supabase, content parsers, engines
│   └── styles/               # CSS global + tokens
├── supabase/
│   └── migrations/           # SQL versionado
└── docs/
    ├── 01-decisions/         # 13 ADRs
    ├── 02-design-system/     # tokens, padrões
    └── 03-content-pipeline/  # como editar conteúdo
```

## Os 5 Pilares (BlackBox)

1. **Arquitetura de Dados** — Nomenclatura · Critérios · Originação · Centralização · Enriquecimento
2. **Metodologia Unificada** — Frameworks de qualificação · GTM Blueprint · Linguagem comum
3. **Processos Padronizados** — Playbooks M1-M8 · Handbooks 2-3 páginas · TTFI
4. **Stack Parametrizada** — CRM (etapas, campos obrigatórios, dashboards, pipelines)
5. **Loop de Melhoria Contínua** — MBR · TOC · Roadmap · Planos de Ação

## O que o GTM BlackBox **NÃO** faz

- ❌ **Não é CRM** — não substitui HubSpot, Salesforce, Pipedrive. Recomenda parametrização, não opera.
- ❌ **Não é Data Warehouse** — não armazena dados de clientes do usuário.
- ❌ **Não roda agentes IA** — descreve onde IA cabe, mas não executa (agentes ficam no GTM OS pago).
- ❌ **Não é multi-tenant SaaS** — cada usuário vê só os próprios dados; sem orgs, sem roles.
- ❌ **Não substitui consultor SCIENT** — é ponto de partida; transformação real exige Forward Deployed.
- ❌ **Não tem garantia de resultado** — outputs do Forecast são estimativas estruturadas, não promessas.
- ❌ **Não publica conteúdo do usuário** — diagnóstico é privado; nada compartilhado por padrão.
- ❌ **Não envia e-mails comerciais** — só transacionais (signup, reset). Sem newsletter, sem drip.
- ❌ **Não tem free trial pago** — é freemium permanente; upsell manual via CTA cert + GTM OS.
- ❌ **Não roda em mobile native** — é web responsive (PWA pode entrar como issue futura).

## Contribuir

Conteúdo é editável via PR no Markdown. Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para o fluxo.

Decisões arquiteturais estão em [docs/01-decisions/](./docs/01-decisions/) (13 ADRs).

## Deploy

Deploy é **manual** — passo-a-passo em [DEPLOY.md](./DEPLOY.md).

## Licença

MIT — veja [LICENSE](./LICENSE).

---

**Construído pela [SCIENT](https://scient.cc).**
**Certificação GTM Engineer:** [gtme.scient.cc](http://gtme.scient.cc).
