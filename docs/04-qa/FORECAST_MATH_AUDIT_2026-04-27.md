# Auditoria Matemática — Forecast & Capacity Engine

**Auditor:** Claude Sonnet 4.6  
**Data:** 2026-04-27  
**Arquivos auditados:** `src/lib/forecast/` (7 arquivos) + `src/app/(app)/forecast/resultado/page.tsx`  
**Método:** Trace numérico manual de cada fórmula com cenários concretos

---

## Sumário executivo

| Severidade         | Qtd | Impacto                                              |
| ------------------ | --- | ---------------------------------------------------- |
| 🔴 P0 — Bloqueante | 2   | Outputs matematicamente errados em 100% das sessões  |
| 🟠 P1 — Crítico    | 2   | Outputs errados para subconjuntos de cenários comuns |
| 🟡 P2 — Médio      | 3   | Resultados defensáveis mas com viés sistemático      |
| 🟢 P3 — Baixo      | 1   | Campo morto com dado incorreto (não exibido)         |

**Verdict: 🔴 Não apto para uso sem os fixes P0.**  
Os 2 bugs P0 afetam todo usuário que rodar o forecast: o Marketing sempre aparece como critico com magnitude ~12× errada, e o plano nunca é declarado inviável independentemente dos inputs.

---

## P0 — Bloqueantes

### P0-1 · Marketing verdict com unidade errada — inflação de 12×

**Arquivo:** `src/lib/forecast/relacoes-matematicas.ts:112-153`

**O problema:** `custoMarketingTotal` é calculado em **R$/ano** (MQAs anuais × custo/MQA), mas é dividido por `budgetMensalBrl` que é **R$/mês**. A divisão produz um número ~12× maior que o correto, fazendo o Marketing sempre aparecer como `critico` com pctAtendimento próximo de 0%.

```typescript
// relacoes-matematicas.ts:112
const custoMarketingTotal = totalMqas * input.marketing.custoPorMqaBrl
// totalMqas = MQAs ANUAIS  → custoMarketingTotal = R$/ano

const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl)
//                                                                    ↑ R$/mês
// Resultado: (R$/ano) ÷ (R$/mês) = adimensional ~12× acima do correto
```

**Trace numérico — Cenário A (high_touch, R$5M→R$10M):**

```
totalMqas            = 572 MQAs/ano
custoPorMqaBrl       = R$5.000/MQA
budgetMensalBrl      = R$50.000/mês

custoMarketingTotal  = 572 × 5.000 = R$2.860.000/ano

— ENGINE ATUAL —
marketingNecessario  = 2.860.000 / 50.000 = 57,2
pctAtendimento       = (1/57,2) × 100     = 1,7%  ← EXIBIDO AO USUÁRIO
status               = 'critico'
headcount no plano   = ceil(57,2 - 1) = 57 "contratações de marketing" ← ABSURDO

— CORRETO (anual/anual) —
budgetAnual          = 50.000 × 12 = R$600.000/ano
marketingNecessario  = 2.860.000 / 600.000 = 4,77
pctAtendimento       = (1/4,77) × 100 = 21,0%
status               = 'critico' (ainda, mas pela razão correta)
headcount no plano   = 0 (marketing não é headcount — ver cascade abaixo)
```

**Bug cascade — hiring plan:** Com `gap = 56,2`, a função `buildHiringPlan()` faz `headcount = Math.ceil(56,2) = 57` e gera a ação "contratar 57 de marketing em mês 1". Marketing é budget, não headcount — a interpretação é semanticamente errada e o número é 12× inflado.

**Fix:**

```typescript
// Opção A — comparar anual/anual (recomendado, mais claro)
const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl * 12)

// Opção B — comparar mensal/mensal
const custoMarketingMensal = (totalMqas / 12) * input.marketing.custoPorMqaBrl
const marketingNecessario = custoMarketingMensal / Math.max(1, input.marketing.budgetMensalBrl)
```

**Adicionalmente:** Marketing não deveria entrar no `buildHiringPlan()` como headcount. O gap de budget deve ser exibido como "budget adicional necessário em R$", não como "X contratações". Sugestão: filtrar `funcao !== 'marketing'` antes de calcular o plano de hiring.

---

### P0-2 · Hiring inviável é código morto — `viavel` sempre `true`

