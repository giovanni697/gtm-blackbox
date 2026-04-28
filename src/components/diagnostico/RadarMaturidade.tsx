'use client'

import dynamic from 'next/dynamic'
import { PILARES, NIVEL_LABELS, type NivelMaturidade } from '@/lib/diagnostico/types'

const RadarChart = dynamic(() => import('recharts').then((m) => m.RadarChart), { ssr: false })
const PolarGrid = dynamic(() => import('recharts').then((m) => m.PolarGrid), { ssr: false })
const PolarAngleAxis = dynamic(() => import('recharts').then((m) => m.PolarAngleAxis), {
  ssr: false,
})
const PolarRadiusAxis = dynamic(() => import('recharts').then((m) => m.PolarRadiusAxis), {
  ssr: false,
})
const Radar = dynamic(() => import('recharts').then((m) => m.Radar), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), {
  ssr: false,
})

export function RadarMaturidade({
  niveis,
  gargaloPilar,
}: {
  niveis: Record<1 | 2 | 3 | 4 | 5, NivelMaturidade>
  gargaloPilar: 1 | 2 | 3 | 4 | 5
}) {
  const data = PILARES.map((p) => ({
    pilar: `P${p.numero}`,
    nivel: niveis[p.numero],
    ghost: 3,
    fullMark: 3,
  }))

  return (
    <div>
      <div className="relative aspect-square w-full max-w-md border border-scient-divider bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#E6E6E6" />
            <PolarAngleAxis
              dataKey="pilar"
              tick={{ fill: '#585858', fontSize: 11, fontFamily: 'Sora, sans-serif' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 3]} tick={{ fill: '#94A3B8', fontSize: 9 }} />
            {/* Ghost background — always full, very low opacity, gives shape context */}
            <Radar
              name="background"
              dataKey="ghost"
              stroke="#E6E6E6"
              fill="#E6E6E6"
              fillOpacity={0.25}
              strokeWidth={1}
            />
            {/* Actual data radar with dots so each point is visible even at low levels */}
            <Radar
              name="Maturidade"
              dataKey="nivel"
              stroke="#0030E8"
              fill="#0030E8"
              fillOpacity={0.22}
              strokeWidth={2}
              dot={{ fill: '#0030E8', r: 4, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Acessibilidade: tabela equivalente para screen readers */}
      <table className="sr-only">
        <caption>Maturidade por pilar (escala 0-3)</caption>
        <thead>
          <tr>
            <th scope="col">Pilar</th>
            <th scope="col">Nível</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {PILARES.map((p) => (
            <tr key={p.numero}>
              <td>{p.nome}</td>
              <td>{niveis[p.numero]}/3</td>
              <td>
                {NIVEL_LABELS[niveis[p.numero]]}
                {p.numero === gargaloPilar ? ' (gargalo identificado pelo TOC)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
