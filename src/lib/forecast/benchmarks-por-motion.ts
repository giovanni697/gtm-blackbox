import type { Motion } from './types'

export const BENCHMARKS_POR_MOTION: Record<
  Motion,
  {
    sqlsPorSdrPorMes: { min: number; max: number }
    dealsPorAePorMes: { min: number; max: number }
    contasPorCsmMax: number
    ttfiDias: { min: number; max: number }
    cicloDias: { min: number; max: number }
    acvBrl: { min: number; max: number }
  }
> = {
  no_touch: {
    sqlsPorSdrPorMes: { min: 0, max: 0 }, // PLG não usa SDR
    dealsPorAePorMes: { min: 0, max: 0 },
    contasPorCsmMax: 500,
    ttfiDias: { min: 1, max: 14 },
    cicloDias: { min: 1, max: 7 },
    acvBrl: { min: 1000, max: 20000 },
  },
  low_touch: {
    sqlsPorSdrPorMes: { min: 60, max: 100 },
    dealsPorAePorMes: { min: 8, max: 15 },
    contasPorCsmMax: 200,
    ttfiDias: { min: 30, max: 60 },
    cicloDias: { min: 7, max: 30 },
    acvBrl: { min: 5000, max: 50000 },
  },
  mid_touch: {
    sqlsPorSdrPorMes: { min: 30, max: 50 },
    dealsPorAePorMes: { min: 4, max: 8 },
    contasPorCsmMax: 50,
    ttfiDias: { min: 60, max: 90 },
    cicloDias: { min: 30, max: 90 },
    acvBrl: { min: 30000, max: 200000 },
  },
  high_touch: {
    sqlsPorSdrPorMes: { min: 15, max: 25 },
    dealsPorAePorMes: { min: 1, max: 3 },
    contasPorCsmMax: 25,
    ttfiDias: { min: 60, max: 90 },
    cicloDias: { min: 60, max: 180 },
    acvBrl: { min: 100000, max: 1000000 },
  },
  canal: {
    sqlsPorSdrPorMes: { min: 0, max: 0 },
    dealsPorAePorMes: { min: 0, max: 0 },
    contasPorCsmMax: 100,
    ttfiDias: { min: 30, max: 120 },
    cicloDias: { min: 30, max: 180 },
    acvBrl: { min: 5000, max: 500000 },
  },
}

export const MOTION_LABEL: Record<Motion, string> = {
  no_touch: 'No-touch (PLG)',
  low_touch: 'Low-touch',
  mid_touch: 'Mid-touch',
  high_touch: 'High-touch',
  canal: 'Canal (Partner-led)',
}
