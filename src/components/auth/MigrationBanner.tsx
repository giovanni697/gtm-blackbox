import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { formatCutoffDate, type MigrationStatus } from '@/lib/auth/email-migration'

interface Props {
  status: Extract<MigrationStatus, { needsMigration: true }>
}

export function MigrationBanner({ status }: Props) {
  const { daysLeft, expired } = status
  const cutoffDateLabel = formatCutoffDate()

  if (expired) {
    return (
      <div className="border-b border-red-200 bg-red-50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 md:px-6">
          <AlertTriangle
            size={14}
            strokeWidth={1.75}
            className="shrink-0 text-red-600"
            aria-hidden
          />
          <p className="flex-1 font-sora text-3xs leading-relaxed text-red-900 md:text-2xs">
            <span className="font-medium">Prazo expirado.</span> Seu cadastro usa e-mail pessoal e o
            acesso será revogado em breve. Contate{' '}
            <a
              href="mailto:giovanni@scient.cc"
              className="underline decoration-red-400 underline-offset-2 hover:text-red-700"
            >
              giovanni@scient.cc
            </a>{' '}
            para regularizar.
          </p>
        </div>
      </div>
    )
  }

  const dayLabel = daysLeft === 1 ? 'dia' : 'dias'
  const pulseClass = daysLeft <= 3 ? 'text-amber-700' : 'text-amber-600'

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:gap-4 md:px-6">
        <div className="flex items-start gap-2 md:flex-1 md:items-center">
          <AlertTriangle
            size={14}
            strokeWidth={1.75}
            className={`mt-0.5 shrink-0 md:mt-0 ${pulseClass}`}
            aria-hidden
          />
          <p className="font-sora text-3xs leading-relaxed text-amber-900 md:text-2xs">
            Seu cadastro usa e-mail pessoal.{' '}
            <span className="font-medium">
              Migre para um e-mail corporativo até {cutoffDateLabel}
            </span>{' '}
            ({daysLeft} {dayLabel} restante{daysLeft === 1 ? '' : 's'}).
          </p>
        </div>
        <Link
          href="/migrar-email"
          className="inline-flex shrink-0 items-center gap-1.5 self-start font-sora text-3xs uppercase tracking-widest text-amber-900 underline decoration-amber-400 underline-offset-2 hover:text-amber-700 md:self-auto"
        >
          Como migrar
          <ArrowRight size={11} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
