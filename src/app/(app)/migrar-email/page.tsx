import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCutoffDate, getMigrationStatus } from '@/lib/auth/email-migration'

export const metadata = {
  title: 'Migrar e-mail · GTM BlackBox',
}

export default async function MigrarEmailPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const migration = getMigrationStatus(user.email)
  const cutoffLabel = formatCutoffDate()

  return (
    <article className="mx-auto max-w-2xl px-6 py-12 md:px-10 md:py-16">
      <Link
        href="/hub"
        className="inline-flex items-center gap-1 font-sora text-3xs uppercase tracking-widest text-scient-gray hover:text-scient-dark"
      >
        <ArrowLeft size={11} strokeWidth={1.5} /> Hub
      </Link>

      <header className="mt-6">
        <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
          Migração de e-mail
        </p>
        <h1 className="mt-3 font-sora text-3xl font-light leading-tight text-scient-dark md:text-4xl">
          Migre para seu e-mail corporativo.
        </h1>
        {migration.needsMigration ? (
          <p className="mt-4 font-sora text-sm leading-relaxed text-scient-gray">
            Seu cadastro usa <span className="text-scient-dark">{user.email}</span>. Você tem até{' '}
            <span className="text-scient-dark">{cutoffLabel}</span>{' '}
            {migration.expired
              ? '— prazo já expirado'
              : `(${migration.daysLeft} ${migration.daysLeft === 1 ? 'dia restante' : 'dias restantes'})`}{' '}
            para mover seu acesso para um e-mail de trabalho.
          </p>
        ) : (
          <p className="mt-4 font-sora text-sm leading-relaxed text-scient-gray">
            Você já está usando um e-mail corporativo (
            <span className="text-scient-dark">{user.email}</span>). Tudo certo aqui.
          </p>
        )}
      </header>

      {migration.needsMigration ? (
        <>
          <section className="mt-12">
            <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
              Por quê
            </p>
            <p className="mt-3 font-sora text-sm leading-relaxed text-scient-dark">
              GTM BlackBox é uma plataforma profissional. Manter o cadastro num e-mail de trabalho:
            </p>
            <ul className="mt-4 space-y-2 font-sora text-sm leading-relaxed text-scient-dark">
              <li>· garante que o acesso permanece com você se trocar de empresa pessoalmente;</li>
              <li>
                · habilita integrações que vamos lançar (SSO via Google Workspace, workspaces no
                Slack, calendário compartilhado);
              </li>
              <li>
                · mantém a comunidade limitada a profissionais de GTM — quem chega aqui vem com
                contexto.
              </li>
            </ul>
          </section>

          <section className="mt-12">
            <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
              Como migrar
            </p>
            <ol className="mt-3 space-y-4 font-sora text-sm leading-relaxed text-scient-dark">
              <li>
                <span className="font-medium">1. Faça logout</span> e crie uma nova conta usando seu
                e-mail de trabalho (ex: nome@suaempresa.com.br).
              </li>
              <li>
                <span className="font-medium">2. Mande um e-mail para o suporte</span> avisando que
                migrou. A gente transfere seus dados (diagnóstico, roadmap, sessões de forecast)
                para a conta nova.
              </li>
              <li>
                <span className="font-medium">3. Confirme</span> que tudo apareceu na conta nova
                (pode levar até 24h).
              </li>
            </ol>
          </section>

          <section className="mt-12 border border-scient-divider bg-white p-6">
            <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
              Suporte
            </p>
            <p className="mt-2 font-sora text-sm leading-relaxed text-scient-dark">
              Mande um e-mail para a gente que respondemos em até 24h úteis.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={`mailto:giovanni@scient.cc?cc=matheus@scient.cc&subject=Migração%20de%20e-mail%20-%20${encodeURIComponent(user.email ?? '')}&body=Oi%20Giovanni%2C%0A%0AMigrei%20do%20e-mail%20${encodeURIComponent(user.email ?? '')}%20para%20%5Bnovo%20e-mail%20corporativo%20aqui%5D.%0A%0AObrigado!`}
                className="inline-flex items-center gap-2 bg-scient-primary px-4 py-2 font-sora text-2xs uppercase tracking-widest text-white hover:bg-scient-primary-hover"
              >
                <Mail size={12} strokeWidth={1.5} />
                Falar com suporte
              </a>
            </div>
          </section>
        </>
      ) : (
        <section className="mt-12 border border-scient-divider bg-white p-6">
          <p className="font-sora text-sm leading-relaxed text-scient-dark">
            Nenhuma ação necessária. Continue usando a plataforma normalmente.
          </p>
          <Link
            href="/hub"
            className="mt-4 inline-flex items-center gap-2 bg-scient-primary px-4 py-2 font-sora text-2xs uppercase tracking-widest text-white hover:bg-scient-primary-hover"
          >
            Voltar ao Hub
          </Link>
        </section>
      )}
    </article>
  )
}