**Arquivo:** `src/lib/forecast/hiring-engine.ts:22-38`

**O problema:** A condição que marca uma contratação como inviável (`mesContratacao < 1`) nunca pode ser verdadeira porque `mesContratacao` é calculado com `Math.max(1, ...)`, garantindo que sempre é ≥ 1. Portanto `bloqueante` é sempre `null`, `viavel` é sempre `true`, e as alternativas de plano inviável nunca chegam ao usuário.

```typescript
// hiring-engine.ts:22-37
const mesContratacao = Math.max(1, mesAlvo - rampMeses) // sempre >= 1

actions.push({
  bloqueante:
    mesContratacao < 1 // ← NUNCA TRUE: Math.max garante >= 1
      ? `Inviável via contratação...`
      : null,
})

const viavel = actions.every((a) => !a.bloqueante) // sempre true
// alternativasSeInviavel: never populated
```

**Trace — Cenário B (R$5M→R$30M, horizonte 12 meses, ramp 5 meses):**

```
mesAlvo        = Math.max(6, ceil(12/2)) = Math.max(6, 6) = 6
mesContratacao = Math.max(1, 6 - 5)     = Math.max(1, 1) = 1

bloqueante     = 1 < 1 → false → null

Resultado: viavel = true
UI mostra "🟢 Plano viável" mesmo para um gap de 50 AEs em 12 meses.
```

**Trace — Horizonte de 3 meses (ramp 5 meses):**

```
mesAlvo        = Math.max(6, ceil(3/2)) = Math.max(6, 2) = 6
mesContratacao = Math.max(1, 6 - 5)     = 1

Problema duplo:
1. mesAlvo = 6 mas horizonMeses = 3 — avalia capacity num mês que não existe
2. bloqueante = 1 < 1 → false → null

A capacity de um hire em mês 1 é checada no mês 6 (100% rampado),
mas o horizonte acaba no mês 3 (hire estaria em 55% da capacidade).
O modelo mostra 100% de capacity entregue — 45 pontos percentuais otimista demais.
```

**Fix:**

```typescript
// 1. Separar o cálculo bruto do clamped
const rawMesContratacao = mesAlvo - rampMeses
const mesContratacao = Math.max(1, rawMesContratacao)

// 2. Checar inviabilidade ANTES do clamp
const bloqueante =
  rawMesContratacao < 1
    ? `Inviável: precisaria ter contratado no mês ${rawMesContratacao} (antes do início do horizonte). Considere transferir senior interno ou revisar meta.`
    : null

// 3. Corrigir mesAlvo para não ultrapassar horizonte
const mesAlvo = Math.min(horizonMeses, Math.max(6, Math.ceil(horizonMeses / 2)))
// Para horizonte de 3 meses: min(3, max(6, 2)) = min(3, 6) = 3 ✓
```

---

## P1 — Críticos

### P1-1 · Double-churn em motions não-recorrentes

**Arquivo:** `src/lib/forecast/scientific-forecast.ts:6-17` e `:30`

**O problema:** Para motions não-recorrentes, o código subtrai `churnNaturalMensal = 1/duracaoContrataMeses` do GRR mensal. Mas o GRR inputado pelo usuário (ex: 95%) já representa a retenção líquida da receita, incluindo contratos que não renovam. Subtrair o churn estrutural de expiração por cima do GRR é double-counting — a retenção anual implícita cai de 95% para 33%.

```typescript
// scientific-forecast.ts:12-13
const churnNaturalMensal = 1 / m.duracaoContrataMeses // ex: 1/12 = 8,33%/mês

// :30
const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12) - churnNaturalMensal)
//  = max(0, 0.9957 - 0.0833) = 0,9124
```

**Trace numérico — Cenário D (high_touch, não-recorrente, GRR=95%, contrato 12 meses):**

```
Usuário informa: GRR = 95%  (95% dos contratos anuais renovam ao mesmo valor)

churnNaturalMensal = 1/12   = 0,0833  (8,33%/mês)
grrMensal          = 0.95
grrMensalEfetivo   = 0.95^(1/12) - 0.0833
                   = 0.99574  - 0.08333
                   = 0,91241

Retenção anual implícita = 0.91241^12 = 33,3%

Mas o usuário disse GRR = 95%!
O modelo entrega um forecast 62 pontos percentuais mais pessimista.
```

