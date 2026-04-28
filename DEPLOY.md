# DEPLOY — GTM BlackBox

> ⚠️ **NÃO executar via Claude Code.** Este passo-a-passo é para o Giovanni rodar manualmente após smoke test local verde.

## Pré-requisitos

- Repo local em `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/` com `npm run build` zero warnings
- Conta GitHub `scient-cc`
- Projeto Supabase já existente (compartilhado com GTM OS) ou novo
- Conta Vercel
- Domínio `scient.cc` apontando para Cloudflare/Registro.br

---

## 1. Pre-flight (CRÍTICO — não pular)

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox

# (a) Verificar git root
git rev-parse --show-toplevel
# Esperado: /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
# Se aparecer outro caminho: ABORTAR.

# (b) Pre-flight strings banidas
grep -riE "Amicci|V4 Company|V4 Cohort|CRMBonus|Galileo|Plannera|Assertiva|Housi|Piwi|LigueLead|Cortex|Octo|Magazord|Vick|ClickSign|Resultados Digitais|Omie|Matheus Pinheiro|Felipe Barreiros|Konstantine|R\$300M|R\$10M NewARR|R\$937" content/
# Esperado: zero matches.
# Se aparecer match: anonimizar antes de seguir.

# (c) Build limpo
npm run build
# Esperado: build completa sem warnings ou erros.

# (d) Verificar .env.local NÃO commitado
git status .env.local
# Esperado: "nothing to commit" (já está no .gitignore).
```

---

## 2. Criar repositório GitHub

```bash
# Autenticar gh (uma vez)
brew install gh
gh auth login   # PAT com scopes: repo, workflow

# Criar repo público
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
gh repo create scient-cc/gtm-blackbox --public --source=. --remote=origin --description="A Engenharia de Go-to-Market em uma única plataforma. Open-source by SCIENT."

# Push inicial
git push -u origin main
```

**Atenção:** `gh repo create` cria o repo a partir do diretório atual. Garanta que está dentro de `gtm-blackbox/`, NUNCA na raiz `/GTMBLackBox/`.

---

## 3. Aplicar migrations no Supabase

### Opção A — Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login   # token do dashboard

# Vincular ao projeto existente
supabase link --project-ref <project-ref>

# Aplicar migrations
supabase db push
```

### Opção B — Painel web (mais simples)

1. Abrir [supabase.com/dashboard](https://supabase.com/dashboard) → projeto SCIENT
2. SQL Editor → New query
3. Colar cada arquivo `supabase/migrations/*.sql` em ordem cronológica
4. Run cada um. Verificar mensagem "Success".

### Verificação

```sql
-- No SQL Editor do Supabase
SELECT COUNT(*) FROM public.profiles;
-- Esperado: 0 (tabela vazia, mas existindo)

SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
-- Esperado: 1 row (trigger criado)

SELECT * FROM pg_policies WHERE tablename IN ('profiles','diagnosticos','checklist_respostas','roadmap_itens','wizard_sessions','forecast_sessions');
-- Esperado: pelo menos 6 policies, todas com `auth.uid() = user_id`
```

---

## 4. Deploy Vercel

```bash
npm install -g vercel
vercel login

cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
vercel link    # vincular ao projeto Vercel ou criar novo (scient-cc)
```

### Configurar env vars no Vercel

Em `vercel.com → projeto → Settings → Environment Variables`, adicionar:

| Nome                            | Production                    | Preview               | Development           |
| ------------------------------- | ----------------------------- | --------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✓                             | ✓                     | ✓                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓                             | ✓                     | ✓                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✓                             | ✓                     | ✓                     |
| `NEXT_PUBLIC_SITE_URL`          | https://blackbox.scient.cc    | (URL preview)         | http://localhost:3000 |
| `NEXT_PUBLIC_CERTIFICATION_URL` | http://gtme.scient.cc         | http://gtme.scient.cc | http://gtme.scient.cc |
| `NEXT_PUBLIC_GTMOS_URL`         | https://gtm-os-dun.vercel.app | (idem)                | (idem)                |

### Primeiro deploy

```bash
vercel deploy --prod
```

Esperar build completar. Vercel devolve uma URL `*.vercel.app`.

---

## 5. Domínio customizado

1. No Vercel: Project → Settings → Domains → Add `blackbox.scient.cc`
2. Vercel mostra um CNAME (ex: `cname.vercel-dns.com`)
3. No registrador (Cloudflare/Registro.br): adicionar CNAME `blackbox` → `cname.vercel-dns.com`
4. Aguardar propagação (5-30min)
5. Vercel valida SSL automaticamente (Let's Encrypt)

---

## 6. Smoke test pós-deploy

Acessar `https://blackbox.scient.cc/` e validar:

- [ ] Landing carrega com hero dark + CTAs
- [ ] /signup cria usuário (verificar inbox)
- [ ] Após login, Hub mostra 4 cards (Ebook · Diagnóstico · Templates · Forecast)
- [ ] /ebook → cap 1 abre, MDX renderiza, sidebar de capítulos funciona
- [ ] /diagnostico → wizard inicia, autosave funciona, exportar TXT gera arquivo válido
- [ ] /templates → catálogo lista 8 templates, download .zip funciona
- [ ] /forecast → wizard 7 blocos, resultado mostra capacity verdict, hiring plan com flag `viavel`
- [ ] Mobile responsivo: sidebar colapsa, leitura confortável

---

## 7. Troubleshooting

| Sintoma                        | Diagnóstico                                                 | Solução                                                               |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Signup falha "RLS denied"      | Trigger `handle_new_user` não criou profile                 | SQL: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'` |
| MDX não renderiza              | Path errado em `[...slug]/page.tsx` ou frontmatter inválido | Build logs no Vercel mostram parse error                              |
| RadarChart quebra em prod      | SSR com Recharts                                            | Confirmar `dynamic(import, { ssr: false })` no componente             |
| Build falha "Module not found" | Path alias `@/*` quebrou                                    | Confirmar `paths` em `tsconfig.json`                                  |
| Email não chega no signup      | Supabase free tier: 50 emails/h                             | Aguardar reset OU upgrade para Pro                                    |

---

## 8. Rollback

Se o deploy de produção quebrar:

```bash
# No Vercel Dashboard → Deployments → versão anterior → "Promote to Production"
# OU via CLI:
vercel rollback
```

Migrations Supabase: criar nova migration `20260427_999_rollback_*.sql` que desfaz mudanças. **Nunca** rodar `DROP TABLE` em produção sem backup.

---

## Quem fez o quê

- **Claude Code:** Fases 0-9 (build local + smoke test).
- **Giovanni:** este DEPLOY.md (manual).
- **Vercel + Supabase + GitHub:** infraestrutura.
