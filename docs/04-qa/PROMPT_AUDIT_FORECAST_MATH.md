# PROMPT — Auditoria Matemática do Engine de Forecast & Capacity

**Para:** Claude Opus 4 (nova sessão)  
**Objetivo:** Verificar se os cálculos de Forecast e Capacity Planning produzem outputs matematicamente corretos — fórmulas, encadeamento de unidades, lógica de hiring e consistência dos cenários.  
**Contexto:** GTM BlackBox · `/src/lib/forecast/` · Next.js 14 + TypeScript

---

## 1. Código-fonte completo dos engines

Cole ou leia cada arquivo abaixo antes de começar a auditoria.

### 1.1 `src/lib/forecast/types.ts`

```typescript
export type Motion = 'no_touch' | 'low_touch' | 'mid_touch' | 'high_touch' | 'canal'
export type CapacityStatus = 'sobra' | 'ok' | 'falta' | 'critico'
export type Funcao = 'marketing' | 'pre_vendas' | 'vendas' | 'cs'

export interface MotionInput {
  modal: Motion
  acvBrl: number // ACV em BRL (anual por deal)
  cicloDias: number
  pctArr: number // % do ARR total alocado neste motion (soma deve ser 100)
  recorrente: boolean // true = SaaS/assinatura; false = projeto/one-time
  duracaoContrataMeses: number
  sdrsAtuais: number
  sdrsCapacityPorMes: number // SQLs que 1 SDR entrega por mês
  aesAtuais: number
  aesDealsPorMes: number // Deals que 1 AE fecha por mês
  csmsAtuais: number
  csmsContasMax: number // Máx de contas que 1 CSM gerencia
  clientesAtivos: number // Clientes ativos HOJE neste motion
}

export interface TaxasFunil {
  accountMqa: number // % Contas → MQA
  mqaSql: number // % MQA → SQL
  sqlSal: number // % SQL → SAL
  winRate: number // % SAL → Won (Deal)
  grr: number // Gross Revenue Retention anual (%)
  nrr: number // Net Revenue Retention anual (%)
}

export interface Marketing {
  custoPorMqaBrl: number
  budgetMensalBrl: number // Budget MENSAL de marketing
  campanhasDedicadasPorMotion: boolean
}

export interface ConstantesMercado {
  rampMeses: number // default 5
  attritionPct: number // default 10
  atingimentoTopQuartilePct: number // default 60
  turnoverPct: number // default 20
  pipelineCoverageTarget: number // default 3 (= 3×)
}

export interface ForecastInput {
  arrAtualBrl: number
  arrMetaBrl: number
  horizonMeses: number // default 12
  motions: MotionInput[]
  taxasFunil: TaxasFunil
  marketing: Marketing
  constantes: ConstantesMercado
}
```

### 1.2 `src/lib/forecast/relacoes-matematicas.ts` (engine principal)

