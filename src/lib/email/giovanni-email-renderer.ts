import type { Decision } from './decisores'
import type { RenderedEmail } from './types'

const PILAR_NAMES: Record<number, string> = {
  1: 'arquitetura de dados',
  2: 'metodologia unificada',
  3: 'processos padronizados',
  4: 'stack parametrizada',
  5: 'loop de melhoria',
}

export function renderGiovanniEmail(decision: Decision): RenderedEmail {
  const firstName = String(decision.payload.nome).split(' ')[0].toLowerCase()
  const subject = pickSubject(decision.variant)

  let body = `oi ${firstName},\n\n`

  switch (decision.variant) {
    case 'fez_tudo': {
      const pilar = decision.payload.gargaloPilar as number | null
      const pilarName = pilar ? PILAR_NAMES[pilar] : 'pilar não identificado'
      body += `vi que você fez o diagnóstico (gargalo em ${pilarName}) e o forecast.\n\nqueria entender duas coisas — o roadmap fez sentido pro seu trimestre? e o capacity verdict, bateu com sua percepção do time atual?`
      break
    }
    case 'so_diag': {
      const pilar = decision.payload.gargaloPilar as number | null
      const pilarName = pilar ? PILAR_NAMES[pilar] : 'pilar não identificado'
      body += `vi que você fez o diagnóstico (gargalo em ${pilarName}).\n\nantes de você implementar — o radar bateu com sua percepção do negócio? algum pilar que ficou sub ou sobre estimado?`
      break
    }
    case 'so_template':
      body +=
        'vi que você abriu um dos templates antes de rodar o diagnóstico.\n\nfaz sentido pro seu momento ou está só explorando? se quiser, me conta em 2-3 linhas onde está hoje (faturamento, time, motion principal) e te aponto por onde começar.'
      break
    case 'so_ebook': {
      const chapters = decision.payload.readChapters as number
      body += `vi que você leu ${chapters} ${chapters === 1 ? 'capítulo' : 'capítulos'} do ebook mas não rodou o diagnóstico ainda.\n\ntem algum tema específico que ressoou? ou ainda está mapeando o que serve pro seu momento?`
      break
    }
    case 'zero_ativo':
      body +=
        'vi que você se cadastrou faz uma semana mas ainda não rodou nenhum módulo.\n\nqueria entender se tem algum bloqueio — falta tempo, achou que ia ser outra coisa, ou só não foi prioridade ainda?'
      break
  }

  body +=
    '\n\nresponde aqui mesmo, eu leio.\n\ngiovanni\nCEO @ SCIENT\nlinkedin.com/in/giovannibsalvador'

  return {
    subject,
    text: body,
    from: 'Giovanni Salvador <giovanni@mail.scient.cc>',
    replyTo: 'giovanni@scient.cc',
  }
}

function pickSubject(variant: string): string {
  const map: Record<string, string> = {
    fez_tudo: 'fez sentido?',
    so_diag: 'rapidinho sobre seu radar',
    so_template: 'antes de implementar',
    so_ebook: 'qual capítulo bateu?',
    zero_ativo: 'tudo bem por aí?',
  }
  return map[variant] ?? 'rapidinho'
}
