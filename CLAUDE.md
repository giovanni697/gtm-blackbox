# Regras de Trabalho — GTM BlackBox

## Fluxo de Git (OBRIGATÓRIO)

**Nunca commitar diretamente em `main`.**

Toda sessão de trabalho deve seguir este fluxo:

### 1. Início de sessão — criar feature branch

```bash
git checkout -b feat/YYYY-MM-DD-descricao-curta
# Exemplos:
# git checkout -b feat/2026-05-29-admin-editor
# git checkout -b feat/2026-06-01-rate-limiting
# git checkout -b fix/2026-06-03-middleware-coverage
```

> O hook `SessionStart` em `.claude/settings.json` faz isso automaticamente
> quando a sessão começa em `main`. O branch criado é `feat/YYYY-MM-DD`.
> Renomear se quiser um nome mais descritivo.

### 2. Durante a sessão — trabalhar no feature branch

- Commits normais no branch de feature
- Push intermediário é bem-vindo: `git push -u origin <branch>`

### 3. Final da sessão — abrir PR

```bash
git push -u origin HEAD
gh pr create --base main --title "feat: descrição da mudança"
```

## Padrões de Commit

```
feat(escopo): descrição curta
fix(escopo): descrição do bug corrigido
perf(escopo): melhoria de performance
docs(escopo): documentação
chore(escopo): manutenção sem impacto funcional
```

## Stack

- **Next.js 14** App Router — server components, server actions, `'use client'` só quando necessário
- **Supabase** — `createClient()` (server + cookies) / `createServiceClient()` (service role, só server-side)
- **Vercel** — deploy automático em push para `main` via PR merge
- **Tailwind** — design system SCIENT (paleta em `tailwind.config.ts`)

## Arquivos críticos

| Arquivo                                 | Propósito                                      |
| --------------------------------------- | ---------------------------------------------- |
| `src/lib/email/admin-guard.ts`          | Gate de admin (`giovanni@scient.cc`)           |
| `src/lib/api/auth.ts`                   | Validação de API keys + rate limiting          |
| `src/lib/api/rate-limit.ts`             | Rate limiter Upstash (fail-open)               |
| `src/lib/content/getContentOverride.ts` | Override layer de conteúdo MDX                 |
| `src/lib/supabase/middleware.ts`        | Auth middleware + PROTECTED_PREFIXES           |
| `supabase/migrations/`                  | Migrations SQL — aplicar no Supabase Dashboard |
