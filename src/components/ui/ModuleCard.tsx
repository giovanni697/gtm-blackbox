import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'

type Status = 'nao-iniciado' | 'em-progresso' | 'concluido' | 'em-construcao'

const STATUS_LABEL: Record<Status, string> = {
  'nao-iniciado': 'Não iniciado',
  'em-progresso': 'Em progresso',
  concluido: 'Concluído',
  'em-construcao': 'Em construção',
}

const STATUS_COLOR: Record<Status, string> = {
  'nao-iniciado': 'text-scient-gray',
  'em-progresso': 'text-scient-armv',
  concluido: 'text-scient-accent',
  'em-construcao': 'text-scient-gray',
}

export function ModuleCard({
  href,
  number,
  title,
  description,
  status,
  meta,
  disabled,
}: {
  href: string
  number: string
  title: string
  description: string
  status: Status
  meta?: string
  disabled?: boolean
}) {
  const Wrapper = disabled ? 'div' : Link
  return (
    <Wrapper
      href={href}
      className={clsx(
        'group relative block border border-scient-divider bg-white p-6 transition-colors',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-scient-primary',
      )}
    >
      <div className="flex items-start justify-between">
        <p className="font-lexend text-3xs tracking-widest text-scient-gray">{number}</p>
        {!disabled ? (
          <ArrowUpRight
            size={14}
            strokeWidth={1.5}
            className="text-scient-gray transition-colors group-hover:text-scient-primary"
          />
        ) : null}
      </div>
      <h3 className="mt-3 font-sora text-base font-medium text-scient-dark">{title}</h3>
      <p className="mt-2 font-sora text-xs leading-relaxed text-scient-gray">{description}</p>
      <div className="mt-6 flex items-center justify-between">
        <span
          className={clsx('font-sora text-3xs uppercase tracking-widest', STATUS_COLOR[status])}
        >
          {STATUS_LABEL[status]}
        </span>
        {meta ? <span className="font-sora text-3xs text-scient-gray">{meta}</span> : null}
      </div>
    </Wrapper>
  )
}