```typescript
function calcularPorMotion(motion: MotionInput, taxas: TaxasFunil, arrMetaTotalBrl: number) {
  const arrMetaPorMotion = arrMetaTotalBrl * (motion.pctArr / 100)
  const dealsNecessariosMotion = arrMetaPorMotion / Math.max(1, motion.acvBrl)

  const salsNecessarios = dealsNecessariosMotion / Math.max(0.0001, taxas.winRate / 100)
  const sqlsNecessarios = salsNecessarios / Math.max(0.0001, taxas.sqlSal / 100)
  const mqasNecessarios = sqlsNecessarios / Math.max(0.0001, taxas.mqaSql / 100)
  const accountsNecessarios = mqasNecessarios / Math.max(0.0001, taxas.accountMqa / 100)

  // SDRs: SQLs anuais ÷ 12 ÷ capacidade mensal por SDR
  const sdrsNecessarios =
    motion.sdrsCapacityPorMes > 0 ? sqlsNecessarios / 12 / motion.sdrsCapacityPorMes : 0
  // AEs: Deals anuais ÷ 12 ÷ deals por AE por mês
  const aesNecessarios =
    motion.aesDealsPorMes > 0 ? dealsNecessariosMotion / 12 / motion.aesDealsPorMes : 0

  const csmsNecessarios =
    motion.csmsContasMax > 0 ? motion.clientesAtivos / motion.csmsContasMax : 0

  const custoMarketing = mqasNecessarios * 1 // BUG CANDIDATE — ver §3
  const arrFechado = dealsNecessariosMotion * motion.acvBrl

  return {
    motion: motion.modal,
    accountsNecessarios: Math.ceil(accountsNecessarios),
    mqasNecessarios: Math.ceil(mqasNecessarios),
    sqlsNecessarios: Math.ceil(sqlsNecessarios),
    salsNecessarios: Math.ceil(salsNecessarios),
    dealsNecessarios: Math.ceil(dealsNecessariosMotion),
    sdrsNecessarios: Math.round(sdrsNecessarios * 10) / 10,
    aesNecessarios: Math.round(aesNecessarios * 10) / 10,
    csmsNecessarios: Math.round(csmsNecessarios * 10) / 10,
    custoMarketing: Math.round(custoMarketing),
    arrFechado: Math.round(arrFechado),
  }
}

export function calcularForecast(input: ForecastInput): ForecastOutput {
  const motionsCalc = input.motions.map((m) =>
    calcularPorMotion(m, input.taxasFunil, input.arrMetaBrl),
  )

  let sdrsTotal = 0,
    aesTotal = 0,
    csmsTotal = 0,
    arrFechadoTotal = 0
  for (const m of motionsCalc) {
    sdrsTotal += m.sdrsNecessarios
    aesTotal += m.aesNecessarios
    csmsTotal += m.csmsNecessarios
    arrFechadoTotal += m.arrFechado
  }

  // Marketing: custo total vs budget
  const totalMqas = motionsCalc.reduce((s, m) => s + m.mqasNecessarios, 0)
  const custoMarketingTotal = totalMqas * input.marketing.custoPorMqaBrl // anual (MQAs totais × custo/MQA)

  // Capacity verdicts por (função × motion)
  for (const [inMot, calcMot] of zip(input.motions, motionsCalc)) {
    if (inMot.modal !== 'no_touch' && inMot.modal !== 'canal') {
      verdicts.push(
        classifyCapacity('pre_vendas', inMot.modal, inMot.sdrsAtuais, calcMot.sdrsNecessarios),
      )
      verdicts.push(
        classifyCapacity('vendas', inMot.modal, inMot.aesAtuais, calcMot.aesNecessarios),
      )
    }
    verdicts.push(classifyCapacity('cs', inMot.modal, inMot.csmsAtuais, calcMot.csmsNecessarios))
  }

  // Marketing verdict (SUSPEITO — ver §3.1)
  const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl)
  verdicts.push({
    funcao: 'marketing',
    motion: 'agregado',
    atual: 1, // "1 unidade de budget"
    necessario: marketingNecessario,
    pctAtendimento: Math.round((1 / marketingNecessario) * 1000) / 10,
    status: marketingNecessario <= 1 ? 'ok' : marketingNecessario <= 1.25 ? 'falta' : 'critico',
    gap: Math.max(0, marketingNecessario - 1),
    message:
      marketingNecessario <= 1
        ? 'Budget mensal de marketing atual cobre o custo de aquisição necessário.'
        : `Budget atual cobre apenas ${(100 / marketingNecessario).toFixed(0)}% do custo de aquisição necessário.`,
  })

  const pipelineNecessario = input.arrMetaBrl * input.constantes.pipelineCoverageTarget

  // Métricas por função
  const metricas = {
    marketing: {
      mqasPorMes: Math.ceil(totalMqas / 12),
      mqlsPorMes: Math.ceil(totalMqas / 12), // "simplificação" — MQL = MQA
      rsPorMqa: input.marketing.custoPorMqaBrl,
    },
    preVendas: {
      sqlsPorSdrPorMes:
        sdrsTotal > 0
          ? Math.round(motionsCalc.reduce((s, m) => s + m.sqlsNecessarios, 0) / 12 / sdrsTotal)
          : 0,
      sqlsTotalPorMes: Math.ceil(motionsCalc.reduce((s, m) => s + m.sqlsNecessarios, 0) / 12),
    },
    vendas: {
      dealsPorAePorMes:
        aesTotal > 0
          ? Math.round(motionsCalc.reduce((s, m) => s + m.dealsNecessarios, 0) / 12 / aesTotal)
          : 0,
      dealsTotalPorMes: Math.ceil(motionsCalc.reduce((s, m) => s + m.dealsNecessarios, 0) / 12),
      arrFechadoPorMes: Math.ceil(arrFechadoTotal / 12),
    },
    cs: {
      contasPorCsm:
        csmsTotal > 0
          ? Math.round(input.motions.reduce((s, m) => s + m.clientesAtivos, 0) / csmsTotal)
          : 0,
    },
  }
}
```

### 1.3 `src/lib/forecast/scientific-forecast.ts`

