# Prompt de Execução — Performance QA + Settings UX

Projeto: `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
Stack: Next.js 14 App Router · Supabase · Tailwind · Vercel

Execute as duas tasks abaixo em sequência. Leia todos os arquivos antes de editar.

---

## TASK 1 — Performance QA (plataforma lenta)

### 1.1 Build + diagnóstico

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
npm run build 2>&1
```

Analise o output do build:

- Rotas marcadas como `ƒ` (dynamic) vs `○` (static) — identifique rotas que deveriam ser estáticas mas são dinâmicas
- Tamanho de bundle por rota — identifique rotas com First Load JS > 150kB
- Erros ou warnings relevantes

### 1.2 Identificar causas de lentidão

Inspecione cada arquivo abaixo e anote problemas:

**Auth + Data fetching:**

```
src/app/(app)/layout.tsx
src/app/(app)/hub/page.tsx
src/app/(app)/diagnostico/page.tsx
src/app/(app)/diagnostico/resultado/page.tsx
src/app/(app)/forecast/page.tsx
src/app/(app)/ebook/page.tsx
src/app/(app)/templates/page.tsx
```

Problemas a buscar:

- `createClient()` chamado múltiplas vezes sem cache (cada chamada cria nova conexão SSR)
- `await supabase.auth.getUser()` chamado no layout E no page (double round-trip)
- Falta de `export const revalidate = X` em páginas que poderiam ser ISR
- Falta de `unstable_cache` ou `React.cache` em queries repetidas
- `use client` desnecessário em componentes que não precisam de interatividade

**Componentes pesados:**

```
src/components/diagnostico/RadarMaturidade.tsx
src/components/forecast/
src/components/ebook/
```

Verificar:

- `dynamic(() => import(...), { ssr: false })` aplicado em componentes com Recharts ✓ (já feito)
- Outros componentes pesados sem lazy load

**CSS/Fonts:**

```
src/app/layout.tsx (root)
```

- Google Fonts carregando com `display=swap` e `preconnect`?
- Quantas famílias de fonte estão sendo carregadas?

### 1.3 Fixes a aplicar

Aplique **todos** os seguintes fixes que forem confirmados como problemas:

**A. Evitar double auth no layout + pages**

O `layout.tsx` já chama `supabase.auth.getUser()`. As pages não precisam chamar de novo para obter o user — apenas para dados específicos daquele usuário.

Padrão correto: no layout, passar `user` via `searchParams` ou via Server Component composition. Mas a forma mais simples no App Router é: **cada page usa `createClient()` e `getUser()` independentemente** — o Supabase SSR usa cookies e a sessão é cached pelo browser. Não há round-trip extra; é leitura de cookie local.

Portanto: se as pages já estão chamando `getUser()` diretamente, isso está correto. Apenas garanta que nenhuma page está chamando `getUser()` E `profiles.select()` sequencialmente quando podem rodar em paralelo.

**B. `Promise.all` onde ainda faltar**

Leia cada page file. Para cada par de `await` independentes, use:

```ts
const [resultA, resultB] = await Promise.all([queryA, queryB])
```

**C. `export const dynamic = 'force-static'` em páginas sem dados de usuário**

Páginas como `/ebook` (lista de capítulos) e `/templates` (catálogo) não têm dados per-user — são iguais para todos. Verifique se podem usar `revalidate`:

```ts
export const revalidate = 3600 // revalida 1x/hora
```

Cuidado: só aplicar se a page NÃO usa `supabase.auth.getUser()` ou dados por usuário.

**D. Fontes — reduzir subsets**

Em `src/app/layout.tsx`, verifique o `<link>` do Google Fonts. Se estiver carregando todos os pesos de Sora + Lexend + JetBrains Mono, reduza para:

- Sora: apenas `300;400;600` (remover 500;700;800 se não usados)
- Lexend: apenas `300;400;500`
- JetBrains Mono: apenas `400`
- Adicionar `&display=swap` se não existir

**E. Verificar se `<Suspense>` está faltando em rotas lentas**

Em `diagnostico/resultado/page.tsx` e `forecast/resultado/page.tsx`, se houver seções independentes (ex: gráfico + tabela), envolva em `<Suspense fallback={<div>…</div>}>`.

**F. Middleware de auth — verificar overhead**

Leia `src/middleware.ts`. Se estiver rodando em TODAS as rotas (inclusive `/_next/static`, `/favicon.ico`, etc.), adicionar matcher:

```ts
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
```

### 1.4 Verificar após fixes

```bash
npm run build 2>&1 | grep -E "Route|Size|First"
npx tsc --noEmit 2>&1 | head -20
```

---

## TASK 2 — Settings UX: API Key mascarada + confirmação de deleção

### Contexto

