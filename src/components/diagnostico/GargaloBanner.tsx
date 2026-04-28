import { AlertTriangle } from 'lucide-react'
import { PILARES, NIVEL_LABELS, type NivelMaturidade } from '@/lib/diagnostico/types'

export function GargaloBanner({
  gargaloPilar,
  nivel,
}: {
  gargaloPilar: 1 | 2 | 3 | 4 | 5
  nivel: NivelMaturidade
}) {
  const pilar = PILARES.find((p) => p.numero === gargaloPilar)!
  return (
    <div className="border border-scient-armv bg-scient-armv/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-scient-armv" />
        <div>
          <p className="font-lexend text-3xs uppercase tracking-widest text-scient-armv">
            Gargalo identificado · TOC
          </p>
          <h3 className="mt-2 font-sora text-lg font-medium text-scient-dark md:text-xl">
            {pilar.nome} · Nível {nivel}/3 · {NIVEL_LABELS[nivel]}
          </h3>
          <p className="mt-3 font-sora text-xs leading-relaxed text-scient-dark md:text-sm">
            Este é o pilar com menor maturidade — segundo a Teoria das Restrições (Goldratt), é o
            que limita o throughput do seu GTM hoje. Atacar outros pilares antes de resolver este
            produz pouco ganho real. Os primeiros sprints do roadmap focam aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
