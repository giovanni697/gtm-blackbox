# PROMPT — Resolver definitivamente o problema "Nenhum template publicado ainda" em produção

## CONTEXTO DO PROJETO

Você está trabalhando no projeto **GTM BlackBox**, uma plataforma freemium open-source construída com:

- **Stack:** Next.js 14.2.35 (App Router) + Supabase Auth + Tailwind + MDX
- **Deploy:** Vercel (automático via GitHub push)
- **Repositório:** github.com/giovanni697/gtm-blackbox
- **URL produção:** https://gtm-blackbox.vercel.app
- **Diretório local:** `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
- **Branch:** `main`

A plataforma tem 4 módulos:

1. **Ebook** (`/ebook`) — 12 capítulos MDX em `content/ebook/*.mdx`
2. **Diagnóstico** (`/diagnostico`) — wizard com perguntas em `content/diagnostico/perguntas/*.md`
3. **Templates** (`/templates`) — 8 templates em `content/templates/{slug}/{README,template,rubrica-implementacao}.md`
4. **Forecast** (`/forecast`) — wizard de capacidade

O conteúdo é carregado em runtime por funções server-only que leem o filesystem com `fs.readdir` + `gray-matter` + Zod validation.

## O PROBLEMA

**Sintoma:** Em produção (`https://gtm-blackbox.vercel.app/templates`), a página renderiza o header "Templates & Rubricas" e o subtítulo, mas no lugar dos 8 cards de templates aparece a mensagem de fallback "Nenhum template publicado ainda."

A mesma falha provavelmente afeta `/ebook` (não validado, mas a estrutura é idêntica).

**Local funciona perfeitamente** — `npm run dev` mostra os 8 templates.

## EVIDÊNCIA CRÍTICA QUE JÁ FOI COLETADA

Existe uma rota de debug em `src/app/api/debug-content/route.ts` que faz `fs.readdir` direto. Acessando `https://gtm-blackbox.vercel.app/api/debug-content` em produção, a resposta JSON é:

```json
{
  "cwd": "/var/task",
  "content": {
    "ok": true,
    "entries": [
      { "name": "diagnostico", "isDir": true },
      { "name": "ebook", "isDir": true },
      { "name": "forecast", "isDir": true },
      { "name": "templates", "isDir": true }
    ]
  },
  "templates": {
    "ok": true,
    "entries": [
      { "name": ".gitkeep", "isDir": false },
      { "name": "01-arquitetura-de-dados", "isDir": true },
      { "name": "02-workflow-de-gtm", "isDir": true },
      { "name": "03-handbook-2-3-paginas", "isDir": true },
      { "name": "04-roadmap-de-gtm", "isDir": true },
      { "name": "05-mbr", "isDir": true },
      { "name": "06-identificacao-de-gargalos", "isDir": true },
      { "name": "07-planos-de-acao", "isDir": true },
      { "name": "08-parametrizacao-de-stack", "isDir": true }
    ]
  },
  "ebook": {
    "ok": true,
    "entries": [
      /* 12 .mdx files */
    ]
  }
}
```

**Conclusão crítica:** os arquivos ESTÃO no bundle do Vercel em `/var/task/content/templates/`. O `readdir` funciona. Portanto o problema NÃO é mais o `outputFileTracingIncludes`.

## TENTATIVAS ANTERIORES (NÃO REPITA)

| #   | Tentativa                                                                                                    | Commit    | Resultado                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------- |
| 1   | Adicionar `outputFileTracingIncludes: { "/templates": ["./content/templates/**/*"], ... }` (chaves por rota) | `dfec667` | Não resolveu                                                                                                |
| 2   | Adicionar `export const dynamic = 'force-static'` em `templates/page.tsx` e `ebook/page.tsx`                 | `b38731a` | **QUEBROU TUDO** — conflito com `(app)/layout.tsx` que usa cookies via `supabase.auth.getUser()`. Revertido |
| 3   | React `cache()` em listTemplates/listChapters                                                                | `f1a1c36` | Não resolveu                                                                                                |
| 4   | `outputFileTracingIncludes: { "/**": ["./content/**/*"] }` (catch-all) + `unstable_cache`                    | `b3ffff7` | Bundle correto (debug confirma), mas `unstable_cache` cacheou `[]` antigo entre deploys                     |
| 5   | Reverter `unstable_cache` → `cache()` (per-request, sem persistência)                                        | `bd712e4` | **AINDA RETORNA VAZIO** mesmo com bundle correto e cache per-request                                        |

## HIPÓTESES PARA INVESTIGAR (ORDEM DE PROBABILIDADE)

### H1: Prerender estático no build (MAIS PROVÁVEL)

- Mesmo com `(app)/layout.tsx` chamando `auth.getUser()`, o Next.js pode estar marcando a `templates/page.tsx` como estática durante o build
- O HTML gerado no build tem "Nenhum template publicado ainda." e fica servido pelo CDN
- O `outputFileTracingIncludes` controla o **bundle de runtime** mas o **prerender de build** pode usar caminhos diferentes
- **Como verificar:** rodar `npm run build` localmente e procurar nos logs algo tipo `○ /templates` (estática) vs `ƒ /templates` (dinâmica). A presença de `○` confirma a hipótese
- **Como resolver:** adicionar `export const dynamic = 'force-dynamic'` em `templates/page.tsx` E `ebook/page.tsx`. ATENÇÃO: testar localmente primeiro porque a tentativa #2 quebrou tudo (mas era `force-static`, não `force-dynamic` — `force-dynamic` é compatível com layout dinâmico)

### H2: Vercel CDN cacheando a resposta antiga

- Mesmo após o bundle ser corrigido, o CDN do Vercel pode estar servindo o HTML estático cacheado de um deploy anterior
- **Como verificar:** abrir DevTools → Network → checar `x-vercel-cache: HIT` no response header da request a `/templates`
- **Como resolver:** se for o caso, `force-dynamic` resolve. Se não, usar `revalidatePath('/templates')` em alguma route handler

### H3: Diferença sutil entre Route Handler e Server Component

- O `route.ts` usa `Response.json` direto e funciona
- O `page.tsx` usa Server Component que pode estar sendo otimizado de forma diferente
- **Como verificar:** adicionar `console.log` DENTRO do componente `TemplatesIndex()` (não dentro de `listTemplates`) e verificar se aparece nos logs do Vercel quando faz request

### H4: Validation Zod silenciosamente falhando em todos os 8 templates em produção

- Improvável mas possível: alguma diferença no parsing do `gray-matter` ou na validação Zod entre dev e prod
- **Como verificar:** os logs `console.error` em `readTemplates.ts` agora rodam em produção (já removemos o guard `NODE_ENV === 'development'`). Verificar logs do Vercel após visitar `/templates`. Se aparecer "frontmatter inválido em XX", encontramos a causa

## ESTADO ATUAL DOS ARQUIVOS RELEVANTES

### `src/lib/content/readTemplates.ts` (estado atual em disk e committed)

```ts
import 'server-only'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { cache } from 'react'
import { z } from 'zod'

