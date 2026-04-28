import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

export default function LandingPage() {
  const certUrl = process.env.NEXT_PUBLIC_CERTIFICATION_URL ?? 'http://gtme.scient.cc'

  return (
    <main className="min-h-screen bg-scient-bg">
      {/* ─── Hero ───────────────────────────────────────────────── */}
      <section className="bg-scient-dark text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-24">
          <p className="font-lexend text-2xs uppercase tracking-widest text-white/60">
            SCIENT · GTM BLACKBOX
          </p>
          <h1 className="mt-6 font-sora text-3xl font-light leading-tight md:text-5xl">
            A Engenharia de Go-to-Market
            <br />
            em uma única plataforma.
          </h1>
          <p className="mt-6 max-w-2xl font-sora text-sm leading-relaxed text-white/70 md:text-base">
            Ebook · Diagnóstico · Templates · Forecast & Capacity. Open-source, freemium. Em ~90
            minutos você sai com um roadmap priorizado por gargalo (TOC) e um plano de capacity
            multi-motion.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-scient-primary px-6 py-3 font-sora text-xs text-white transition-colors hover:bg-scient-primary-hover"
            >
              Acessar grátis <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 font-sora text-xs text-white transition-colors hover:bg-white/5"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 4 Módulos ──────────────────────────────────────────── */}
      <section className="border-y border-scient-divider bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
          <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Os 4 módulos
          </p>
          <h2 className="mt-3 font-sora text-2xl font-light text-scient-dark md:text-3xl">
            Conhecimento, diagnóstico,
            <br className="hidden md:inline" />
            implementação e capacity.
          </h2>

          <div className="mt-12 grid gap-px bg-scient-divider md:grid-cols-2">
            <ModuleCell
              num="01"
              title="Ebook · Metodologia"
              text="12 capítulos top-down a partir dos princípios do Edson Rigonatti. Produtividade Humana como norte; IA como multiplicador, não substituto."
              meta="~3h leitura"
            />
            <ModuleCell
              num="02"
              title="Diagnóstico de Maturidade"
              text="Avalie os 5 pilares (Arquitetura de Dados, Metodologia, Processos, Stack, Loop). Receba roadmap priorizado pelo gargalo via TOC."
              meta="~30min · exportável"
            />
            <ModuleCell
              num="03"
              title="Templates & Rubricas"
              text="8 templates implementáveis: Arquitetura, Workflow, Handbooks 2-3p, Roadmap, MBR, Gargalos, Planos de Ação, Parametrização de Stack."
              meta="8 prontos"
            />
            <ModuleCell
              num="04"
              title="Forecast & Capacity"
              text="Calculadora multi-motion. Inputs do funil + benchmarks ICONIQ/Pavilion → verdict de capacity por função e hiring plan com viabilidade temporal."
              meta="~15min · multi-motion"
            />
          </div>
        </div>
      </section>

      {/* ─── Princípios (preview) ───────────────────────────────── */}
      <section className="bg-scient-bg">
        <div className="mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-24">
          <p className="font-sora text-3xs uppercase tracking-widest text-scient-gray">
            Princípios
          </p>
          <h2 className="mt-3 max-w-3xl font-sora text-2xl font-light leading-tight text-scient-dark md:text-3xl">
            &ldquo;IA não vai te substituir. Vai substituir quem não usa IA. Mas é multiplicadora,
            não substituta.&rdquo;
          </h2>
          <p className="mt-4 font-sora text-xs uppercase tracking-widest text-scient-gray">
            — Edson Rigonatti
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              {
                label: 'Produtividade',
                text: 'Norte do top-down — todos os pilares descem disso.',
              },
              { label: 'Foco', text: '1 persona × 1 produto × 1 fonte × 1 modal.' },
              { label: 'Metabolismo', text: '60% execução · 30% melhoria · 10% corte.' },
              { label: 'Velocidade', text: 'Triple-triple-double-double-double — tropa de elite.' },
            ].map((p) => (
              <div key={p.label} className="border-l border-scient-divider pl-4">
                <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">
                  {p.label}
                </p>
                <p className="mt-2 font-sora text-xs leading-relaxed text-scient-dark">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Certificação ───────────────────────────────────── */}
      <section className="bg-scient-dark text-white">
        <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-20">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="font-lexend text-2xs uppercase tracking-widest text-white/60">
                Certificação · próxima cohort
              </p>
              <h2 className="mt-4 font-sora text-2xl font-light leading-tight md:text-3xl">
                Quer ouvir o Edson explicar isso ao vivo?
              </h2>
              <p className="mt-4 font-sora text-sm text-white/70">
                Certificação GTM Engineer · 8 semanas · masterclasses ao vivo · projeto aplicado.
              </p>
            </div>
            <a
              href={certUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 whitespace-nowrap bg-scient-primary px-6 py-3 font-sora text-xs text-white hover:bg-scient-primary-hover"
            >
              Ver detalhes <ExternalLink size={14} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 px-6 py-8 text-center md:flex-row md:px-10 md:text-left">
          <p className="font-lexend text-3xs uppercase tracking-widest text-scient-gray">
            SCIENT · Scientific AI-Native GTM
          </p>
          <p className="font-sora text-3xs text-scient-gray">
            Open-source · MIT License ·{' '}
            <a
              href="https://github.com/scient-cc/gtm-blackbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-scient-primary underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

function ModuleCell({
  num,
  title,
  text,
  meta,
}: {
  num: string
  title: string
  text: string
  meta: string
}) {
  return (
    <div className="bg-white p-8">
      <p className="font-lexend text-3xs tracking-widest text-scient-gray">{num}</p>
      <h3 className="mt-3 font-sora text-base font-medium text-scient-dark">{title}</h3>
      <p className="mt-3 font-sora text-xs leading-relaxed text-scient-gray">{text}</p>
      <p className="mt-6 font-sora text-3xs uppercase tracking-widest text-scient-primary">
        {meta}
      </p>
    </div>
  )
}
