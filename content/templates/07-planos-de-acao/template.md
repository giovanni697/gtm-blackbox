---
slug: '07-planos-de-acao'
---

## Formato canônico de Plano de Ação

```
─────────────────────────────────────────────
PLANO DE AÇÃO
Saído do MBR de {mês/ano}
─────────────────────────────────────────────

HIPÓTESE
Se {fizermos X}, então {métrica Y vai mover de A para B} em {prazo}.

GARGALO ALVO
{Pilar X · estágio M_ → M_ · transição com gap atual de Y%}

OWNER
{Nome único, não comitê}

PRÉ-REQUISITOS
- {Lista de condições necessárias}
- {Inclui dependências de outros times}
- {Acessos, dados, ferramentas necessários}

DEFINITION OF DONE
- {Critério objetivo 1}
- {Critério objetivo 2}
- {Critério objetivo 3}

MÉTRICA DE VALIDAÇÃO
- Antes: {número} (data: {data})
- Alvo: {número} em {prazo}
- Source: {dashboard, query SQL, ou planilha específica}
- Frequência de medição: {semanal | quinzenal | mensal}

CUSTO ESTIMADO
- Headcount: {N pessoas × N horas/semana × N semanas}
- Investimento financeiro: {R$X}
- Trade-off: {o que deixamos de fazer para fazer isso}

PRÓXIMO CHECKPOINT
- Data: {data}
- Quem: {Owner + Sponsor}
- Output esperado: {milestone parcial mensurável}

ESCALATION
Se {sintoma X} aparecer ou métrica regredir mais que {Y%},
escalation para {Sponsor} em <{Z dias}.
─────────────────────────────────────────────
```

## Checklist de qualidade

Antes do plano "passar" no MBR:

- [ ] Hipótese é falseável (se X então Y, mensurável).
- [ ] Owner é uma pessoa específica (não comitê, não "alguém do RevOps").
- [ ] Prazo é data específica (não "próximo trimestre").
- [ ] Métrica tem baseline + alvo + source + frequência.
- [ ] Custo declarado em headcount E financeiro.
- [ ] Trade-off explícito (o que não vamos fazer).
- [ ] Próximo checkpoint marcado em calendário.

## Exemplos de planos bons vs ruins

### ❌ Plano ruim

> "Vamos melhorar Discovery. RevOps assume. Vamos ver no próximo MBR."

Problemas: hipótese vaga, owner vago, sem prazo, sem métrica, sem trade-off.

### ✅ Plano bom

> **HIPÓTESE**: Se treinarmos os AEs em quantificação financeira na Discovery (template + role-play 2x/semana), então a taxa M3→M4 vai subir de 60% para 70% em 90 dias.
> **OWNER**: Maria, Head de Sales Enablement.
> **MÉTRICA**: M3→M4 (atual 60%, alvo 70%). Source: dashboard "Conversão por estágio · view mensal". Medição semanal.
> **CUSTO**: 8h Maria × 12 semanas + 4h cada AE × 12 semanas. Trade-off: pausar projeto de Conversation Intelligence (pré-requisito é treinamento humano antes).
> **CHECKPOINT**: Próximo MBR (data) — métrica intermediária esperada: 65%.

## Taxa de entrega como métrica do MBR

Operações maduras tracking explicitamente quanto dos planos do MBR anterior entregaram DoD. Benchmark:

- &lt;30%: MBR é teatro
- 30-60%: em formação
- 60-80%: saudável
- \>80%: top quartile