const TemplateMetaSchema = z.object({
  title: z.string(),
  slug: z.string(),
  pilar: z.number().int().min(1).max(5),
  number: z.string(),
  estagioMinimo: z.enum(['ARMV', 'ARPE', 'ARE']).default('ARMV'),
  duracaoImplementacao: z.string(),
  outputEsperado: z.string(),
  preRequisitos: z.array(z.string()).default([]),
  lastUpdated: z.string(),
})

const TEMPLATES_DIR = path.join(process.cwd(), 'content', 'templates')

export const listTemplates = cache(async function listTemplates() {
  let dirs: string[]
  try {
    dirs = await fs.readdir(TEMPLATES_DIR)
  } catch (e) {
    console.error(
      `[readTemplates] readdir failed: ${e} — cwd=${process.cwd()} dir=${TEMPLATES_DIR}`,
    )
    return []
  }
  // ... loop com fs.stat, gray-matter, Zod parse, console.error em produção
})
```

### `next.config.mjs`

```js
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: { typedRoutes: false },
  outputFileTracingIncludes: {
    '/**': ['./content/**/*'],
  },
}
export default nextConfig
```

### `src/app/(app)/layout.tsx`

- Usa `createServerClient` do `@supabase/ssr` e chama `supabase.auth.getUser()`
- Redireciona para `/login` se não autenticado
- Renderiza `<Sidebar />` e children

### `src/app/(app)/templates/page.tsx`

```tsx
export default async function TemplatesIndex() {
  const templates = await listTemplates()  // retorna []
  return (
    <div>
      <h1>Templates & Rubricas</h1>
      <p>8 templates implementáveis...</p>
      <div className="grid">
        {templates.map(...)}  // não renderiza nada porque templates=[]
      </div>
      {templates.length === 0 ? <p>Nenhum template publicado ainda.</p> : null}
    </div>
  )
}
```

## VOCÊ TEM ACESSO A:

- **Bash tool:** rodar `npm run build`, `git log`, `git push`, `curl` para a debug API
- **Read/Edit/Write tools** no diretório `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
- **Browser tools** (Claude in Chrome) — pode navegar até `https://gtm-blackbox.vercel.app/api/debug-content` e `/templates`, ler page text, ver logs do Vercel em `https://vercel.com/scient1/gtm-blackbox/deployments` (giovanni já está logado)
- **GitHub PAT** já está no remote URL (`git push` funciona sem prompt)
- **Vercel deploy automático** em cada push para `main`

## CONSTRAINTS / O QUE VOCÊ NÃO PODE FAZER

1. ❌ Não adicione `force-static` em página dentro de `(app)/` — quebra com o layout que lê cookies
2. ❌ Não delete `content/templates/.gitkeep` (não é o problema, e remover muda o snapshot do git desnecessariamente)
3. ❌ Não use `unstable_cache` aqui — já provou ser problemática (cache stale entre deploys)
4. ❌ Não invente nomes de cliente/empresa em `content/` (pre-commit hook bloqueia: Amicci, V4, LIV, CRMBonus, Galileo, Plannera, Assertiva, Housi, Piwi, LigueLead, Octo, Magazord, Vick, etc.)
5. ❌ Não faça commit em massa sem rodar `npm run lint` antes
6. ❌ Não reescreva conteúdo de `content/` — o problema é puramente de infra/build, não de conteúdo
7. ❌ Não rode `vercel deploy` manualmente — o deploy é automático via push pro GitHub

