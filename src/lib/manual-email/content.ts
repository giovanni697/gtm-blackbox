// 9 personalized emails for the first manual outreach campaign.
// Scheduled: 2026-05-05 08:00 BRT (= 11:00 UTC)
// Campaign: activation-wave-1

export interface EmailDraft {
  toEmail: string
  toName: string
  userId: string
  subject: string
  bodyHtml: string
  ctaText: string
  ctaUrl: string
  feedbackQuestion: string
}

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gtm.scient.cc'

export const MANUAL_EMAILS: EmailDraft[] = [
  // ── 1. Leandro Coletti — uMov / CRO / SaaS B2B ─────────────────────────────
  // Diagnóstico ✓ (45.5%, ARPE, P2 Conversão, AI Ready) + Forecast ✓
  {
    toEmail: 'leandrocoletti@gmail.com',
    toName: 'Leandro',
    userId: 'c2040027-cd4e-4521-b024-d4acc1429533',
    subject: 'Leandro, você está no topo 5% do GTM BlackBox',
    bodyHtml: `
<p>Leandro,</p>
<p>Rodei o diagnóstico nos usuários do GTM BlackBox esta semana e encontrei algo interessante: você está entre os <strong>5% com maior maturidade GTM</strong> — 45,5%, no estágio ARPE, e o único usuário com <strong>AI Ready gate ativado</strong>.</p>
<p>Isso significa que a uMov tem a base operacional para escalar com motores de IA no GTM. O seu gargalo atual está no <strong>Pilar 2 — Conversão</strong>. Com o forecast que você rodou, o próximo passo natural é destravar esse pilar antes de escalar capacity.</p>
<p>Tenho uma pergunta direta: <strong>O que está segurando a conversão agora na uMov?</strong> Taxa de fechamento, ciclo de vendas, ou algo no processo de qualificação?</p>
<p>Quero entender antes de montar o próximo passo do seu roadmap.</p>
    `,
    ctaText: 'Ver meu roadmap',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'O que está segurando sua conversão agora — taxa de fechamento, ciclo de vendas ou processo de qualificação?',
  },

  // ── 2. Gabriel — Plannera / SaaS B2B ─────────────────────────────────────
  // Diagnóstico ✓ (28.8%, ARMV, P4 Retenção) — rodou 6×
  {
    toEmail: 'gabriel.moreira@plannera.com.br',
    toName: 'Gabriel',
    userId: '5e0a1d38-c506-4436-bec3-5fa3f3840a55',
    subject: 'Gabriel, você rodou o diagnóstico 6 vezes — o que achou?',
    bodyHtml: `
<p>Gabriel,</p>
<p>Você foi o usuário que mais explorou o GTM BlackBox até agora: <strong>6 rodadas de diagnóstico</strong> na Plannera. Isso me diz que você está levando a sério — e que provavelmente estava testando hipóteses ou calibrando respostas.</p>
<p>O resultado consistente foi: <strong>28,8% de maturidade, estágio ARMV, gargalo no Pilar 4 — Retenção</strong>. O que isso significa na prática: a Plannera está gerando e convertendo clientes, mas perdendo ou não expandindo onde deveria.</p>
<p>O próximo passo que eu recomendaria para você é rodar o <strong>Forecast de Capacidade</strong> — ele vai mostrar se você tem o time certo para atacar esse gargalo de retenção sem comprometer sua geração.</p>
<p>Me conta: o que você estava testando nessas 6 rodadas?</p>
    `,
    ctaText: 'Rodar o Forecast',
    ctaUrl: `${BASE}/forecast`,
    feedbackQuestion:
      'Você rodou o diagnóstico 6 vezes — o que estava testando ou calibrando? O resultado final fez sentido?',
  },

  // ── 3. Weverton Guedes — Unite / Founder / SaaS B2B ────────────────────────
  // Diagnóstico ✓ (18.9%, ARMV, P2 Conversão) — sem Forecast
  {
    toEmail: 'wguedes@unitebr.com',
    toName: 'Weverton',
    userId: '610d8140-8f94-42bb-b9b1-15ef4d203f67',
    subject: 'Weverton, seu gargalo na Unite está em Conversão',
    bodyHtml: `
<p>Weverton,</p>
<p>Você completou o diagnóstico da Unite — 18,9% de maturidade GTM, estágio ARMV. O gargalo que emergiu foi o <strong>Pilar 2: Conversão</strong>.</p>
<p>Na prática, isso indica que a Unite está gerando demanda, mas a máquina de fechar ainda tem ineficiências. Pode ser o processo, o ICP, o ciclo — ou a combinação dos três.</p>
<p>O roadmap foi gerado com 4 ações prioritárias. Antes de executar, quero te sugerir um passo: rode o <strong>Forecast de Capacidade</strong>. Ele vai responder se você tem time suficiente para atacar essas ações — ou se precisa contratar antes de escalar.</p>
<p>Leva 5 minutos.</p>
    `,
    ctaText: 'Rodar o Forecast',
    ctaUrl: `${BASE}/forecast`,
    feedbackQuestion:
      'Na Unite, o problema de conversão está mais no processo de vendas, no perfil do cliente, ou na proposta de valor?',
  },

  // ── 4. Luiz Paulo — Takeat / Diretor de Receita / SaaS B2B ──────────────────
  // Diagnóstico ✓ (20.5%, ARMV, P1 Geração) — sem Forecast
  {
    toEmail: 'luizpaulo@takeat.app',
    toName: 'Luiz Paulo',
    userId: 'de1b6116-c3f0-4ec3-807d-9599cbe49b12',
    subject: 'Luiz Paulo, o gargalo da Takeat está na geração de demanda',
    bodyHtml: `
<p>Luiz Paulo,</p>
<p>O diagnóstico GTM da Takeat apontou <strong>20,5% de maturidade</strong>, estágio ARMV, com gargalo no <strong>Pilar 1 — Geração de Demanda</strong>.</p>
<p>Esse resultado é comum em SaaS B2B com forte produto e time de vendas bom, mas que ainda depende muito de outbound ou indicação sem uma máquina estruturada de entrada. A pergunta que o dado me faz: <strong>Qual é o canal que mais traz deal flow qualificado para a Takeat hoje?</strong></p>
<p>O próximo passo é o <strong>Forecast de Capacidade</strong> — para mapear se você tem BDRs/AEs suficientes para os targets de Q3, ou se o gargalo também está em capacity.</p>
<p>Depois disso, bato um papo sobre as ações do roadmap gerado para você.</p>
    `,
    ctaText: 'Rodar o Forecast',
    ctaUrl: `${BASE}/forecast`,
    feedbackQuestion:
      'Qual canal traz o deal flow mais qualificado para a Takeat hoje — inbound, outbound ou indicação?',
  },

  // ── 5. Reinaldo Heck — RES / CEO / Consultoria ──────────────────────────────
  // Iniciou wizard mas não concluiu
  {
    toEmail: 'reinaldo@impulsesales.co',
    toName: 'Reinaldo',
    userId: '9ad4ca0a-1705-4fa9-a32c-4f32c3f3811e',
    subject: 'Reinaldo, você parou no meio do diagnóstico',
    bodyHtml: `
<p>Reinaldo,</p>
<p>Você entrou no GTM BlackBox, configurou o perfil da RES — e iniciou o diagnóstico. Mas parou antes de terminar.</p>
<p>Não sei o que aconteceu. Pode ter sido o tempo, uma dúvida no meio do caminho, ou simplesmente uma interrupção. Por isso estou te escrevendo diretamente.</p>
<p>O diagnóstico leva cerca de <strong>8 minutos</strong>. Você responde 5 pilares do seu GTM e, no final, recebe um mapa de maturidade + gargalo + roadmap de ações priorizadas. Para uma consultoria como a RES, os dados saem bem calibrados.</p>
<p>Vale terminar.</p>
    `,
    ctaText: 'Continuar o diagnóstico',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'O que te fez pausar no diagnóstico — tempo, dúvida numa pergunta, ou algo externo?',
  },

  // ── 6. Douglas de Oliveira — EasyPro Tech / Executivo de Contas / IndTech ────
  // Iniciou wizard mas não concluiu
  {
    toEmail: 'dougoliveirasouza@gmail.com',
    toName: 'Douglas',
    userId: '70f3f61f-65d9-46bd-ab75-768cf86cdbe6',
    subject: 'Douglas, você iniciou — mas não terminou o diagnóstico',
    bodyHtml: `
<p>Douglas,</p>
<p>Você entrou no GTM BlackBox, preencheu o perfil da EasyPro Tech como Executivo de Contas em IndTech — e começou o diagnóstico GTM.</p>
<p>Ficou no meio do caminho.</p>
<p>Eu queria entender o porquê, porque o perfil da EasyPro é exatamente o tipo que se beneficia mais do diagnóstico: empresas de tecnologia industrial costumam ter GTM muito artesanal, dependente de relacionamento, sem muita estrutura de pipeline ou previsibilidade.</p>
<p>O diagnóstico revela exatamente onde está o nó — e gera um roadmap com ações concretas.</p>
<p>São 8 minutos. Vale terminar.</p>
    `,
    ctaText: 'Terminar o diagnóstico',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'O que te fez pausar — alguma pergunta que não fez sentido para o contexto da EasyPro, ou foi algo externo?',
  },

  // ── 7. Gustavo Utzig — Terracotta ────────────────────────────────────────────
  // Cadastrou e preencheu empresa, mas nunca iniciou o diagnóstico
  {
    toEmail: 'utzigustavo@gmail.com',
    toName: 'Gustavo',
    userId: 'ff06a84a-3856-479f-9408-dcf7b63cfb68',
    subject: 'Gustavo, o diagnóstico GTM da Terracotta ainda não foi feito',
    bodyHtml: `
<p>Gustavo,</p>
<p>Você criou sua conta no GTM BlackBox e preencheu o perfil da Terracotta. Mas o diagnóstico ainda não foi rodado.</p>
<p>O diagnóstico GTM avalia 5 pilares da sua operação: geração de demanda, conversão, expansão, retenção e monetização. No final, você recebe um <strong>score de maturidade</strong>, o <strong>gargalo principal</strong> identificado e um <strong>roadmap priorizado</strong> com ações concretas.</p>
<p>Para empresas que estão estruturando ou revisando o GTM, o diagnóstico funciona como um espelho — mostra o que está funcionando, o que está fraco, e o que precisa ser atacado primeiro.</p>
<p>Leva 8 minutos.</p>
    `,
    ctaText: 'Começar o diagnóstico',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'O que está te impedindo de rodar o diagnóstico — falta de tempo, incerteza sobre as respostas, ou algo no produto?',
  },

  // ── 8. Bruno — hackthegrowth.com.br / Cybersecurity ─────────────────────────
  // Cadastrou com empresa e setor, nunca iniciou o diagnóstico
  {
    toEmail: 'bbbmonteiro1@gmail.com',
    toName: 'Bruno',
    userId: '731ee357-9863-4d1a-a04e-69c4f7c3e3d5',
    subject: 'Bruno, GTM para Cybersecurity tem uma dinâmica específica',
    bodyHtml: `
<p>Bruno,</p>
<p>Você se cadastrou no GTM BlackBox com o perfil da hackthegrowth — Cybersecurity. Ainda não rodou o diagnóstico.</p>
<p>Cibersegurança tem um GTM muito particular: ciclos longos, compra por comitê, forte dependência de prova de conceito, e uma jornada de confiança que é diferente de SaaS convencional. Isso impacta diretamente os 5 pilares que o diagnóstico avalia.</p>
<p>Me interessa muito ver como um GTM de Cybersecurity sai no BlackBox. Se você rodar, me conta o resultado.</p>
    `,
    ctaText: 'Rodar o diagnóstico',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'No GTM da hackthegrowth, qual é o maior desafio hoje — geração, ciclo de vendas ou retenção/expansão?',
  },

  // ── 9. giovanni salvador — SCIENT / CEO (loop de referência) ─────────────────
  // Diagnóstico ✓ + Forecast ✓ — Giovanni como usuário para fechar o loop
  {
    toEmail: 'giovanni@scient.cc',
    toName: 'Giovanni',
    userId: '914d1338-b376-445c-8cb4-d11de4586439',
    subject: 'Giovanni, você está com 18,9% de maturidade GTM na SCIENT',
    bodyHtml: `
<p>Giovanni,</p>
<p>Este é o e-mail que você receberia como usuário do GTM BlackBox.</p>
<p>Seu diagnóstico da SCIENT ficou em <strong>18,9% de maturidade GTM</strong>, estágio ARMV, com gargalo no <strong>Pilar 1 — Geração de Demanda</strong>. Você também rodou o forecast — que é mais do que 98% dos usuários.</p>
<p>A provocação real: você construiu a ferramenta, sabe o resultado, tem o roadmap — <strong>mas o que você ainda não executou?</strong></p>
<p>A SCIENT está no mesmo gargalo que os seus clientes. Isso é dados. O que vai fazer com isso?</p>
    `,
    ctaText: 'Ver meu roadmap',
    ctaUrl: `${BASE}/diagnostico`,
    feedbackQuestion:
      'Qual é o item do roadmap da SCIENT que você mais está evitando executar — e por quê?',
  },
]
