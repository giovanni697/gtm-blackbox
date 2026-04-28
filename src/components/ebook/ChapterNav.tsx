'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import type { ChapterSummary } from '@/lib/content/readEbook'

export function ChapterNav({ chapters }: { chapters: ChapterSummary[] }) {
  const pathname = usePathname()
  const activeSlug = pathname.startsWith('/ebook/') ? pathname.replace('/ebook/', '') : null

  return (
    <nav className="border-scient-divider bg-white p-4 md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:self-start md:overflow-y-auto md:border-r md:p-6">
      <Link
        href="/ebook"
        className={clsx(
          'font-sora text-3xs uppercase tracking-widest transition-colors',
          pathname === '/ebook' ? 'text-scient-primary' : 'text-scient-gray hover:text-scient-dark',
        )}
      >
        Ebook · Metodologia
      </Link>

      <ol className="mt-6 flex flex-col gap-1">
        {chapters.map((chapter) => {
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

      {chapters.length === 0 ? (
        <p className="mt-6 font-sora text-2xs italic text-scient-gray">
          Nenhum capítulo publicado ainda.
        </p>
      ) : null}
    </nav>
  )
}