**Raiz do problema:** O GRR de 95% já diz "5% da receita não é renovada por ano" → ~0,43%/mês de churn por não-renovação. Ao somar mais 8,33%/mês pelo churn estrutural de contratos que expiram, o modelo assume que toda a receita expira todo mês E que só 95% renova — quando na verdade os dois são o mesmo evento.

**Quando o churn natural seria correto:** Apenas se o usuário inputar GRR = 100% para motions não-recorrentes (significando "quem renova mantém 100% do valor"), e o churn natural de expiração capture a taxa de não-renovação. Mas a UI não instrui isso.

**Fix — opção conservadora (remover churn natural, confiar no GRR inputado):**

```typescript
// O GRR do usuário já incorpora não-renovação para motions não-recorrentes
// Remover a subtração de churnNatural do grrMensalEfetivo
const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12))

// Manter churnNatural apenas para documentar o aviso ao usuário (já feito em input-validators.ts)
```

---

### P1-2 · Scientific Forecast ultrapassa a meta em ~10% (newLogo superestimado)

**Arquivo:** `src/lib/forecast/scientific-forecast.ts:34`

**O problema:** A fórmula de `newLogoMrrMonthly` calcula quanto new logo mensal é necessário assumindo **apenas GRR** (sem expansão). Mas a simulação mensal aplica **tanto GRR quanto expansão**. Resultado: o EOP no mês 12 ultrapassa a meta em ~10%, e o modelo pede mais new logo do que o necessário.

```typescript
// scientific-forecast.ts:34
const newLogoMrrMonthly = (mrrMeta - mrrAtual * Math.pow(grrMensal, horizon / 12)) / horizon
//                                             ↑ ignora expansionRate ao calcular a linha base
```

**Trace numérico — Cenário C (R$10M→R$20M, GRR=95%, NRR=110%, 12 meses):**

```
mrrAtual          = 833.333
mrrMeta           = 1.666.667
grrMensalEfetivo  = 0.95^(1/12) = 0,99574
expansionRate     = (110-95)/100/12 = 0,01250

newLogoMrrMonthly = (1.666.667 - 833.333 × 0.95) / 12
                  = (1.666.667 - 791.667) / 12
                  = 875.000 / 12
                  = 72.917/mês

Simulando os 12 meses com churn + expansão + newLogo:

Mês  | BOP MRR   | Churn   | Expansion | NewLogo | EOP MRR
  1  |   833.333 |  -3.561 |   +10.417 | +72.917 |   913.106
  2  |   913.106 |  -3.902 |   +11.414 | +72.917 |   993.535
  3  |   993.535 |  -4.247 |   +12.419 | +72.917 | 1.074.624
  4  | 1.074.624 |  -4.593 |   +13.433 | +72.917 | 1.156.381
  5  | 1.156.381 |  -4.942 |   +14.455 | +72.917 | 1.238.811
  6  | 1.238.811 |  -5.293 |   +15.485 | +72.917 | 1.321.920
  7  | 1.321.920 |  -5.650 |   +16.524 | +72.917 | 1.405.711
  8  | 1.405.711 |  -6.007 |   +17.571 | +72.917 | 1.490.192
  9  | 1.490.192 |  -6.368 |   +18.627 | +72.917 | 1.575.368
 10  | 1.575.368 |  -6.733 |   +19.692 | +72.917 | 1.661.244
 11  | 1.661.244 |  -7.099 |   +20.766 | +72.917 | 1.747.828  ← ARR = R$20,97M (meta atingida)
 12  | 1.747.828 |  -7.471 |   +21.848 | +72.917 | 1.835.122

EOP[12] MRR  = 1.835.122 → ARR = R$22.021.464
arrMeta                           = R$20.000.000
Overshoot                         = R$2.021.464  (+10,1%)
```

**Efeito prático:** A tabela de Scientific Forecast mostrará `gapVsMeta` negativo (meta já batida) a partir do mês 11, quando o mês 12 ainda não terminou. O modelo pede 10% mais new logo por mês do que o necessário — um plano conservador, mas com viés sistemático não documentado.

**Fix — resolver numericamente para que EOP[12] = mrrMeta:**

