import type { EmailType, UserUsage } from './types'

export interface Decision {
  variant: string
  payload: Record<string, unknown>
}

const PILAR_NAMES: Record<number, string> = {
  1: 'Arquitetura de Dados',
  2: 'Metodologia Unificada',
  3: 'Processos Padronizados',
  4: 'Stack Parametrizada',
  5: 'Loop de Melhoria Contínua',
}

const PILAR_TO_CHAPTER: Record<number, string> = {
  1: '03-pilar-1-arquitetura-de-dados',
  2: '04-pilar-2-metodologia-unificada',
  3: '05-pilar-3-processos-padronizados',
  4: '06-pilar-4-stack-parametrizada',
  5: '07-pilar-5-loop-de-melhoria-continua',
}

const PILAR_TO_TEMPLATE: Record<number, string> = {
  1: '01-arquitetura-de-dados',
  2: '02-workflow-de-gtm',
  3: '04-roadmap-de-gtm',
  4: '08-parametrizacao-de-stack',
  5: '06-identificacao-de-gargalos',
}

export function decideEmail(type: EmailType, usage: UserUsage): Decision {
  switch (type) {
    case 'drip_d0_welcome':
      return { variant: 'default', payload: { nome: usage.nome } }

    case 'drip_d2_radar':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: 'fez_diagnostico',
          payload: {
            nome: usage.nome,
            gargaloPilar: usage.gargalo,
            gargaloNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return { variant: 'nao_fez', payload: { nome: usage.nome } }

    case 'drip_d5_capitulo':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: `cap_p${usage.gargalo}`,
          payload: {
            nome: usage.nome,
            chapterSlug: PILAR_TO_CHAPTER[usage.gargalo],
            pilarNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return {
        variant: 'nao_fez',
        payload: { nome: usage.nome, chapterSlug: '01-principios-edson-rigonatti' },
      }

    case 'personal_giovanni':
      return pickGiovanniVariant(usage)

    case 'drip_d9_template':
      if (usage.didDiagnostico && usage.gargalo) {
        return {
          variant: `tpl_p${usage.gargalo}`,
          payload: {
            nome: usage.nome,
            templateSlug: PILAR_TO_TEMPLATE[usage.gargalo],
            pilarNome: PILAR_NAMES[usage.gargalo],
          },
        }
      }
      return {
        variant: 'nao_fez',
        payload: { nome: usage.nome, templateSlug: '01-arquitetura-de-dados' },
      }

    case 'drip_d14_verification':
      return { variant: 'default', payload: { nome: usage.nome, didForecast: usage.didForecast } }

    case 'drip_d30_checkpoint':
      return {
        variant: 'default',
        payload: {
          nome: usage.nome,
          didDiagnostico: usage.didDiagnostico,
          didForecast: usage.didForecast,
          gargalo: usage.gargalo,
        },
      }
  }
}

function pickGiovanniVariant(usage: UserUsage): Decision {
  const { didDiagnostico, didForecast, openedTemplates, readChapters } = usage

  if (didDiagnostico && didForecast) {
    return { variant: 'fez_tudo', payload: { nome: usage.nome, gargaloPilar: usage.gargalo } }
  }
  if (didDiagnostico) {
    return { variant: 'so_diag', payload: { nome: usage.nome, gargaloPilar: usage.gargalo } }
  }
  if (openedTemplates.length > 0) {
    return { variant: 'so_template', payload: { nome: usage.nome } }
  }
  if (readChapters > 0) {
    return { variant: 'so_ebook', payload: { nome: usage.nome, readChapters } }
  }
  return { variant: 'zero_ativo', payload: { nome: usage.nome } }
}
