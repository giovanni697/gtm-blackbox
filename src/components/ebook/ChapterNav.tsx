'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import clsx from 'clsx'
import type { ChapterSummary } from '@/lib/content/readEbook'

const STORAGE_KEY = 'scient-chapternav-visible'

export function ChapterNav({ chapters }: { chapters: ChapterSummary[] }) {
  const pathname = usePathname()
  const activeSlug = pathname.startsWith('/ebook/') ? pathname.replace('/ebook/', '') : null
  const [visible, setVisible] = useState(true)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'false') setVisible(false)
  }, [])

  // limpa busca ao navegar para outro capítulo
  useEffect(() => {
    setQuery('')
  }, [pathname])

  const hide = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, 'false')
  }

  const show = () => {
    setVisible(true)
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const filtered = query.trim()
    ? chapters.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    : chapters

  return (
    <>
      {/* ── Botão flutuante quando oculto (desktop) ── */}
      {!visible && (
        <button
          onClick={show}
          title="Mostrar capítulos"
          className={clsx(
            'fixed left-0 top-1/2 z-30 -translate-y-1/2',
            'hidden flex-col items-center justify-center gap-1 md:flex',
            'h-20 w-5 rounded-r border border-l-0 border-scient-divider bg-white',
            'text-scient-gray shadow-sm transition-colors',
            'hover:border-scient-primary hover:bg-scient-primary hover:text-white',
          )}
        >
          <BookOpen size={10} strokeWidth={1.5} />
          <ChevronRight size={10} strokeWidth={2} />
        </button>
      )}

      {/* ── Painel de capítulos ───────────────────── */}
      <nav
        className={clsx(
          'border-scient-divider bg-white',
          'transition-all duration-200 ease-in-out',
          // desktop
          'md:sticky md:top-0 md:h-screen md:shrink-0 md:self-start md:overflow-y-auto',
          visible ? 'md:w-72 md:border-r md:p-6' : 'md:w-0 md:overflow-hidden md:border-0 md:p-0',
          // mobile: sempre visível como bloco no topo
          'border-b p-4 md:border-b-0',
          !visible && 'hidden md:block',
        )}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <Link
            href="/ebook"
            className={clsx(
              'font-sora text-3xs uppercase tracking-widest transition-colors',
              pathname === '/ebook'
                ? 'text-scient-primary'
                : 'text-scient-gray hover:text-scient-dark',
            )}
          >
            Ebook · Metodologia
          </Link>
          {/* Botão fechar — só desktop */}
          <button
            onClick={hide}
            title="Ocultar capítulos"
            className="hidden h-7 w-7 items-center justify-center text-scient-gray transition-colors hover:bg-scient-bg hover:text-scient-dark md:flex"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Campo de busca ───────────────────────── */}
        <div className="relative mt-4">
          <Search
            size={12}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-scient-gray"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar capítulo…"
            className={clsx(
              'w-full border border-scient-divider bg-scient-bg py-1.5 pl-7 pr-7',
              'font-sora text-2xs text-scient-dark placeholder:text-scient-gray',
              'outline-none transition-colors focus:border-scient-primary',
            )}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-scient-gray hover:text-scient-dark"
              title="Limpar busca"
            >
              <X size={11} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Lista */}
        <ol className="mt-3 flex flex-col gap-1">
          {filtered.map((chapter) => {
            const active = activeSlug === chapter.slug
            return (
              <li key={chapter.slug}>
                <Link
                  href={`/ebook/${chapter.slug}`}
                  className={clsx(
                    'flex items-baseline gap-3 px-3 py-2 font-sora text-xs leading-snug transition-colors',
                    active
                      ? 'bg-scient-primary-soft text-scient-primary'
                      : 'text-scient-dark hover:bg-scient-bg',
                  )}
                >
                  <span className="w-6 shrink-0 font-lexend text-3xs tracking-widest text-scient-gray">
                    {String(chapter.order).padStart(2, '0')}
                  </span>
                  <span>{chapter.title}</span>
                </Link>
              </li>
            )
          })}
        </ol>

        {/* Estados vazios */}
        {chapters.length === 0 && (
          <p className="mt-6 font-sora text-2xs italic text-scient-gray">
            Nenhum capítulo publicado ainda.
          </p>
        )}
        {chapters.length > 0 && filtered.length === 0 && (
          <p className="mt-4 font-sora text-2xs italic text-scient-gray">
            Nenhum capítulo encontrado para &ldquo;{query}&rdquo;.
          </p>
        )}
      </nav>
    </>
  )
}
