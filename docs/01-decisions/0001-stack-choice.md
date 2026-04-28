# ADR 0001 — Stack Choice

**Status:** Accepted · 2026-04-26

## Context

Construir GTM BlackBox como plataforma freemium open-source com 4 módulos. Restrições: rodar 100% localmente antes de deploy, paridade visual com GTM OS pago, conteúdo editável via PR no Markdown, deploy futuro Git→Supabase→Vercel.

## Decision

Stack obrigatória:

- **Next.js 14.2.x** (App Router) + **TypeScript estrito**
- **Tailwind CSS** com tokens SCIENT customizados (sem shadcn/Material/Chakra)
- **Supabase** (Auth email/senha + Postgres + RLS)
- **next-mdx-remote/rsc** para o ebook (NÃO `@next/mdx` — server components compatível)
- **Recharts** com `next/dynamic({ ssr: false })` + table fallback acessível
- **Zod** + **react-hook-form** para wizards
- **lucide-react** para ícones
- **Sora** + **Lexend** via `next/font/google`

## Consequences

- TS estrito (`strict: true`) bloqueia `any` e força disciplina
- App Router + RSC compila MDX em build time (`generateStaticParams`)
- Sem dependências exóticas; preferir 50 linhas a mais a libs obscuras
- Recharts SSR-safe via dynamic import (§1.8 #10 do prompt master)

## Alternatives considered

- **shadcn/ui:** rejeitado — tokens SCIENT exigem componentes nativos com Tailwind
- **`@next/mdx`:** rejeitado — incompatível com a abordagem RSC + bundle estoura em produção
- **Pages Router:** rejeitado — App Router é o padrão atual e a documentação Supabase SSR é melhor nele
