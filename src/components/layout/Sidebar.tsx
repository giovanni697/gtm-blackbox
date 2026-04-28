'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Compass,
  Layers,
  Calculator,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  matchPrefix?: boolean
}

const NAV: NavItem[] = [
  { href: '/hub', label: 'Hub', icon: Home },
  { href: '/ebook', label: 'Ebook', icon: BookOpen, matchPrefix: true },
  { href: '/diagnostico', label: 'Diagnóstico', icon: Compass, matchPrefix: true },
  { href: '/templates', label: 'Templates', icon: Layers, matchPrefix: true },
  { href: '/forecast', label: 'Forecast', icon: Calculator, matchPrefix: true },
]

export function Sidebar({ user }: { user: { nome: string | null; email: string | null } }) {
  const pathname = usePathname()
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'
  const initial = (user.nome ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <aside className="hidden w-56 shrink-0 flex-col bg-scient-dark md:sticky md:top-0 md:flex md:h-screen md:self-start md:overflow-y-auto">
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-white/5 px-4">
        <Link href="/hub" className="font-lexend text-sm font-semibold tracking-widest text-white">
          SCIENT
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-2.5 px-3 py-2 font-sora text-2xs uppercase tracking-widest transition-colors',
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

      {/* CTA Certificação */}
      <div className="border-t border-white/5 p-3">
        <a
          href={certUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group block border border-scient-primary/40 bg-white/[0.02] p-3 transition-colors hover:bg-scient-primary/10"
        >
          <p className="font-sora text-3xs uppercase tracking-widest text-scient-primary">
            Certificação
          </p>
          <p className="mt-1 font-sora text-2xs text-white">
            GTM Engineer
            <ExternalLink size={10} className="ml-1 inline" strokeWidth={1.5} />
          </p>
          <p className="mt-2 font-sora text-3xs text-white/50">Próxima Cohort</p>
        </a>
      </div>

      {/* User badge + Logout */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="flex h-7 w-7 items-center justify-center bg-scient-primary text-white">
            <span className="font-sora text-2xs font-semibold">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sora text-2xs text-white">{user.nome ?? user.email}</p>
            <p className="truncate font-sora text-3xs text-white/40">{user.email}</p>
          </div>
        </div>
        <div className="mt-2 flex gap-1">
          <a
            href="mailto:giovanni@scient.cc?cc=matheus@scient.cc&subject=Feedback%20GTM%20BlackBox"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center gap-1.5 px-3 py-1.5 font-sora text-3xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
          >
            <MessageSquare size={10} strokeWidth={1.5} />
            Feedback
          </a>
          <form action="/auth/logout" method="POST" className="flex-1">
            <button
              type="submit"
              className="w-full px-3 py-1.5 text-left font-sora text-3xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