```typescript
const arrToMrr = (arr: number) => arr / 12

function calcularChurnNatural(input: ForecastInput): number {
  const totalWeight = input.motions.reduce((s, m) => s + m.pctArr, 0) || 100
  let weightedChurn = 0
  for (const m of input.motions) {
    if (!m.recorrente && m.duracaoContrataMeses > 0) {
      const churnNaturalMensal = 1 / m.duracaoContrataMeses
      weightedChurn += (m.pctArr / totalWeight) * churnNaturalMensal
    }
  }
  return weightedChurn // taxa mensal extra (0-1)
}

export function buildScientificForecast(input: ForecastInput): ScientificForecastMonth[] {
  const mrrAtual = arrToMrr(input.arrAtualBrl)
  const mrrMeta = arrToMrr(input.arrMetaBrl)

  const churnNaturalMensal = calcularChurnNatural(input)
  const grrMensal = input.taxasFunil.grr / 100 // ex: 95 → 0.95 (fração anual)
  const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12) - churnNaturalMensal)

  const expansionRate = (input.taxasFunil.nrr - input.taxasFunil.grr) / 100 / 12

  // Linha de new logo necessária (constante por mês)
  const newLogoMrrMonthly = (mrrMeta - mrrAtual * Math.pow(grrMensal, horizon / 12)) / horizon

  let bopMrr = mrrAtual
  for (let m = 1; m <= horizon; m++) {
    const churnMrr = bopMrr * (1 - grrMensalEfetivo)
    const expansionMrr = bopMrr * expansionRate
    const newLogoMrr = Math.max(0, newLogoMrrMonthly)
    const eopMrr = bopMrr - churnMrr + expansionMrr + newLogoMrr

    const pipelineCoverage = newLogoMrr * 12 * pipelineCoverageTarget
    bopMrr = eopMrr
  }
}
```

### 1.4 `src/lib/forecast/hiring-engine.ts`

```typescript
export function capacityNoMes(mesContratacao: number, mesAtual: number, rampMeses = 5): number {
  if (mesAtual < mesContratacao) return 0
  const mesesNoRole = mesAtual - mesContratacao + 1
  if (mesesNoRole >= rampMeses) return 1.0
  return 0.1 + ((mesesNoRole - 1) / Math.max(1, rampMeses - 1)) * 0.9
}

export function buildHiringPlan(
  verdicts: CapacityVerdict[],
  horizonMeses = 12,
  rampMeses = 5,
): HiringPlan {
  const actions: HiringAction[] = []
  const mesAlvo = Math.max(6, Math.ceil(horizonMeses / 2))

  for (const v of verdicts) {
    if (v.status !== 'falta' && v.status !== 'critico') continue
    if (v.gap < 0.3) continue

    const mesContratacao = Math.max(1, mesAlvo - rampMeses) // SUSPEITO — ver §3.2
    const headcount = Math.ceil(v.gap)
    const cap = capacityNoMes(mesContratacao, mesAlvo, rampMeses)
    const capacityEntregueAteMesAlvo = cap * headcount

    actions.push({
      role: `${v.funcao}${v.motion !== 'agregado' ? ` (${v.motion})` : ''}`,
      motion: v.motion,
      headcount,
      mesContratacao,
      mesFullCapacity: mesContratacao + rampMeses,
      capacityEntregueAteMesAlvo: Math.round(capacityEntregueAteMesAlvo * 10) / 10,
      bloqueante:
        mesContratacao < 1 // SUSPEITO — ver §3.2
          ? `Inviável via contratação dentro do horizonte: precisaria ter contratado em mês ${mesContratacao}.`
          : null,
    })
  }

  const viavel = actions.every((a) => !a.bloqueante)
  const alternativas: string[] = []
  if (!viavel) {
    alternativas.push(
      'Revisar meta para baixo.',
      'Transferir senior interno de outra função.',
      'Acelerar via consultoria.',
      'Aceitar gap declarado.',
    )
  }
  return { actions, viavel, alternativasSeInviavel: alternativas }
}
```

### 1.5 `src/lib/forecast/verdict-engine.ts`

```typescript
export function classifyCapacity(funcao, motion, atual, necessario): CapacityVerdict {
  if (necessario <= 0) return { ..., pctAtendimento: 100, status: 'ok', gap: 0 }

  const pct = (atual / necessario) * 100
  const gap = necessario - atual

  if (pct < 60)        status = 'critico'   // gap > 40%
  else if (pct < 80)   status = 'falta'     // gap 20-40%
  else if (pct <= 110) status = 'ok'        // banda saudável
  else                 status = 'sobra'     // acima de 110%

  return { funcao, motion, atual, necessario, pctAtendimento: Math.round(pct*10)/10,
           status, gap: Math.max(0, gap), message }
}
```

