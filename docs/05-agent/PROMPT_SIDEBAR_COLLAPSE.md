# PROMPT — Sidebar Colapsável com Toggle Hamburguer

## CONTEXTO DO PROJETO

Stack: **Next.js 14.2.35 App Router** + **Tailwind CSS** + **TypeScript** (strict)  
Repo: `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`

### Estrutura de layout atual

O app tem **dois sistemas de sidebar**:

**1. Sidebar principal** (`src/components/layout/Sidebar.tsx`)

- `w-56` (224px), `bg-scient-dark`, sticky, desktop-only (`hidden md:flex`)
- Contém: logo, 5 links de nav, CTA de certificação, user badge + logout
- Sem nenhuma lógica de collapse

**2. ChapterNav do Ebook** (`src/components/ebook/ChapterNav.tsx`)

- `md:w-72` (288px), `bg-white`, sticky, lista os 12 capítulos
- Existe dentro do `src/app/(app)/ebook/layout.tsx`
- Sem nenhuma lógica de collapse

**Layout do app** (`src/app/(app)/layout.tsx`):

```tsx
<div className="flex min-h-screen flex-col bg-scient-bg">
  <div className="flex flex-1 flex-col md:flex-row">
    <Sidebar user={userMeta} />
    <MobileNav user={userMeta} />
    <main className="min-w-0 flex-1">{children}</main>
  </div>
</div>
```

**Layout do ebook** (`src/app/(app)/ebook/layout.tsx`):

```tsx
<div className="flex min-h-screen flex-col md:flex-row">
  <ChapterNav chapters={chapters} />
  <div className="min-w-0 flex-1">{children}</div>
</div>
```

**Tokens de design relevantes** (tailwind.config.ts):

```
scient-dark: '#111111'       ← fundo da sidebar principal
scient-bg: '#F5F5F7'         ← fundo geral
scient-divider: '#E6E6E6'    ← bordas
scient-primary: '#0030E8'    ← azul de destaque
scient-gray: '#585858'       ← texto secundário
```

**Fontes**: `font-sora` (UI), `font-lexend` (destaque)

---

## OBJETIVO

Implementar sidebar colapsável com toggle hamburguer (≡) que:

1. **Sidebar principal**: ao clicar em ≡, contrai de `w-56` para `w-14` (ícones apenas, sem texto). Ao clicar de novo, expande de volta.
2. **ChapterNav do ebook**: botão separado que esconde/mostra o painel lateral de capítulos, dando área de leitura máxima.
3. **Estado persistido** em `localStorage` — o usuário não perde a preferência ao navegar entre páginas.
4. **Transição suave** (`transition-all duration-200 ease-in-out`).
5. **Sem quebrar mobile** — o MobileNav existente não é alterado. O collapse só existe em `md:` e acima.

---

## ARQUIVOS A CRIAR / MODIFICAR

### CRIAR: `src/components/layout/SidebarProvider.tsx`

Contexto client-side que gerencia o estado collapsed e persiste em localStorage.

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type SidebarContextValue = {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  // Lê preferência do localStorage no mount
  useEffect(() => {
    const stored = localStorage.getItem('scient-sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('scient-sidebar-collapsed', String(next))
      return next
    })
  }

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  return useContext(SidebarContext)
}
```

---

### MODIFICAR: `src/app/(app)/layout.tsx`

Envolver com `SidebarProvider` e passar `collapsed` via context (não como prop direta — o Sidebar vai ler do context).

**Mudança:** adicionar `<SidebarProvider>` ao redor do layout interno.

```tsx
// Adicionar import:
import { SidebarProvider } from '@/components/layout/SidebarProvider'

