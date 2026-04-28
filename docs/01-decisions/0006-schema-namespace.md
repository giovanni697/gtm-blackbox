# ADR 0006 — Schema Namespace (Supabase)

**Status:** Accepted · 2026-04-26 · **Atualizado pós-Q1 do Giovanni**

## Context

Decisão original era reusar o mesmo projeto Supabase do GTM OS pago. Após pergunta direta a Giovanni (Q1 pré-Fase 1), ele optou por **novo projeto Supabase dedicado** ao GTM BlackBox (`https://aqohksffwzutqlorioxf.supabase.co`).

## Decision

**Projeto Supabase dedicado ao BlackBox, schema `public` simples.**

- Tabelas BlackBox em `public.*` sem prefixo (profiles, diagnosticos, checklist_respostas, roadmap_itens, wizard_sessions, forecast_sessions)
- **Sem risco de colisão** com GTM OS — são projetos Supabase separados
- Sem necessidade de schema dedicado `gtm_blackbox` ou prefixo `gbb_`
- Trigger `on_auth_user_created` cria row em `public.profiles` automaticamente no signup

## Consequences

### Positivas

- Schema mais simples e padrão de mercado
- Migrations isoladas em `supabase/migrations/2026*` — não tocam GTM OS
- Auth do BlackBox é independente do GTM OS — usuário precisa criar conta nova (sem SSO)
- Tier free do Supabase é suficiente para validação inicial (500MB DB + 50 emails/h)
- Rotação de chaves ou rebuild do schema não afeta GTM OS

### Negativas / Trade-offs

- Sem SSO entre GTM OS e BlackBox — usuário pago do GTM OS precisa criar nova conta no BlackBox
- Mitigação futura (v2): integração via webhook entre os 2 projetos quando o usuário pagar pelo GTM OS, sincronizando perfil/diagnóstico

## Configuração

- Project URL: `https://aqohksffwzutqlorioxf.supabase.co`
- Region: definida pelo Giovanni no momento de criação
- Tier: Free (limite 500MB DB, 50 emails/hora, 1GB egress/mês)
- Chaves no `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable) e `SUPABASE_SERVICE_ROLE_KEY` (secret)