---

## 2. Cenários de teste com valores esperados

Para cada cenário, calcule os outputs esperados na mão (ou com código) e compare com o que o engine produz.

### Cenário A — Single-motion, high_touch, recorrente, baseline viável

```
arrAtualBrl   = 5_000_000   (R$5M)
arrMetaBrl    = 10_000_000  (R$10M, crescimento 100% em 12 meses)
horizonMeses  = 12

motions[0]:
  modal                = 'high_touch'
  acvBrl               = 200_000      (R$200K/deal)
  pctArr               = 100
  recorrente           = true
  duracaoContrataMeses = 24
  sdrsAtuais           = 2
  sdrsCapacityPorMes   = 20           (20 SQLs/SDR/mês)
  aesAtuais            = 2
  aesDealsPorMes       = 2            (2 deals/AE/mês)
  csmsAtuais           = 3
  csmsContasMax        = 25
  clientesAtivos       = 50

taxasFunil:
  accountMqa = 20   (20% das contas → MQA)
  mqaSql     = 50   (50% dos MQAs → SQL)
  sqlSal     = 70   (70% dos SQLs → SAL)
  winRate    = 25   (25% das SALs → Won)
  grr        = 95   (95% GRR anual)
  nrr        = 110  (110% NRR anual)

marketing:
  custoPorMqaBrl  = 5_000   (R$5K/MQA)
  budgetMensalBrl = 50_000  (R$50K/mês)

constantes:
  rampMeses              = 5
  pipelineCoverageTarget = 3
```

**Cálculos esperados — verifique passo a passo:**

```
dealsNecessarios = 10_000_000 / 200_000 = 50 deals/ano

salsNecessarios = 50 / 0.25 = 200 SALs/ano
sqlsNecessarios = 200 / 0.70 = 286 SQLs/ano  (arredondando: ceil = 286)
mqasNecessarios = 286 / 0.50 = 571 MQAs/ano  (ceil = 572)
accountsNecessarios = 572 / 0.20 = 2860 contas (ceil)

sdrsNecessarios = 286 / 12 / 20 = 286 / 240 = 1.19 SDRs → ~1.2
aesNecessarios  = 50  / 12 / 2  = 50  / 24  = 2.08 AEs  → ~2.1
csmsNecessarios = 50 (clientesAtivos) / 25 = 2.0 CSMs

arrFechado = 50 × 200_000 = 10_000_000 (deve igual arrMetaBrl ✓)

custoMarketingTotal = 572 × 5_000 = 2_860_000  (R$2.86M/ano)
budgetAnual = 50_000 × 12 = 600_000            (R$600K/ano)

PERGUNTA 1: marketingNecessario = 2_860_000 / 50_000 = 57.2  →  status = 'critico'
Mas marketingNecessario deveria ser 2_860_000 / 600_000 = 4.77 (anual/anual)
ou (572/12 × 5_000) / 50_000 = (47.7 × 5_000) / 50_000 = 238_500 / 50_000 = 4.77 (mensal/mensal)
O valor 57.2 parece ~12× o correto. Há um bug de unidade?

PERGUNTA 2: capacity verdict para pre_vendas:
  atual = 2 SDRs, necessario = 1.2 SDRs
  pct = 2/1.2 × 100 = 166.7% → status = 'sobra' ✓ (acima de 110%)

PERGUNTA 3: capacity verdict para vendas:
  atual = 2 AEs, necessario = 2.1 AEs
  pct = 2/2.1 × 100 = 95.2% → status = 'ok' ✓ (80-110%)

PERGUNTA 4: capacity verdict para cs:
  atual = 3 CSMs, necessario = 2.0 CSMs
  pct = 3/2.0 × 100 = 150% → status = 'sobra' ✓
```

### Cenário B — Hiring plan: gap que deveria ser inviável

```
arrMetaBrl    = 30_000_000   (R$30M — 6× crescimento em 12 meses)
arrAtualBrl   = 5_000_000
horizonMeses  = 12
constantes.rampMeses = 5

Suponha que o capacity verdict retorna:
  v.funcao = 'vendas', v.modal = 'high_touch'
  v.atual = 1 AE, v.necessario = 8 AEs
  v.status = 'critico', v.gap = 7
```