// Envolver o inner div com SidebarProvider:
return (
  <div className="flex min-h-screen flex-col bg-scient-bg">
    {migration.needsMigration ? <MigrationBanner /> : null}
    <SidebarProvider>
      <div className="flex flex-1 flex-col md:flex-row">
        <Sidebar user={userMeta} />
        <MobileNav user={userMeta} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SidebarProvider>
  </div>
)
```

> ⚠️ O layout é Server Component. `SidebarProvider` é `'use client'`, o que é correto — Server Components podem ter Client Components como filhos.

---

### MODIFICAR: `src/components/layout/Sidebar.tsx`

Transformar em Client Component, ler `useSidebar()`, e implementar dois modos visuais:

**Collapsed (`w-14`):**

- Mostra apenas ícones de cada link (sem texto)
- Botão ≡ / ✕ no topo (ou ChevronLeft quando expandido)
- Tooltip com `title=` no hover para acessibilidade

**Expanded (`w-56`):**

- Comportamento atual preservado

**Implementação completa do novo Sidebar.tsx:**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  BarChart2,
  Layout,
  FileText,
  Home,
  ExternalLink,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react'
import { useSidebar } from '@/components/layout/SidebarProvider'

// Mapeamento dos 5 links de navegação (adapte os hrefs/labels conforme o original)
const NAV_ITEMS = [
  { href: '/hub', label: 'Hub', icon: Home },
  { href: '/ebook', label: 'Ebook', icon: BookOpen },
  { href: '/diagnostico', label: 'Diagnóstico', icon: BarChart2 },
  { href: '/templates', label: 'Templates', icon: Layout },
  { href: '/forecast', label: 'Forecast', icon: FileText },
]

type SidebarProps = {
  user: { nome: string | null; email: string }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'

  return (
    <aside
      className={[
        'hidden shrink-0 flex-col bg-scient-dark md:flex',
        'sticky top-0 h-screen self-start overflow-y-auto',
        'transition-all duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-56',
      ].join(' ')}
    >
      {/* ── Cabeçalho com toggle ─────────────────────── */}
      <div
        className={[
          'flex h-14 shrink-0 items-center border-b border-white/10',
          collapsed ? 'justify-center px-0' : 'justify-between px-5',
        ].join(' ')}
      >
        {!collapsed && (
          <span className="font-lexend text-2xs font-semibold uppercase tracking-widest text-white/60">
            SCIENT
          </span>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex h-8 w-8 items-center justify-center rounded text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <Menu size={16} strokeWidth={1.5} />
          ) : (
            <ChevronLeft size={16} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* ── Navegação ─────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={[
                'flex items-center gap-3 rounded px-2 py-2 transition-colors',
                'font-sora text-xs',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:bg-white/5 hover:text-white',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
            >
              <Icon size={16} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* ── CTA Certificação ──────────────────────────── */}
      {!collapsed && (
        <div className="border-t border-white/10 px-4 py-4">
          <a
            href={certUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-sora text-3xs uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
          >
            <ExternalLink size={10} strokeWidth={1.5} />
            Certificação GTM
          </a>
        </div>
      )}

      {/* ── User badge + Logout ───────────────────────── */}
      <div
        className={[
          'border-t border-white/10 py-3',
          collapsed ? 'flex flex-col items-center gap-2 px-0' : 'px-4',
        ].join(' ')}
      >
        {!collapsed && (
          <p className="truncate font-sora text-3xs text-white/40">{user.nome ?? user.email}</p>
        )}
        <form action="/auth/logout" method="POST">
          <button
            type="submit"
            title="Sair"
            className={[
              'flex items-center gap-2 rounded font-sora text-3xs uppercase tracking-widest',
              'text-white/30 transition-colors hover:text-white/60',
              collapsed ? 'justify-center px-2 py-2' : 'mt-1 px-0 py-1',
            ].join(' ')}
          >
            <LogOut size={12} strokeWidth={1.5} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </form>
      </div>
    </aside>
  )
}
```

> ⚠️ Preserve exatamente o `action="/auth/logout" method="POST"` do logout — não altere.
> ⚠️ Preserve o CTA de certificação com `NEXT_PUBLIC_CERTIFICATION_URL`.
> ⚠️ Verifique o tipo exato de `SidebarProps` no arquivo original e mantenha compatível.