Arquivos relevantes:

- `src/app/(app)/settings/page.tsx` — servidor, renderiza lista de chaves e form
- `src/app/(app)/settings/NewKeyForm.tsx` — cliente, gera e exibe a chave nova
- `src/app/(app)/settings/actions.ts` — server actions (createApiKey, revokeApiKey)

### 2.1 — Chave mascarada com toggle show/hide + botão copiar

**Arquivo: `src/app/(app)/settings/NewKeyForm.tsx`**

Atualmente, quando a chave é gerada, ela aparece completamente visível no campo amber.

**Novo comportamento:**

- A chave aparece **mascarada por padrão**: `gtmb_••••••••••••••••••••••••••••••••`
- Botão de olho (Eye/EyeOff do lucide-react) ao lado direito para alternar visibilidade
- Botão de copiar ao lado (já existe, mas mantê-lo)
- Estado inicial: `masked = true`

Implemente assim em `NewKeyForm.tsx`:

```tsx
const [masked, setMasked] = useState(true)

// No display da chave:
<code className="...">
  {masked
    ? plainKey.slice(0, 5) + '•'.repeat(plainKey.length - 5)
    : plainKey}
</code>
<button onClick={() => setMasked(v => !v)} title={masked ? 'Mostrar' : 'Ocultar'}>
  {masked ? <Eye size={14} /> : <EyeOff size={14} />}
</button>
<button onClick={handleCopy} title="Copiar">
  {copied ? <Check size={14} /> : <Copy size={14} />}
</button>
```

Imports necessários: `Eye, EyeOff` do `lucide-react`.

Reset ao gerar nova chave: `setMasked(true)` junto com `setPlainKey(result.plain)`.

### 2.2 — Confirmação antes de deletar

**Problema atual:** O botão de revogar é um `<form action={...}>` no servidor — não há confirmação. Um clique acidental revoga a chave sem aviso.

**Solução:** Criar um componente cliente `RevokeKeyButton.tsx` que:

1. Exibe o botão de lixeira
2. Ao clicar, abre um `<dialog>` nativo (não `window.confirm` — o `<dialog>` é mais elegante e não bloqueia a UI)
3. O dialog mostra: "Revogar chave `{prefix}…`?" + "Esta ação não pode ser desfeita." + botões "Cancelar" e "Revogar"
4. Só chama a server action `revokeApiKey(id)` se o usuário confirmar

**Criar: `src/app/(app)/settings/RevokeKeyButton.tsx`**

```tsx
'use client'

import { useRef, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { revokeApiKey } from './actions'

interface Props {
  keyId: string
  keyPrefix: string
  keyName: string
}

export function RevokeKeyButton({ keyId, keyPrefix, keyName }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isPending, startTransition] = useTransition()

  function openDialog() {
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleConfirm() {
    startTransition(async () => {
      await revokeApiKey(keyId)
      closeDialog()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        title="Revogar chave"
        className="flex h-7 w-7 items-center justify-center text-gray-300 transition-colors hover:text-red-500"
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-none border border-gray-200 bg-white p-0 shadow-xl backdrop:bg-black/40"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog()
        }}
      >
        <div className="w-80 p-6">
          <p className="font-sora text-sm font-semibold text-gray-900">Revogar chave?</p>
          <p className="mt-2 font-sora text-xs text-gray-500">
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              {keyPrefix}…
            </code>{' '}
            <span className="text-gray-400">({keyName})</span>
          </p>
          <p className="mt-2 font-sora text-xs text-red-600">
            Esta ação não pode ser desfeita. Agentes usando esta chave perderão acesso
            imediatamente.
          </p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isPending}
              className="flex-1 border border-gray-200 py-2 font-sora text-xs text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 bg-red-600 py-2 font-sora text-xs text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Revogando…' : 'Revogar'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
```

**Atualizar `src/app/(app)/settings/page.tsx`:**

- Importar `RevokeKeyButton`
- Substituir o `<form action={...}>` + `<button>` de cada linha da tabela por:
  ```tsx
  <RevokeKeyButton keyId={k.id} keyPrefix={k.key_prefix} keyName={k.name} />
  ```
- Remover o `import { revokeApiKey }` da page (fica só em RevokeKeyButton)

---

## Finalizar

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox
npx tsc --noEmit 2>&1 | head -30
npm run build 2>&1 | tail -20
```

Fix qualquer erro TypeScript antes de commitar.

```bash
git add -A
git commit -m "perf: bundle + query optimizations; ux: masked api key + revoke confirmation"
git push origin main
```

Reportar:

1. Quais fixes de performance foram aplicados e em quais arquivos
2. Redução de bundle size (before vs after do build output)
3. Confirmação das mudanças de UX no Settings
4. Hash do commit
