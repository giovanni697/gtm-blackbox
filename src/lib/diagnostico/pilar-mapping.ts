// Bridge entre os 5 pilares do BlackBox e os 7 pilares da v3.5 (legacy).
// Usado se algum dia precisar exportar para o GTM_Brain (deferido — ADR 0013).

export type PilarV35 = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type PilarBlackBox = 1 | 2 | 3 | 4 | 5

export const PILAR_V35_NAMES: Record<PilarV35, string> = {
  1: 'Estratégia',
  2: 'Clientes',
  3: 'Dados',
  4: 'Processos',
  5: 'Metas',
  6: 'Times',
  7: 'Gestão',
}

// BlackBox → quais pilares v3.5 cada um absorve
export const BLACKBOX_TO_V35: Record<PilarBlackBox, PilarV35[]> = {
  1: [3], // Arquitetura de Dados ← Dados (v3.5 P3)
  2: [1, 2], // Metodologia Unificada ← Estratégia (P1) + Clientes (P2)
  3: [4], // Processos Padronizados ← Processos (v3.5 P4)
  4: [6], // Stack Parametrizada ← Times (v3.5 P6, parte ferramentas)
  5: [5, 7], // Loop de Melhoria Contínua ← Metas (P5) + Gestão (P7)
}

// v3.5 → BlackBox (inversa)
export const V35_TO_BLACKBOX: Record<PilarV35, PilarBlackBox> = {
  1: 2,
  2: 2,
  3: 1,
  4: 3,
  5: 5,
  6: 4,
  7: 5,
}