**Trace do hiring-engine:**

```
mesAlvo       = Math.max(6, ceil(12/2)) = Math.max(6, 6) = 6
mesContratacao = Math.max(1, 6 - 5) = Math.max(1, 1) = 1
headcount      = ceil(7) = 7
cap            = capacityNoMes(1, 6, 5)
               = mesesNoRole = 6 - 1 + 1 = 6
               = 6 >= rampMeses(5) → retorna 1.0
capacityEntregueAteMesAlvo = 1.0 × 7 = 7.0

bloqueante = mesContratacao < 1 → 1 < 1 → FALSE → null

PERGUNTA 5: viavel = true (porque bloqueante é null)
Mas contratar 7 AEs do zero no mês 1 de um horizonte de 12 meses
é operacionalmente inviável para a maioria das empresas.
A condição `mesContratacao < 1` pode NUNCA ser true porque
Math.max(1, ...) garante que mesContratacao >= 1.
O sistema de inviabilidade está morto?
```

**Teste com horizonte curto:**

```
horizonMeses  = 6
rampMeses     = 5

mesAlvo        = Math.max(6, ceil(6/2)) = Math.max(6, 3) = 6
mesContratacao = Math.max(1, 6 - 5) = 1
bloqueante     = 1 < 1 → FALSE → null
viavel         = true

PERGUNTA 6: Para horizonte de 3 meses:
mesAlvo        = Math.max(6, ceil(3/2)) = Math.max(6, 2) = 6
Mas horizonMeses = 3! O mesAlvo nunca pode ser > horizonMeses?
O cap vai checar capacidade em mês 6 quando o horizonte acaba no mês 3.
```

### Cenário C — Scientific Forecast: consistência EOP vs meta

```
arrAtualBrl   = 10_000_000  (MRR = 833_333)
arrMetaBrl    = 20_000_000  (MRR = 1_666_667)
horizonMeses  = 12
grr           = 95   → grrMensal = 0.95
nrr           = 110
motions: todos recorrentes (churnNatural = 0)
```

**Trace:**

```
grrMensalEfetivo = 0.95^(1/12) - 0 = 0.99572 - 0 = 0.99572
expansionRate    = (110 - 95)/100/12 = 0.01250  (1.25%/mês)

mrrAtual × grr^(horizon/12) = 833_333 × 0.95^(12/12) = 833_333 × 0.95 = 791_667

newLogoMrrMonthly = (1_666_667 - 791_667) / 12 = 875_000 / 12 = 72_917/mês

PERGUNTA 7: Ao simular 12 meses, EOP[12] deve ser próximo de 1_666_667?
Trace mês 1:
  churnMrr     = 833_333 × (1 - 0.99572) = 833_333 × 0.00428 = 3_566
  expansionMrr = 833_333 × 0.01250       = 10_417
  newLogoMrr   = 72_917
  eopMrr       = 833_333 - 3_566 + 10_417 + 72_917 = 913_101

Compare com: Sem new logo, a base após 12 meses seria 791_667.
Com new logo constante de 72_917/mês × 12 = 875_000 adicionados.
O EOP deveria ser aproximadamente 791_667 + 875_000 = 1_666_667.
Mas expansão e churn compostos alteram esse resultado — quanto o EOP real diverge de mrrMeta?
```

### Cenário D — Non-recorrente: double-churn check

```
motions[0]:
  modal = 'high_touch'
  pctArr = 100
  recorrente = false
  duracaoContrataMeses = 12

grr = 95 (95% renovam contratos anuais)
```

**Trace:**

```
churnNaturalMensal = 1/12 = 0.0833  (8.33% da receita expira todo mês)
grrMensal = 0.95 (já inclui 5% de não-renovação anual → ~0.43%/mês)
grrMensal^(1/12) = 0.99572

grrMensalEfetivo = 0.99572 - 0.0833 = 0.9124

PERGUNTA 8: Se o GRR de 95% já representa que 5% dos contratos não renovam,
e duracaoContrataMeses=12 implica que 100% dos contratos expiram e precisam renovar,
então o churnNatural de 8.33%/mês representa TODOS os contratos expirando — não apenas os 5% que não renovam.
Isso não está somando churn já embutido no GRR com churn estrutural de expiração?
O churn efetivo resultante é de (1 - 0.9124) × 12 ≈ 105%/ano — matematicamente impossível para uma empresa com GRR de 95%.
```

---

## 3. Pontos de suspeita (hipóteses de bugs)

Para cada item, confirme se é bug, design intencional ou falso positivo. Cite linha do código.