---

### CRIAR: `src/components/ebook/ChapterNavToggle.tsx`

Botão flutuante que aparece na borda esquerda da área de leitura quando o ChapterNav está escondido.

```tsx
'use client'

import { ChevronRight } from 'lucide-react'

type Props = {
  onClick: () => void
}

export function ChapterNavToggle({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Mostrar capítulos"
      className="fixed left-0 top-1/2 z-30 flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-r bg-scient-divider text-scient-gray shadow-sm transition-colors hover:bg-scient-primary hover:text-white"
    >
      <ChevronRight size={12} strokeWidth={2} />
    </button>
  )
}
```

---

### MODIFICAR: `src/components/ebook/ChapterNav.tsx`

Transformar em Client Component com estado `visible` (persistido em localStorage) e botão de fechar.

**Lógica de estado:**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ChapterNavToggle } from './ChapterNavToggle'
import type { ChapterSummary } from '@/lib/content/readEbook'

type Props = {
  chapters: ChapterSummary[]
}

export function ChapterNav({ chapters }: Props) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('scient-chapternav-visible')
    if (stored === 'false') setVisible(false)
  }, [])

  const hide = () => {
    setVisible(false)
    localStorage.setItem('scient-chapternav-visible', 'false')
  }

  const show = () => {
    setVisible(true)
    localStorage.setItem('scient-chapternav-visible', 'true')
  }

  return (
    <>
      {/* Botão flutuante quando oculto */}
      {!visible && <ChapterNavToggle onClick={show} />}

      {/* Painel de capítulos */}
      <aside
        className={[
          'border-scient-divider bg-white transition-all duration-200 ease-in-out',
          'md:sticky md:top-0 md:h-screen md:shrink-0 md:self-start md:overflow-y-auto',
          visible ? 'md:w-72' : 'md:w-0 md:overflow-hidden md:border-0',
          // mobile: comportamento original (full width, não sticky)
          visible ? 'border-b p-4 md:border-b-0 md:border-r md:p-6' : 'hidden md:block',
        ].join(' ')}
      >
        {/* Cabeçalho com botão de fechar */}
        <div className="mb-4 flex items-center justify-between">
          <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">Capítulos</p>
          <button
            onClick={hide}
            title="Ocultar capítulos"
            className="hidden h-7 w-7 items-center justify-center rounded text-scient-gray transition-colors hover:bg-scient-bg hover:text-scient-dark md:flex"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Lista de capítulos */}
        <ol className="flex flex-col gap-0.5">
          {chapters.map((chapter) => {
            const active = pathname === `/ebook/${chapter.slug}`
            return (
              <li key={chapter.slug}>
                <Link
                  href={`/ebook/${chapter.slug}`}
                  className={[
                    'flex items-start gap-3 rounded px-2 py-2 transition-colors',
                    'font-sora text-xs leading-snug',
                    active
                      ? 'bg-scient-primary-soft text-scient-primary'
                      : 'text-scient-gray hover:bg-scient-bg hover:text-scient-dark',
                  ].join(' ')}
                >
                  <span className="mt-0.5 w-5 shrink-0 font-lexend text-3xs tracking-widest opacity-50">
                    {String(chapter.order).padStart(2, '0')}
                  </span>
                  <span>{chapter.title}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      </aside>
    </>
  )
}
```

---

### MODIFICAR: `src/app/(app)/ebook/layout.tsx`

O layout do ebook usa `listChapters()` (server) para passar ao ChapterNav (agora client). Isso já funciona — Server Components podem passar dados para Client Components como props.

Nenhuma mudança estrutural necessária. **Apenas verificar** que o import do ChapterNav ainda funciona após a conversão para `'use client'`.

```tsx
// src/app/(app)/ebook/layout.tsx — sem mudança no JSX
// Confirmar que ChapterNav está importado de @/components/ebook/ChapterNav
import { ChapterNav } from '@/components/ebook/ChapterNav'
import { listChapters } from '@/lib/content/readEbook'

export default async function EbookLayout({ children }: { children: React.ReactNode }) {
  const chapters = await listChapters()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <ChapterNav chapters={chapters} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
```

---

## COMPORTAMENTO ESPERADO APÓS IMPLEMENTAÇÃO

### Sidebar principal (desktop)

| Estado              | Largura        | Visual                                              |
| ------------------- | -------------- | --------------------------------------------------- |
| Expandida (default) | `w-56` (224px) | Logo + texto + nav com labels + CTA + user badge    |
| Colapsada           | `w-14` (56px)  | Só ícones + botão toggle no topo. Tooltip no hover. |

- Botão toggle: `<ChevronLeft>` quando expandida, `<Menu>` quando colapsada
- Transição: `transition-all duration-200 ease-in-out`
- Estado persiste em `localStorage` key `scient-sidebar-collapsed`

### ChapterNav do ebook (desktop)

| Estado            | Largura                   | Visual                                                              |
| ----------------- | ------------------------- | ------------------------------------------------------------------- |
| Visível (default) | `w-72` (288px)            | Lista de capítulos com botão ← para fechar                          |
| Oculto            | `w-0` + `overflow-hidden` | Invisível. Botão flutuante `>` aparece na borda esquerda da leitura |

- Estado persiste em `localStorage` key `scient-chapternav-visible`
- Botão flutuante: pequena aba de 20×48px na borda esquerda, `z-30`

### Mobile (< md)

- Sidebar principal: **sem mudança** — continua hidden, MobileNav cuida disso
- ChapterNav: **sem mudança** — continua como bloco full-width no topo

---

## PROCESSO DE IMPLEMENTAÇÃO

```bash
# 1. Criar SidebarProvider
# 2. Modificar layout.tsx (adicionar SidebarProvider)
# 3. Reescrever Sidebar.tsx
# 4. Criar ChapterNavToggle.tsx
# 5. Reescrever ChapterNav.tsx
# 6. Verificar ebook/layout.tsx (provavelmente nenhuma mudança)

# Verificar type-check e lint
npm run type-check
npm run lint

# Testar build
npm run build

# Testar localmente
npm run dev
```

---

## CRITÉRIOS DE SUCESSO

- [ ] Sidebar principal colapsa de `w-56` para `w-14` ao clicar em ≡ / `<ChevronLeft>`
- [ ] Estado de collapse persiste ao navegar para outra página
- [ ] Ao colapsar, apenas ícones são visíveis (sem texto vazando)
- [ ] Tooltip `title=` aparece no hover quando colapsado
- [ ] ChapterNav do ebook some com `w-0` ao clicar em `←`
- [ ] Botão flutuante `>` reaparece na borda esquerda quando ChapterNav está oculto
- [ ] Estado do ChapterNav persiste em localStorage
- [ ] Mobile: comportamento anterior 100% preservado (MobileNav intocado)
- [ ] `npm run type-check` passa sem erros
- [ ] `npm run lint` passa sem warnings
- [ ] `npm run build` passa sem erros

---

## CONSTRAINTS

1. ❌ Não altere `MobileNav.tsx`
2. ❌ Não altere o `action="/auth/logout"` do form de logout
3. ❌ Não use state management externo (Zustand, Redux) — só `useState` + `localStorage`
4. ❌ Não adicione `framer-motion` ou outras dependências de animação — só Tailwind transitions
5. ❌ Não altere nenhum arquivo de `content/`
6. ✅ Use apenas tokens do design system (`scient-*`) — não invente cores hardcoded
7. ✅ Preserve `'server-only'` em readEbook.ts e readTemplates.ts
8. ✅ O `SidebarProvider` deve ser `'use client'` e o layout do app pode continuar Server Component