```typescript
// Abordagem: ajustar newLogoMrrMonthly para compensar a expansão composta
// Aproximação analítica: subtrair a expansão média esperada do target
const expansionContributionEstimate = (mrrAtual * expansionRate * horizon) / 2
// (média da expansion ao longo do horizonte, simplificado)
const newLogoMrrMonthly =
  (mrrMeta - mrrAtual * Math.pow(grrMensal, horizon / 12) - expansionContributionEstimate) / horizon

// Ou, se precisão for crítica: busca binária no valor de newLogoMrrMonthly que
// produz EOP[horizon] = mrrMeta ao simular os meses.
```

---

## P2 — Médio

### P2-1 · Pipeline = ARR meta × 3× (deveria ser delta ARR × 3×)

**Arquivo:** `src/lib/forecast/relacoes-matematicas.ts:156`

```typescript
const pipelineNecessario = input.arrMetaBrl * input.constantes.pipelineCoverageTarget
```

**Problema:** Pipeline coverage padrão de mercado é aplicado sobre o **ARR incremental** (a quota de novos negócios), não sobre o ARR total da empresa. Para R$5M→R$10M, o pipeline necessário seria `5M × 3 = R$15M`, não `10M × 3 = R$30M`.

```
Cenário A (R$5M → R$10M):
  Engine atual: 10.000.000 × 3 = R$30.000.000 ← 2× inflado
  Correto:      (10.000.000 - 5.000.000) × 3 = R$15.000.000
```

Esse dado inflado aparece na tabela do Scientific Forecast como "Pipeline necessário" e pode alarmar o usuário com um número de pipeline inatingível.

**Fix:**

```typescript
const newArrNecessario = Math.max(0, input.arrMetaBrl - input.arrAtualBrl)
const pipelineNecessario = newArrNecessario * input.constantes.pipelineCoverageTarget
```

---

### P2-2 · CSM count usa clientes atuais, não projetados

**Arquivo:** `src/lib/forecast/relacoes-matematicas.ts:33`

```typescript
const csmsNecessarios = motion.csmsContasMax > 0 ? motion.clientesAtivos / motion.csmsContasMax : 0
// clientesAtivos = clientes HOJE, não ao fim do horizonte
```

**Problema:** Para uma empresa crescendo 6× (R$5M→R$30M), a base de clientes cresce proporcionalmente. O CSM count é calculado com a base atual, não projetada. O plano de hiring nunca sugere contratar CSMs adicionais mesmo quando a meta implica triplicar a base.

```
Exemplo — high_touch, clientesAtivos=50 hoje, csmsContasMax=25:
  csmsNecessarios = 50/25 = 2 CSMs

  Mas com R$30M ARR e ACV R$200K → ~150 clientes ao fim do horizonte
  csmsNecessarios real = 150/25 = 6 CSMs → gap de 4 que nunca aparece no plano
```

**Fix sugerido:** Calcular `clientesProjetados = clientesAtivos + dealsNecessarios` (ou deixar o usuário inputar a projeção) e usar esse valor no cálculo de CSMs.

---

### P2-3 · MQL = MQA (simplificação sem documentação)

**Arquivo:** `src/lib/forecast/relacoes-matematicas.ts:169`

```typescript
marketing: {
  mqasPorMes: Math.ceil(totalMqas / 12),
  mqlsPorMes: Math.ceil(totalMqas / 12), // simplificação — MQL = MQA
  rsPorMqa: input.marketing.custoPorMqaBrl,
},
```

O campo `mqlsPorMes` é idêntico a `mqasPorMes`. Na prática existe uma etapa de conversão MQA→MQL com taxa variável. O `mqlsPorMes` da UI sempre mostrará o mesmo número que MQAs — se usado para tomar decisão de budget de conteúdo, o usuário verá dois campos iguais sem entender por quê.

**Fix de curto prazo:** Remover `mqlsPorMes` da interface ou renomear para `mqasPorMes` nos dois lugares para ser honesto.

---

## P3 — Baixo

### P3-1 · `custoMarketing` por motion hardcoded com multiplicador 1

**Arquivo:** `src/lib/forecast/relacoes-matematicas.ts:35`

```typescript
const custoMarketing = mqasNecessarios * 1 // deveria ser * custoPorMqaBrl
```

