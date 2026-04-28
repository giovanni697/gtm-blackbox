import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-scient-bg">
      <header className="border-b border-scient-divider bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-lexend text-sm font-semibold tracking-widest text-scient-dark"
          >
            SCIENT · GTM BLACKBOX
          </Link>
          <Link
            href="/"
            className="font-sora text-2xs uppercase tracking-widest text-scient-gray hover:text-scient-dark"
          >
            ← Voltar
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">{children}</main>
    </div>
  )
}
