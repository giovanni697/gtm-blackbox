'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Home, BookOpen, Compass, Layers, Calculator, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/hub', label: 'Hub', icon: Home },
  { href: '/ebook', label: 'Ebook', icon: BookOpen },
  { href: '/diagnostico', label: 'Diagnóstico', icon: Compass },
  { href: '/templates', label: 'Templates', icon: Layers },
  { href: '/forecast', label: 'Forecast', icon: Calculator },
]

export function MobileNav({ user }: { user: { nome: string | null; email: string | null } }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-scient-dark px-4 md:hidden">
        <Link href="/hub" className="font-lexend text-sm font-semibold tracking-widest text-white">
          SCIENT
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          className="text-white"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-scient-dark">
            <div className="flex h-14 items-center justify-between border-b border-white/5 px-4">
              <span className="font-lexend text-sm font-semibold tracking-widest text-white">
                SCIENT
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="text-white/70"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 p-3">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-3 font-sora text-2xs uppercase tracking-widest',
                      active
                        ? 'bg-scient-primary text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-white/5 p-3">
              <a
                href={certUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-scient-primary/40 bg-white/[0.02] p-3"
              >
                <p className="font-sora text-3xs uppercase tracking-widest text-scient-primary">
                  Certificação GTM Engineer
                  <ExternalLink size={10} className="ml-1 inline" strokeWidth={1.5} />
                </p>
              </a>
              <p className="mt-3 truncate font-sora text-2xs text-white/70">
                {user.nome ?? user.email}
              </p>
              <form action="/auth/logout" method="POST" className="mt-2">
                <button
                  type="submit"
                  className="w-full px-3 py-2 text-left font-sora text-3xs uppercase tracking-widest text-white/50"
                >
                  Sair
                </button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