O campo `porMotion[modal].custoMarketing` é sempre igual a `mqasNecessarios` (ex: 572) em vez de R$2.860.000. **Porém, esse campo não é renderizado em nenhuma view do `resultado/page.tsx`** — o UI usa `metricas.marketing.rsPorMqa` (correto) e `custoMarketingTotal` no aggregate (correto). Campo incorreto mas sem impacto visível.

**Fix:** `const custoMarketing = mqasNecessarios * custoPorMqaBrl`  
(nota: `custoPorMqaBrl` precisa ser passado como parâmetro para `calcularPorMotion()`)

---

## Itens verificados como matematicamente corretos ✅

| Item                                                                        | Verificação                                                                                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Cadeia inversa do funil (deals→sals→sqls→mqas→accounts)                     | `dealsNecessarios = arrMeta/acv`, `sals = deals/winRate`, etc. — cada divisão inverte a taxa de conversão corretamente ✓ |
| `arrFechado = dealsNecessarios × acvBrl`                                    | Algebricamente idêntico a `arrMetaPorMotion` (cancel out). `arrFechadoTotal = arrMetaBrl` quando `Σ(pctArr) = 100` ✓     |
| `sdrsNecessarios = sqlsAnuais / 12 / capacidadeMensal`                      | Dimensões: SQLs/ano ÷ meses/ano ÷ SQLs/(SDR·mês) = SDRs. Correto ✓                                                       |
| `aesNecessarios = dealsAnuais / 12 / dealsPorAe`                            | Mesmo padrão — correto ✓                                                                                                 |
| Ramp curve `capacityNoMes()`                                                | rampMeses=5: 10%→32,5%→55%→77,5%→100%. Interpolação linear de 10% a 100% em 5 meses ✓                                    |
| `grrMensalEfetivo = GRR^(1/12)` (motions recorrentes)                       | Conversão de taxa anual para mensal via raiz 12ª. `0.95^(1/12) = 0.99574`; `0.99574^12 = 0.95` ✓                         |
| `expansionRate = (NRR-GRR)/100/12`                                          | Spread anual de expansão dividido por 12. Correto ✓                                                                      |
| `churnMrr = bopMrr × (1 - grrMensalEfetivo)`                                | Retenção correta: `eopRetido = bopMrr × grrMensalEfetivo` ✓                                                              |
| `eopMrr = bopMrr - churnMrr + expansionMrr + newLogoMrr`                    | Estrutura correta de waterfall MRR ✓                                                                                     |
| Thresholds de verdict (<60% critico, 60-80% falta, 80-110% ok, >110% sobra) | Implementação fiel aos thresholds declarados ✓                                                                           |
| `pctAtendimento = (atual/necessario) × 100`                                 | Cálculo correto de % de atendimento ✓                                                                                    |
| `sqlsPorSdrPorMes = sqlsAnuais/12 / sdrsNecessarios`                        | Circular mas consistente — retorna o `sdrsCapacityPorMes` inputado ✓                                                     |

---

## Roteiro de fix priorizado

### Sprint 1 — Antes de qualquer teste com usuário real (P0)

**Fix P0-1 — Marketing verdict (30 min):**

```typescript
// relacoes-matematicas.ts:134
// ANTES:
const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl)
// DEPOIS:
const marketingNecessario = custoMarketingTotal / Math.max(1, input.marketing.budgetMensalBrl * 12)
```

E filtrar marketing do hiring plan:

```typescript
// hiring-engine.ts:18
for (const v of verdicts) {
  if (v.funcao === 'marketing') continue // budget, não headcount
  if (v.status !== 'falta' && v.status !== 'critico') continue
  if (v.gap < 0.3) continue
  // ...
}
```

**Fix P0-2 — Hiring inviável (20 min):**

```typescript
// hiring-engine.ts:22-38
const mesAlvoAjustado = Math.min(horizonMeses, Math.max(6, Math.ceil(horizonMeses / 2)))
const rawMesContratacao = mesAlvoAjustado - rampMeses
const mesContratacao = Math.max(1, rawMesContratacao)

const bloqueante =
  rawMesContratacao < 1
    ? `Inviável: precisaria ter contratado antes do início do horizonte (mês ${rawMesContratacao}). Transfira senior interno ou revise a meta.`
    : null
```

### Sprint 2 — Antes de deploy público (P1)

