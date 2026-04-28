import type { Metadata } from 'next'
import { Sora, Lexend } from 'next/font/google'
import './globals.css'

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GTM BlackBox · SCIENT',
  description:
    'A Engenharia de Go-to-Market em uma única plataforma. Ebook + Diagnóstico + Templates + Forecast & Capacity. Open-source.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${sora.variable} ${lexend.variable}`}>
      <body className="font-sora antialiased">{children}</body>
    </html>
  )
}
