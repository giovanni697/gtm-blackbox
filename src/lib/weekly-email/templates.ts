import type { Segment, ProfileRow, DiagnosticoRow } from './segments'
import { PILAR_NAMES } from './segments'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gtm.scient.cc'

interface EmailTemplate {
  subject: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
  feedbackQuestion: string
}

function firstName(nome: string): string {
  return nome.split(' ')[0]
}

export function buildWeeklyTemplate(
  profile: ProfileRow,
  segment: Segment,
  lastDiag: DiagnosticoRow | null,
): EmailTemplate {
  const nome = firstName(profile.nome)
  const empresa = profile.empresa ?? 'sua empresa'

  switch (segment) {
    // ── Não preencheu perfil ──────────────────────────────────────────────────
    case 'no_profile':
      return {
        subject: `${nome}, falta um passo para começar o diagnóstico`,
        bodyHtml: `
<p>${nome},</p>
<p>Você se cadastrou no GTM BlackBox mas ainda não preencheu seu perfil de empresa.</p>
<p>Sem isso não consigo personalizar o diagnóstico para você — e o diagnóstico é onde tudo começa: ele mapeia os 5 pilares do seu GTM, identifica o gargalo principal e gera um roadmap de ações priorizadas.</p>
<p>Leva 2 minutos preencher. Depois disso, o diagnóstico em si são 8 minutos.</p>
        `,
        ctaText: 'Completar meu perfil',
        ctaUrl: `${BASE}/diagnostico/onboarding`,
        feedbackQuestion: `O que está te impedindo de começar, ${nome}? Falta de tempo, dúvida sobre o produto, ou algo externo?`,
      }

    // ── Tem perfil, nunca iniciou ─────────────────────────────────────────────
    case 'onboarded':
      return {
        subject: `${nome}, o diagnóstico da ${empresa} ainda não foi feito`,
        bodyHtml: `
<p>${nome},</p>
<p>Você está cadastrado no GTM BlackBox com o perfil da ${empresa} — mas o diagnóstico GTM ainda não foi rodado.</p>
<p>O diagnóstico avalia 5 pilares: Geração, Conversão, Expansão, Retenção e Monetização. No final, você recebe um <strong>score de maturidade</strong>, o <strong>gargalo principal</strong> identificado e um <strong>roadmap com ações concretas</strong> para atacá-lo.</p>
<p>É uma fotografia do seu GTM hoje. Leva 8 minutos.</p>
        `,
        ctaText: 'Iniciar o diagnóstico',
        ctaUrl: `${BASE}/diagnostico`,
        feedbackQuestion: `O que está te impedindo de rodar o diagnóstico da ${empresa}?`,
      }

    // ── Iniciou mas não concluiu ──────────────────────────────────────────────
    case 'dropped':
      return {
        subject: `${nome}, você parou no meio do diagnóstico`,
        bodyHtml: `
<p>${nome},</p>
<p>Você entrou no GTM BlackBox, preencheu o perfil da ${empresa} — e iniciou o diagnóstico. Mas parou antes de terminar.</p>
<p>O diagnóstico fica salvo automaticamente onde você parou. Basta continuar de onde saiu — são poucos minutos para fechar.</p>
<p>No final: mapa de maturidade + gargalo + roadmap priorizado. Vale terminar.</p>
        `,
        ctaText: 'Continuar o diagnóstico',
        ctaUrl: `${BASE}/diagnostico`,
        feedbackQuestion: `O que te fez pausar, ${nome}? Uma pergunta que não fez sentido, falta de tempo, ou algo externo?`,
      }

    // ── Diagnóstico feito, sem forecast ───────────────────────────────────────
    case 'diagnosed': {
      const pilar = lastDiag ? (PILAR_NAMES[lastDiag.gargalo_pilar] ?? 'GTM') : 'GTM'
      const maturidade = lastDiag ? `${lastDiag.percentual_maturidade.toFixed(0)}%` : null
      const maturidadeTexto = maturidade
        ? `com <strong>${maturidade} de maturidade GTM</strong> e`
        : 'com'
      return {
        subject: `${nome}, seu gargalo é ${pilar} — próximo passo: Forecast`,
        bodyHtml: `
<p>${nome},</p>
<p>Você completou o diagnóstico da ${empresa} ${maturidadeTexto} gargalo identificado em <strong>${pilar}</strong>.</p>
<p>O roadmap foi gerado. Mas antes de executar, uma pergunta importante: <strong>você tem capacity para atacar esse gargalo?</strong></p>
<p>O <strong>Forecast de Capacidade</strong> responde isso. Ele mapeia se você tem BDRs, AEs ou CS suficientes para os seus targets — ou se o gargalo também está no time.</p>
<p>Leva 5 minutos. É o próximo passo natural depois do diagnóstico.</p>
        `,
        ctaText: 'Rodar o Forecast',
        ctaUrl: `${BASE}/forecast`,
        feedbackQuestion: `Na ${empresa}, você já está executando algo do roadmap que o diagnóstico gerou — ou ainda está priorizando o que atacar primeiro?`,
      }
    }

    // ── Power user: ambos feitos ──────────────────────────────────────────────
    case 'power_user': {
      const pilar = lastDiag ? (PILAR_NAMES[lastDiag.gargalo_pilar] ?? 'GTM') : 'GTM'
      return {
        subject: `${nome}, o que mudou no GTM da ${empresa} essa semana?`,
        bodyHtml: `
<p>${nome},</p>
<p>Você está entre os poucos usuários que completaram tanto o diagnóstico quanto o Forecast no GTM BlackBox. Isso coloca você num grupo pequeno — menos de 2% dos cadastros.</p>
<p>Seu gargalo identificado foi <strong>${pilar}</strong>. Seu roadmap está gerado.</p>
<p>A pergunta desta semana é simples: <strong>o que você fez com isso?</strong> Algo foi executado? Algo bloqueou? O dado mudou alguma decisão?</p>
<p>Quero entender como o BlackBox está sendo usado na prática — para melhorar o produto e te mandar insights mais relevantes.</p>
        `,
        ctaText: 'Ver meu roadmap',
        ctaUrl: `${BASE}/diagnostico`,
        feedbackQuestion: `O que você executou do roadmap da ${empresa} essa semana — ou o que está bloqueando a execução?`,
      }
    }
  }
}
