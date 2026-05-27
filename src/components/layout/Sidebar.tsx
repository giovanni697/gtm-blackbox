'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  BookOpen,
  Compass,
  Layers,
  Calculator,
  Settings,
  ExternalLink,
  MessageSquare,
  X,
  Menu,
  ChevronLeft,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useSidebar } from '@/components/layout/SidebarProvider'

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
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ user }: { user: { nome: string | null; email: string | null } }) {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'
  const initial = (user.nome ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <aside
      className={clsx(
        'hidden shrink-0 flex-col bg-scient-dark',
        'md:sticky md:top-0 md:flex md:h-screen md:self-start md:overflow-y-auto',
        'transition-all duration-200 ease-in-out',
        collapsed ? 'md:w-14' : 'md:w-56',
      )}
    >
      {/* ── Brand / Toggle ──────────────────────────── */}
      <div
        className={clsx(
          'flex h-14 shrink-0 items-center border-b border-white/5',
          collapsed ? 'justify-center px-0' : 'justify-between px-4',
        )}
      >
        {!collapsed && (
          <Link
            href="/hub"
            className="font-lexend text-sm font-semibold tracking-widest text-white"
          >
            SCIENT
          </Link>
        )}
        <button
          onClick={toggle}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className="flex h-8 w-8 items-center justify-center text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <Menu size={15} strokeWidth={1.5} />
          ) : (
            <ChevronLeft size={15} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map((item) => {
          const active = item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                'flex items-center gap-2.5 py-2 font-sora text-2xs uppercase tracking-widest transition-colors',
                collapsed ? 'justify-center px-0' : 'px-3',
                active
                  ? 'bg-scient-primary text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon size={14} strokeWidth={1.5} className="shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* ── CTA Certificação ────────────────────────── */}
      {!collapsed && (
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
      )}

      {/* ── User badge + Logout ─────────────────────── */}
      <div
        className={clsx(
          'border-t border-white/5',
          collapsed ? 'flex flex-col items-center gap-1 py-3' : 'p-3',
        )}
      >
        {collapsed ? (
          /* Modo colapsado: inicial + ícone de logout */
          <>
            <div
              title={user.nome ?? user.email ?? ''}
              className="flex h-7 w-7 items-center justify-center bg-scient-primary text-white"
            >
              <span className="font-sora text-2xs font-semibold">{initial}</span>
            </div>
            <form action="/auth/logout" method="POST">
              <button
                type="submit"
                title="Sair"
                className="flex h-7 w-7 items-center justify-center text-white/30 transition-colors hover:text-white"
              >
                <LogOut size={12} strokeWidth={1.5} />
              </button>
            </form>
          </>
        ) : (
          /* Modo expandido: comportamento original */
          <>
            <div className="flex items-center gap-2.5 px-1 py-1">
              <div className="flex h-7 w-7 items-center justify-center bg-scient-primary text-white">
                <span className="font-sora text-2xs font-semibold">{initial}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sora text-2xs text-white">{user.nome ?? user.email}</p>
                <p className="truncate font-sora text-3xs text-white/40">{user.email}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-1">
              {feedbackOpen && (
                <div className="border border-white/10 bg-scient-dark-2 px-3 py-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-sora text-3xs uppercase tracking-widest text-white/40">
                      Envie feedback para
                    </span>
                    <button
                      onClick={() => setFeedbackOpen(false)}
                      className="text-white/30 hover:text-white"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <p className="font-sora text-2xs text-white">giovanni@scient.cc</p>
                  <p className="mt-0.5 font-sora text-2xs text-white">matheus@scient.cc</p>
                </div>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen((v) => !v)}
                  className="flex flex-1 items-center gap-1.5 px-3 py-1.5 font-sora text-3xs uppercase tracking-widest text-white/50 transition-colors hover:text-white"
                >
                  <MessageSquare size={10} strokeWidth={1.5} />
                  Feedback
                </button>
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
          </>
        )}
      </div>
    </aside>
  )
}