### 3.1 Marketing verdict — bug de unidade (ALTA PRIORIDADE)

**Localização:** `relacoes-matematicas.ts`, função `calcularForecast()`

```typescript
const custoMarketingTotal = totalMqas * input.marketing.custoPorMqaBrl
// totalMqas = MQAs ANUAIS necessários → custoMarketingTotal = R$/ANO

const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl)
// budgetMensalBrl = R$/MÊS
// Resultado = (R$/ano) / (R$/mês) = dimensão ~12× maior que deveria
```

**Hipótese:** O marketing sempre aparece como `critico` porque está comparando custo anual com budget mensal. Um budget balanceado (anual = 12 × mensal) daria `marketingNecessario = 12`, muito acima de 1.25 (limiar de `falta`).

**Verificação sugerida:** Calcule para o Cenário A:

- `custoMarketingTotal = 572 × 5_000 = 2_860_000`
- `budgetMensalBrl = 50_000`
- `marketingNecessario = 2_860_000 / 50_000 = 57.2` → `critico`
- Correto seria: `2_860_000 / (50_000 × 12) = 4.77` → ainda `critico`, mas por razão correta
- Ou mensal: `(572/12 × 5_000) / 50_000 = 4.77` → `critico`

**Se for bug:** Fix sugerido:

```typescript
// Opção A: comparar anual/anual
const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl * 12)
// Opção B: comparar mensal/mensal
const custoMarketingMensal = (totalMqas / 12) * input.marketing.custoPorMqaBrl
const marketingNecessario = custoMarketingMensal / Math.max(1, input.marketing.budgetMensalBrl)
```

### 3.2 Hiring inviável — condição morta (ALTA PRIORIDADE)

**Localização:** `hiring-engine.ts`, `buildHiringPlan()`

```typescript
const mesContratacao = Math.max(1, mesAlvo - rampMeses) // sempre >= 1

actions.push({
  bloqueante:
    mesContratacao < 1 // NUNCA true — Math.max garante >= 1
      ? `Inviável...`
      : null,
})

const viavel = actions.every((a) => !a.bloqueante) // sempre true
```

**Hipótese:** A condição `mesContratacao < 1` é matematicamente impossível dado o `Math.max(1, ...)`. A flag `viavel` será sempre `true`. O estado `inviável` e as `alternativasSeInviavel` são código morto que nunca chega ao usuário.

**Verificação:** Teste com qualquer input — o plan.viavel deveria retornar `false` se o gap exige contratar mais pessoas do que é operacionalmente possível no horizonte dado. Confirme que nenhum conjunto de inputs consegue produzir `viavel = false`.

**Lógica correta provável:**

```typescript
// A inviabilidade deveria ser baseada em: a capacidade entregue até mesAlvo
// é suficiente para cobrir o gap?
const rawMesContratacao = mesAlvo - rampMeses // sem clamping
const bloqueante =
  rawMesContratacao < 1 // precisaria contratar antes do início
    ? `Inviável: precisaria ter contratado no mês ${rawMesContratacao}...`
    : null
const mesContratacao = Math.max(1, rawMesContratacao) // para o cálculo de cap
```

### 3.3 CSM count subestimado para cenários de crescimento

**Localização:** `relacoes-matematicas.ts`, `calcularPorMotion()`

```typescript
const csmsNecessarios = motion.clientesAtivos / motion.csmsContasMax
// clientesAtivos = clientes HOJE, não os projetados ao fim do horizonte
```

**Hipótese:** Em um cenário de 6× crescimento (R$5M → R$30M), a base de clientes cresce proporcionalmente. O CSM count calculado representa a necessidade ATUAL, não ao fim do horizonte. Para high_touch com csmsContasMax=25 e clientesAtivos=50 (hoje), o cálculo retorna 2 CSMs — mas com 300 clientes no final do horizonte seria 12 CSMs.

**Verificação:** Confirme se o input `clientesAtivos` é documentado na UI como "clientes atuais" ou "clientes projetados". Se for atual, o CSM verdict é sempre subestimado.

**Impacto:** O hiring plan nunca sugere contratar CSMs mesmo em cenários de crescimento agressivo, porque o gap é baseado na base atual, não na projetada.

### 3.4 `custoMarketing` per-motion hardcoded errado

**Localização:** `relacoes-matematicas.ts`, linha `const custoMarketing = mqasNecessarios * 1`

```typescript
const custoMarketing = mqasNecessarios * 1 // multiplica por 1, não por custoPorMqaBrl
```

