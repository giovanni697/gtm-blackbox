'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Compass, Layers, Calculator, Settings } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/hub', label: 'Hub', icon: Home },
  { href: '/ebook', label: 'Ebook', icon: BookOpen },
  { href: '/diagnostico', label: 'Diagnóstico', icon: Compass },
  { href: '/templates', label: 'Templates', icon: Layers },
  { href: '/forecast', label: 'Forecast', icon: Calculator },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY
      setVisible(y < lastY.current || y < 60)
      lastY.current = y
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      {/* Top bar — hides on scroll down */}
      <header
        className={clsx(
          'fixed left-0 right-0 top-0 z-40 flex h-12 items-center border-b border-white/5 bg-scient-dark px-4 md:hidden',
          'transition-transform duration-200',
          visible ? 'translate-y-0' : '-translate-y-full',
        )}
      >
        <Link href="/hub" className="font-lexend text-sm font-semibold tracking-widest text-white">
          SCIENT
        </Link>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-white/5 bg-scient-dark md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={clsx(
                'relative flex flex-1 flex-col items-center justify-center',
                active ? 'text-scient-primary' : 'text-white/40',
              )}
            >
              <Icon size={18} strokeWidth={1.5} />
              {active && (
                <span className="absolute bottom-1.5 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-scient-primary" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
