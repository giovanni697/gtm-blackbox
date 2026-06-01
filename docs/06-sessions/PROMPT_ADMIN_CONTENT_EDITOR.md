# Prompt de Execução — Admin Content Editor V1

Projeto: `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
Stack: Next.js 14 App Router · Supabase · Tailwind · Vercel

Leia TODOS os arquivos relevantes antes de editar qualquer coisa.

---

## Contexto e Decisão Arquitetural

O conteúdo (ebook + templates) vive em arquivos MDX no filesystem (`content/`).
Vercel Serverless é read-only em produção — não é possível sobrescrever esses arquivos via runtime.

**Solução:** Layer de override no Supabase. Uma tabela `content_edits` armazena
overrides por `(content_type, slug, section)`. Os readers verificam o DB primeiro;
se não houver override, usam o MDX do filesystem como fallback.

**Admin gate existente:** `src/lib/email/admin-guard.ts` — função `requireAdmin()`
restrita ao email `giovanni@scient.cc`. Não criar nenhum sistema de roles novo.
Usar exatamente este padrão em todas as novas pages/actions.

---

## FASE 1 — Supabase: migration + tabela

### Arquivo: `supabase/migrations/20260529_009_content_edits.sql`

```sql
-- content_edits: override layer para conteúdo MDX editado via admin
-- O filesystem continua como source of truth; este registro sobrescreve em runtime.

CREATE TABLE content_edits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Tipo de conteúdo: 'ebook' | 'template_description' | 'template_body' | 'template_rubrica'
  content_type  TEXT NOT NULL,
  -- Slug do arquivo: '01-principios-edson-rigonatti', '01-arquitetura-de-dados', etc.
  slug          TEXT NOT NULL,
  -- Corpo markdown SEM frontmatter
  body          TEXT NOT NULL,
  -- Email de quem salvou
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT content_edits_unique UNIQUE (content_type, slug)
);

ALTER TABLE content_edits ENABLE ROW LEVEL SECURITY;

-- Só service role pode acessar (admin usa createServiceClient)
CREATE POLICY "no_client_access" ON content_edits
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE INDEX ON content_edits (content_type, slug);
```

**Instrução para Giovanni:** aplicar este SQL no Supabase Dashboard → SQL Editor.

---

## FASE 2 — Override layer nos content readers

### 2.1 Criar `src/lib/content/getContentOverride.ts`

```typescript
import 'server-only'
import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Retorna o body markdown de um override ou null se não houver.
 * Cacheado por 60s por (type, slug). Revalidado via tag 'content-overrides'.
 */
export const getContentOverride = unstable_cache(
  async (contentType: string, slug: string): Promise<string | null> => {
    const sb = createServiceClient()
    const { data } = await sb
      .from('content_edits')
      .select('body')
      .eq('content_type', contentType)
      .eq('slug', slug)
      .maybeSingle()
    return data?.body ?? null
  },
  ['content-override'],
  { revalidate: 60, tags: ['content-overrides'] },
)
```

### 2.2 Atualizar `src/lib/content/readEbook.ts`

Na função `getChapterBySlug(slug)`, após ler o arquivo MDX e fazer parse do frontmatter,
substituir `content` (corpo do capítulo) pela versão do DB se houver override:

```typescript
import { getContentOverride } from './getContentOverride'

// ... dentro de getChapterBySlug, após o gray-matter parse:
const override = await getContentOverride('ebook', slug)
const body = override ?? content // content = gray-matter data.content (o corpo sem frontmatter)
// usar 'body' no lugar de 'content' no objeto retornado
```

Cuidado: manter o frontmatter (`data`) intacto — só sobrescrever o corpo.
A função deve continuar retornando o mesmo tipo `Chapter` sem quebrar nada.

### 2.3 Atualizar `src/lib/content/readTemplates.ts`

Na função `getTemplateBySlug(slug)`, para cada uma das 3 seções:

- `template_description` → sobrescreve o body do `meta.md` (após frontmatter)
- `template_body` → sobrescreve o body do `template.md` (arquivo completo, sem frontmatter)
- `template_rubrica` → sobrescreve o body de `rubrica-implementacao.md`

```typescript
import { getContentOverride } from './getContentOverride'

// ... dentro de getTemplateBySlug, após ler cada arquivo:
const [descOverride, bodyOverride, rubricaOverride] = await Promise.all([
  getContentOverride('template_description', slug),
  getContentOverride('template_body', slug),
  getContentOverride('template_rubrica', slug),
])

// usar descOverride ?? descBody, bodyOverride ?? templateBody, etc.
```

---

## FASE 3 — Server Actions

### Arquivo: `src/app/(app)/admin/content/actions.ts`

```typescript
'use server'

import { revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'

const VALID_TYPES = ['ebook', 'template_description', 'template_body', 'template_rubrica'] as const
type ContentType = (typeof VALID_TYPES)[number]

export async function saveContentEdit(
  contentType: ContentType,
  slug: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin() // redireciona se não for admin
  if (!VALID_TYPES.includes(contentType)) return { ok: false, error: 'Invalid content type' }
  if (!slug || !body) return { ok: false, error: 'Slug and body are required' }

  const sb = createServiceClient()
  const { error } = await sb.from('content_edits').upsert(
    {
      content_type: contentType,
      slug,
      body: body.trim(),
      updated_by: user.email!,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'content_type,slug' },
  )

  if (error) return { ok: false, error: error.message }
  revalidateTag('content-overrides')
  return { ok: true }
}

export async function revertContentEdit(
  contentType: ContentType,
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  const sb = createServiceClient()
  const { error } = await sb
    .from('content_edits')
    .delete()
    .eq('content_type', contentType)
    .eq('slug', slug)

  if (error) return { ok: false, error: error.message }
  revalidateTag('content-overrides')
  return { ok: true }
}

/** Para a página de listagem: retorna todos os overrides ativos */
export async function listContentEdits() {
  await requireAdmin()
  const sb = createServiceClient()
  const { data } = await sb
    .from('content_edits')
    .select('content_type, slug, updated_by, updated_at')
    .order('updated_at', { ascending: false })
  return data ?? []
}
```

---

## FASE 4 — Componente `<MarkdownEditor>`

### Arquivo: `src/components/admin/MarkdownEditor.tsx`

Componente cliente. Recebe `initialBody` (string markdown) + props de submit.
Toolbar com 3 botões: **H2**, **H3**, **Bold**.
Cada botão insere a sintaxe markdown na posição do cursor no textarea.

```typescript
'use client'

import { useRef, useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  initialBody: string
  onSave: (body: string) => Promise<{ ok: boolean; error?: string }>
  onRevert?: () => Promise<{ ok: boolean; error?: string }>
  hasOverride: boolean  // se true, mostra botão "Reverter para original"
}

export function MarkdownEditor({ initialBody, onSave, onRevert, hasOverride }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [body, setBody] = useState(initialBody)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Insere sintaxe markdown na posição do cursor
  function insertAtCursor(before: string, after: string = '') {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end)
    const newBody =
      body.slice(0, start) + before + (selected || 'texto') + after + body.slice(end)
    setBody(newBody)
    // Restaurar foco e cursor após o texto inserido
    requestAnimationFrame(() => {
      el.focus()
      const newCursor = start + before.length + (selected || 'texto').length + after.length
      el.setSelectionRange(newCursor, newCursor)
    })
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await onSave(body)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error ?? 'Erro ao salvar')
      }
    })
  }

  function handleRevert() {
    if (!onRevert) return
    startTransition(async () => {
      const result = await onRevert()
      if (result.ok) {
        setBody(initialBody)
      } else {
        setError(result.error ?? 'Erro ao reverter')
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border border-gray-200 bg-gray-50 px-2 py-1.5">
        <span className="mr-2 font-sora text-3xs uppercase tracking-widest text-gray-400">
          Formatação
        </span>
        <ToolbarButton label="H2" onClick={() => insertAtCursor('\n## ', '')} />
        <ToolbarButton label="H3" onClick={() => insertAtCursor('\n### ', '')} />
        <ToolbarButton label="B" bold onClick={() => insertAtCursor('**', '**')} />
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[500px] w-full resize-y border border-gray-200 bg-white p-4 font-mono text-xs leading-relaxed text-gray-800 focus:border-scient-primary focus:outline-none"
        spellCheck={false}
      />

      {/* Footer: erro + botões */}
      {error && (
        <p className="font-sora text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-scient-primary px-5 py-2.5 font-sora text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : saved ? (
            <Check size={13} />
          ) : null}
          {isPending ? 'Salvando…' : saved ? 'Salvo!' : 'Salvar'}
        </button>

        {hasOverride && onRevert && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={isPending}
            className="font-sora text-xs text-gray-400 underline underline-offset-2 hover:text-red-500 disabled:opacity-50"
          >
            Reverter para original
          </button>
        )}
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  bold = false,
  onClick,
}: {
  label: string
  bold?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-8 items-center justify-center border border-gray-200 bg-white font-mono text-xs text-gray-700 hover:bg-gray-100"
      style={{ fontWeight: bold ? 700 : 400 }}
    >
      {label}
    </button>
  )
}
```

---

## FASE 5 — Admin Pages

### 5.1 Página de listagem: `src/app/(app)/admin/content/page.tsx`

Server component. Chama `requireAdmin()` + `listChapters()` + `listTemplates()` + `listContentEdits()` em paralelo.

Renderiza duas seções:

1. **Ebook** (12 capítulos) — cada linha: título, data, botão "Editar" → `/admin/content/ebook/[slug]`
   - Badge "Editado" em amber se houver override na lista de `listContentEdits()`
2. **Templates** (8 templates × 3 seções) — cada linha com 3 links de edição
   - "Descrição" → `/admin/content/template_description/[slug]`
   - "Template" → `/admin/content/template_body/[slug]`
   - "Rubrica" → `/admin/content/template_rubrica/[slug]`

Layout: mesmo padrão visual das outras admin pages (header escuro, tabela limpa).

```typescript
// Estrutura básica:
import { requireAdmin } from '@/lib/email/admin-guard'
import { listChapters } from '@/lib/content/readEbook'
import { listTemplates } from '@/lib/content/readTemplates'
import { listContentEdits } from './actions'

export default async function ContentAdminPage() {
  await requireAdmin()

  const [chapters, templates, edits] = await Promise.all([
    listChapters(),
    listTemplates(),
    listContentEdits(),
  ])

  const editedSet = new Set(edits.map((e) => `${e.content_type}::${e.slug}`))
  const isEdited = (type: string, slug: string) => editedSet.has(`${type}::${slug}`)

  // ... renderizar tabelas
}
```

### 5.2 Página de edição: `src/app/(app)/admin/content/[type]/[slug]/page.tsx`

Server component com parâmetros dinâmicos `{ type, slug }`.

**Lógica:**

1. `requireAdmin()`
2. Validar `type` contra `['ebook', 'template_description', 'template_body', 'template_rubrica']`
3. Buscar o conteúdo atual:
   - Se `type === 'ebook'`: `getChapterBySlug(slug)` — usar `chapter.content` (o body MDX original do filesystem, SEM o override — para mostrar o original no editor quando não há override)
   - Se `type === 'template_*'`: ler o arquivo correspondente diretamente via `readFile`
4. Buscar override existente do DB (para saber se `hasOverride = true` e qual body mostrar no editor)
5. O editor mostra: override se existir, original do filesystem se não existir

**Importante:** para carregar o body ORIGINAL do filesystem (não o override), ler diretamente o arquivo antes de aplicar o override layer. Ou criar uma função `getOriginalBody(type, slug)` separada que lê só o filesystem.

**Bindings de action:**

```typescript
// No server component, criar closures das server actions com os parâmetros preenchidos:
// Passar como props para um componente cliente wrapper que renderiza <MarkdownEditor>

// Arquivo: src/app/(app)/admin/content/[type]/[slug]/EditorWrapper.tsx
'use client'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
// recebe initialBody, hasOverride, contentType, slug como props
// chama saveContentEdit(type, slug, body) e revertContentEdit(type, slug) via bind
```

**Cabeçalho da página:** mostrar título do conteúdo + tipo + slug para contexto.

### 5.3 Loading skeleton: `src/app/(app)/admin/content/loading.tsx`

```typescript
export default function ContentAdminLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 md:px-8">
      <div className="h-7 w-32 rounded bg-scient-divider" />
      <div className="mt-2 h-4 w-64 rounded bg-scient-divider" />
      <div className="mt-8 flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 rounded bg-scient-divider" />
        ))}
      </div>
    </div>
  )
}
```

---

## FASE 6 — Verificação Final

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox

# TypeScript
npx tsc --noEmit 2>&1 | head -20

# Build
npm run build 2>&1 | tail -20
```