**Hipótese:** Este campo deveria ser `mqasNecessarios * custoPorMqaBrl`. O `* 1` faz com que `custoMarketing` seja sempre igual a `mqasNecessarios` em número (sem dimensão de R$). Este campo está incorreto no output `porMotion`, embora o `custoMarketingTotal` no agregado seja calculado corretamente.

**Verificação:** Confirme se `porMotion[modal].custoMarketing` é usado em alguma view ou se é campo morto. Se for exibido na UI, o valor está errado.

### 3.5 Double-churn para motions não-recorrentes

**Localização:** `scientific-forecast.ts`, `calcularChurnNatural()` + `buildScientificForecast()`

```typescript
const churnNaturalMensal = 1 / m.duracaoContrataMeses // ex: 1/12 = 8.33%/mês
const grrMensalEfetivo = Math.pow(grrMensal, 1 / 12) - churnNaturalMensal
```

**Hipótese:** O `grr` inputado pelo usuário (ex: 95%) já incorpora a taxa de não-renovação de contratos. Para uma empresa com contratos anuais e 95% de renovação, o GRR de 95% já diz "5% dos contratos anuais não renovam" (~0.43%/mês). Ao subtrair `churnNaturalMensal = 1/12 = 8.33%`, o modelo assume que 100% da receita expira e precisa ser renovada todo mês — duplicando o churn estrutural.

**Quando seria correto:** Se o usuário inserir GRR = 100% para motions não-recorrentes (significando "todos que renovam ficam"), então subtrair o churn natural faria sentido. Mas o campo GRR é tipicamente interpretado como a taxa líquida de retenção (inclusiva de não-renovação).

**Cálculo da inconsistência:**

```
grr = 95%, duracaoContrataMeses = 12
churnNatural = 1/12 = 8.33%/mês
grrMensalEfetivo = 0.99572 - 0.0833 = 0.9124  (retenção de 91.24%/mês)
Anualizado: 0.9124^12 = 0.353 → apenas 35.3% da receita é retida no ano
Mas o usuário disse GRR = 95%!
```

### 3.6 Pipeline = ARR meta × 3× (deveria ser new ARR × 3×?)

**Localização:** `relacoes-matematicas.ts` e `scientific-forecast.ts`

```typescript
const pipelineNecessario = input.arrMetaBrl * input.constantes.pipelineCoverageTarget
// 3× coverage sobre o ARR META total, não sobre o new ARR incremental
```

**Hipótese:** Pipeline coverage é tipicamente calculado sobre a quota de novos negócios, não sobre o ARR total da empresa. Para uma empresa crescendo de R$5M para R$10M, o new ARR incremental é R$5M, e com 3× coverage o pipeline necessário é R$15M — não R$30M (3× arrMeta).

**Verificação:** Confirme qual é a intenção de design. Se a intenção é "3× do delta", o fix seria:

```typescript
const newArrNecessario = input.arrMetaBrl - input.arrAtualBrl
const pipelineNecessario = newArrNecessario * input.constantes.pipelineCoverageTarget
```

### 3.7 `mesAlvo` pode ultrapassar `horizonMeses`

**Localização:** `hiring-engine.ts`

```typescript
const mesAlvo = Math.max(6, Math.ceil(horizonMeses / 2))
```

**Hipótese:** Para `horizonMeses < 6` (ex: horizonte de 3 meses), `mesAlvo = 6` mas o horizonte termina no mês 3. O hiring plan calcula a capacity em um mês que não existe no horizonte. Isso pode produzir `capacityEntregueAteMesAlvo` = 100% mesmo quando o hire ocorreria depois do fim do horizonte.

---

## 4. Checklist de verificação

Para cada item abaixo, indique: ✅ Correto | ❌ Bug | ⚠️ Design suspeito | ℹ️ Simplificação documentada

### Funil de conversão (relacoes-matematicas.ts)

- [ ] **Cadeia inversa do funil**: `deals → sals → sqls → mqas → accounts` está encadeada na ordem correta
- [ ] **Consistência arrFechado**: `arrFechado = deals × acvBrl` deve igualar `arrMetaPorMotion` (a menos de rounding)
- [ ] **Totais agregados**: `arrFechadoTotal = Σ(arrFechado) = arrMetaBrl` quando `Σ(pctArr) = 100%`
- [ ] **Unidades de SDR**: `sqlsAnuais / 12 / capacidadeMensal = SDRs` — dimensionalmente correto?
- [ ] **Unidades de AE**: `dealsAnuais / 12 / dealsPorAe = AEs` — dimensionalmente correto?
- [ ] **custoMarketing por motion**: `mqasNecessarios × 1` vs `mqasNecessarios × custoPorMqaBrl`
- [ ] **custoMarketingTotal**: `totalMqas × custoPorMqaBrl` — unidade anual, correto
- [ ] **marketingNecessario**: unidade correta? (anual/mensal vs anual/anual)
- [ ] **pipelineNecessario**: `arrMeta × 3×` ou deveria ser `(arrMeta - arrAtual) × 3×`?