## CRITÉRIO DE SUCESSO

1. ✅ `https://gtm-blackbox.vercel.app/templates` renderiza os 8 cards de template (T1-T8) corretamente
2. ✅ `https://gtm-blackbox.vercel.app/ebook` renderiza os 12 capítulos
3. ✅ Cada card de template é clicável e abre `/templates/{slug}` com conteúdo MDX renderizado
4. ✅ Cada capítulo do ebook é clicável e abre `/ebook/{slug}` com conteúdo MDX renderizado
5. ✅ `/diagnostico` e `/forecast` continuam funcionando (regressão)
6. ✅ `npm run lint` passa sem warnings
7. ✅ `npm run build` passa sem erros e o output mostra o tipo de cada rota (estática vs dinâmica)
8. ✅ Não há `force-static` em nenhuma página de `(app)/`
9. ✅ A rota `/api/debug-content` continua disponível para diagnóstico (REMOVER apenas no FINAL após confirmação)

## PROCESSO RECOMENDADO

### Passo 1 — Diagnóstico local

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
npm run build 2>&1 | tee /tmp/build.log
grep -E "○|ƒ|◐|●" /tmp/build.log | head -30
```

Olhe a coluna ao lado de `/templates` e `/ebook`:

- `○` = estática (prerender no build) → **isto é o problema**
- `ƒ` = dinâmica (SSR no runtime) → bom
- `●` = SSG com generateStaticParams

### Passo 2 — Fix mínimo

Adicione em `src/app/(app)/templates/page.tsx` (logo após os imports):

```ts
export const dynamic = 'force-dynamic'
```

E o mesmo em `src/app/(app)/ebook/page.tsx`.

Isso é DIFERENTE de `force-static` (que quebrou) — é o oposto: força SSR em cada request, garantindo que o `listTemplates()` rode sempre fresh com acesso ao filesystem em `/var/task`.

### Passo 3 — Validar local

```bash
npm run build 2>&1 | grep -E "templates|ebook"
# deve agora mostrar ƒ ao invés de ○
```

### Passo 4 — Commit + Push

```bash
git add src/app/\(app\)/templates/page.tsx src/app/\(app\)/ebook/page.tsx
git commit -m "fix: force-dynamic em listings de templates e ebook"
git push origin main
```

### Passo 5 — Validar produção

Aguarde ~40s, navegue até `https://gtm-blackbox.vercel.app/templates` (logado) e confirme os 8 cards.

### Passo 6 — Se H1 não for a causa

- Cheque logs do Vercel: `https://vercel.com/scient1/gtm-blackbox/[deploymentId]/logs`
- Procure por `[readTemplates] readdir failed` ou `frontmatter inválido em`
- Se aparecer log de readdir bem-sucedido (`entries=9`) mas a página continuar vazia, é H2 ou H3
- Para H2 (CDN): adicionar `export const revalidate = 0` na página
- Para H3: adicionar `console.log("page render", templates.length)` no Server Component e ver se aparece no Vercel runtime log

### Passo 7 — Cleanup final

Após confirmar que está tudo funcionando:

```bash
rm src/app/api/debug-content/route.ts
git add -A && git commit -m "chore: remove debug endpoint" && git push origin main
```

## FORMA DE REPORTAR PROGRESSO

Para cada passo, reporte em uma linha curta:

- ✅ feito
- ⚠️ parcial / hipótese ainda em teste
- ❌ falhou (com link/snippet do erro)

No final, reporte:

- Hipótese vencedora (H1, H2, H3 ou H4)
- Commit que resolveu
- Screenshot/page-text confirmando os 8 templates renderizados
- Tempo total

## CONTEXTO ADICIONAL ÚTIL

- O usuário (Giovanni) vai liberar a app para 50 pessoas amanhã (2026-05-01). Tem urgência.
- Git history relevante:
  ```
  bd712e4 fix: reverte unstable_cache → cache()
  b3ffff7 fix: outputFileTracingIncludes catch-all + unstable_cache
  f1a1c36 fix: reverte force-static, adiciona cache()
  b38731a fix: templates e ebook listing viram SSG (force-static)  ← QUEBROU TUDO
  dfec667 fix: outputFileTracingIncludes garante content/ no bundle
  ```
- Deploy mais recente: `bd712e4` (Ready, 36s build)
- O bundle de runtime tem os arquivos. O problema é como o Next.js está renderizando a PAGE.

---

**Tese principal:** o fix vai ser uma única linha (`export const dynamic = 'force-dynamic'`) em duas páginas. Se não for isso, é cache de CDN ou edge case do Next.js — investigar com os logs do Vercel.