Corrigir qualquer erro TypeScript antes de commitar.

---

## Commit

```bash
git add -A
git commit -m "feat(admin): content editor V1 — ebook + templates editáveis via admin

- Tabela content_edits no Supabase (migration 009) como override layer
- getContentOverride() com unstable_cache + revalidateTag('content-overrides')
- readEbook + readTemplates verificam DB antes de usar filesystem
- Server actions: saveContentEdit + revertContentEdit + listContentEdits
- Componente <MarkdownEditor> com toolbar H2/H3/Bold + save + revert
- /admin/content: lista todos os conteúdos com badge 'Editado'
- /admin/content/[type]/[slug]: editor por peça de conteúdo
- Restrito a giovanni@scient.cc via requireAdmin()"

git push origin main
```

---

## Instruções para Giovanni após o deploy

1. **Aplicar migration SQL** no Supabase Dashboard → SQL Editor → colar e rodar o conteúdo de `supabase/migrations/20260529_009_content_edits.sql`
2. **Acessar** `https://gtm-blackbox.vercel.app/admin/content` com sua conta `giovanni@scient.cc`
3. **Editar** qualquer capítulo ou seção de template
4. **Reverter** apaga o override do DB e volta para o MDX original do filesystem

---

## O que NÃO está no V1 (backlog)

- Preview ao vivo do MDX renderizado
- Edição do frontmatter (título, ordem, metadados)
- Criar novos capítulos ou templates pela UI
- Histórico de versões / diff
- Upload de imagens
- Outros tipos de conteúdo (emails de drip, perguntas do diagnóstico)