### Verdict de capacity (verdict-engine.ts)

- [ ] **pctAtendimento = atual/necessario × 100**: correto
- [ ] **Thresholds**: <60% critico | 60-80% falta | 80-110% ok | >110% sobra
- [ ] **gap = necessario - atual**: correto (sempre ≥ 0)
- [ ] **Marketing pctAtendimento**: `(1/marketingNecessario) × 100` — coerente com a lógica de "atual=1 unidade"?

### Scientific Forecast (scientific-forecast.ts)

- [ ] **grrMensal**: `grr/100` = fração anual (ex: 0.95 para 95%) — correto
- [ ] **grrMensalEfetivo**: `0.95^(1/12)` = retenção mensal — correto matematicamente
- [ ] **churnMrr**: `bopMrr × (1 - grrMensalEfetivo)` — correto
- [ ] **expansionRate**: `(nrr - grr)/100/12` — annualizado corretamente para mensal
- [ ] **newLogoMrrMonthly**: fórmula garante que `EOP[horizon] ≈ mrrMeta`? Simule e confirme
- [ ] **Double-churn**: para motions não-recorrentes, o `churnNatural` é adicionado ao GRR ou duplicado?
- [ ] **pipelineCoverage por mês**: `newLogoMrr × 12 × target` — faz sentido anualizar o MRR mensal de new logo?

### Hiring Plan (hiring-engine.ts)

- [ ] **capacityNoMes(1, 6, 5)**: mesesNoRole=6 ≥ rampMeses=5 → retorna 1.0 ✓
- [ ] **capacityNoMes(1, 3, 5)**: mesesNoRole=3 < rampMeses=5 → `0.1 + (2/4)×0.9 = 0.55` (55%)
- [ ] **mesAlvo**: sempre ≥ 6, mesmo para horizonMeses < 6 — é intenção?
- [ ] **mesContratacao < 1**: pode `bloqueante` ser não-null com o `Math.max(1,...)`?
- [ ] **viavel**: há algum cenário que retorna `false` com o código atual?
- [ ] **capacityEntregueAteMesAlvo = cap × headcount**: coerente — se cap=1.0 e headcount=3, entrega=3.0 (100%)

---

## 5. Instruções de execução

1. **Leia todos os arquivos** em `src/lib/forecast/` para ter o código completo (não use os excerpts acima como substituto — eles são resumidos).

2. **Trace cada cenário** (A, B, C, D) calculando o output esperado na mão, depois execute o código TypeScript ou simule manualmente para comparar.

3. **Para cada hipótese em §3**, confirme ou refute com evidência no código:
   - Se bug: forneça o fix exato (linha + código corrigido)
   - Se design intencional: explique por que faz sentido e sugira documentação
   - Se falso positivo: demonstre matematicamente por que a fórmula está correta

4. **Severidade de cada finding:**
   - **P0** — output matematicamente errado que afeta toda sessão de forecast
   - **P1** — output errado em subconjunto de cenários (ex: apenas motions não-recorrentes)
   - **P2** — simplificação que produz valores defensáveis mas imprecisos
   - **P3** — naming, comentário ou UX enganoso sem impacto em cálculo

5. **Gere um relatório** com:
   - Tabela de findings (severidade · arquivo:linha · descrição · fix proposto)
   - Para cada finding P0/P1: exemplo numérico mostrando input → output errado → output correto
   - Checklist de itens verificados como corretos (evidência positiva)

---

## 6. Arquivos a ler (caminhos absolutos)

```
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/relacoes-matematicas.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/scientific-forecast.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/hiring-engine.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/verdict-engine.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/input-validators.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/types.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/benchmarks-por-motion.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/lib/forecast/prompt-builder.ts
/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/src/app/(app)/forecast/wizard/actions.ts
```

---

_Gerado por: Claude Sonnet 4.6 · GTM BlackBox · 2026-04-27_  
_Para ser executado em nova sessão com acesso ao codebase completo._