**Fix P1-1 — Double-churn (20 min):**

```typescript
// scientific-forecast.ts:30
// ANTES:
const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12) - churnNaturalMensal)
// DEPOIS: confiar no GRR inputado para todos os tipos de receita
const grrMensalEfetivo = Math.max(0, Math.pow(grrMensal, 1 / 12))
// churnNatural continua existindo só para o warning em input-validators.ts
```

**Fix P1-2 — Scientific Forecast overshoot (1h):**

```typescript
// scientific-forecast.ts:34
// Aproximação analítica para compensar a expansão composta:
const expansionMedia = mrrAtual * expansionRate // expansão inicial (conservador)
const newLogoMrrMonthly = Math.max(
  0,
  (mrrMeta - mrrAtual * Math.pow(grrMensal, horizon / 12) - expansionMedia * horizon) / horizon,
)
// Alternativa precisa: iteração binária para achar o valor que produz EOP[horizon] = mrrMeta
```

### Sprint 3 — Melhoria de qualidade (P2)

1. Pipeline: usar `(arrMeta - arrAtual) × pipelineCoverage` em vez de `arrMeta × pipelineCoverage`
2. CSM: usar `clientesAtivos + dealsNecessarios` como base de cálculo
3. MQL: remover `mqlsPorMes` ou fazer distinção real com taxa de conversão MQA→MQL

---

## Apêndice — Verificação dos Cenários do Prompt

### Cenário A — Outputs calculados manualmente vs engine

Input: arrAtual=R$5M, arrMeta=R$10M, high_touch 100%, ACV=R$200K, winRate=25%, sqlSal=70%, mqaSql=50%, accountMqa=20%, SDRs cap=20/mês, AEs cap=2/mês, CSM max=25 contas

| Campo                    | Engine atual      | Correto              | Status  |
| ------------------------ | ----------------- | -------------------- | ------- |
| dealsNecessarios         | 50                | 50                   | ✅      |
| salsNecessarios          | 200               | 200                  | ✅      |
| sqlsNecessarios          | 286               | 286                  | ✅      |
| mqasNecessarios          | 572               | 572                  | ✅      |
| accountsNecessarios      | 2.858             | 2.858                | ✅      |
| sdrsNecessarios          | 1,2               | 1,2                  | ✅      |
| aesNecessarios           | 2,1               | 2,1                  | ✅      |
| csmsNecessarios          | 2,0               | 2,0                  | ✅      |
| marketingNecessario      | 57,2              | 4,77                 | ❌ P0-1 |
| marketing pctAtendimento | 1,7%              | 21,0%                | ❌ P0-1 |
| hiring plan (marketing)  | "57 contratações" | "budget 21% coberto" | ❌ P0-1 |
| viavel (com gap vendas)  | true              | depende do gap       | ❌ P0-2 |

### Cenário C — Scientific Forecast, mês 12

Input: arrAtual=R$10M, arrMeta=R$20M, GRR=95%, NRR=110%, 12 meses, todos recorrentes

| Campo             | Engine atual | Correto   | Status  |
| ----------------- | ------------ | --------- | ------- |
| grrMensalEfetivo  | 0,99574      | 0,99574   | ✅      |
| expansionRate     | 0,01250      | 0,01250   | ✅      |
| newLogoMrrMonthly | 72.917       | ~66.000\* | ❌ P1-2 |
| EOP[12] MRR       | 1.835.122    | 1.666.667 | ❌ P1-2 |
| EOP[12] ARR       | R$22,0M      | R$20,0M   | ❌ P1-2 |
| Overshoot         | +10,1%       | 0%        | ❌ P1-2 |

\*valor aproximado; requer iteração para resultado exato

### Cenário D — Double-churn (non-recorrente, GRR=95%, contrato 12 meses)

| Campo                    | Engine atual | Correto             | Status  |
| ------------------------ | ------------ | ------------------- | ------- |
| churnNaturalMensal       | 0,0833       | (não deve subtrair) | ❌ P1-1 |
| grrMensalEfetivo         | 0,9124       | 0,9957              | ❌ P1-1 |
| Retenção anual implícita | 33,3%        | 95%                 | ❌ P1-1 |

---

_Fim do relatório · GTM BlackBox · 2026-04-27_
