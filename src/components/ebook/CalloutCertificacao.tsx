import { ExternalLink } from 'lucide-react'

const COPY: Record<string, { eyebrow: string; title: string; cta: string }> = {
  default: {
    eyebrow: 'Certificação · Próxima Cohort',
    title: 'Quer ouvir o Edson explicar isso ao vivo?',
    cta: 'Ver detalhes da certificação',
  },
  'principios-edson': {
    eyebrow: 'Certificação GTM Engineer',
    title: 'Quer absorver os princípios do Edson com aplicação prática?',
    cta: 'Próxima Cohort · ver datas',
  },
  'pilar-1': {
    eyebrow: 'Sprint 01 da Certificação',
    title: 'Arquitetura de Dados em profundidade — em 2 semanas.',
    cta: 'Conhecer o programa',
  },
  'pilar-5': {
    eyebrow: 'Sprint 02 da Certificação',
    title: 'MBR + TOC + Roadmap são a base da Sprint 02.',
    cta: 'Ver módulo completo',
  },
  'componente-ai-native': {
    eyebrow: 'Cohort 3 · projeto aplicado',
    title: 'Construa seu primeiro agente GTM na Cohort 3.',
    cta: 'Reservar vaga',
  },
}

export function CalloutCertificacao({ chapter = 'default' }: { chapter?: string }) {
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'
  const c = COPY[chapter] ?? COPY.default!

  return (
    <aside className="not-prose my-10 bg-scient-dark px-6 py-8 text-white md:px-10 md:py-10">
      <p className="font-lexend text-3xs uppercase tracking-widest text-white/60">{c.eyebrow}</p>
      <h4 className="mt-3 max-w-2xl font-sora text-lg font-light leading-snug md:text-xl">
        {c.title}
      </h4>
      <a
        href={certUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 bg-scient-primary px-5 py-2.5 font-sora text-2xs uppercase tracking-widest hover:bg-scient-primary-hover"
      >
        {c.cta} <ExternalLink size={12} strokeWidth={1.5} />
      </a>
    </aside>
  )
}
