---
slug: '06-identificacao-de-gargalos'
---

## TOC aplicado ao funil M1-M8

### Passo 1 — Identify (identificar o gargalo)

Tabela de comparação:

| Transição                | Sua taxa atual | Benchmark Mid-Market | Delta | Custo do Gap (R$/mês) |
| ------------------------ | -------------- | -------------------- | ----- | --------------------- |
| M1 → M2 (Account → MQA)  | \_%            | 10-20%               | \_    | R$\_                  |
| M2 → M3 (MQA → SQL)      | \_%            | 30-50%               | \_    | R$\_                  |
| M3 → M4 (SQL → SAL)      | \_%            | 50-70%               | \_    | R$\_                  |
| M4 → M5 (SAL → Won)      | \_%            | 20-33%               | \_    | R$\_                  |
| M6 → M7 (Ativo → Adoção) | \_%            | 90-95%               | \_    | R$\_                  |
| GRR                      | \_%            | ≥85%                 | \_    | R$\_                  |
| NRR                      | \_%            | ≥110%                | \_    | R$\_                  |

**Gargalo = transição com maior delta negativo em % E maior custo do gap em R$.**

### Cálculo do custo do gap

```
Custo do Gap = (taxa_benchmark - taxa_atual) × volume_estagio_anterior × valor_unitario
```

Exemplo: SAL→Won com taxa atual 20% vs benchmark 30%, com 100 SAL/mês e ACV médio R$50K:

```
Gap = (30% - 20%) × 100 × R$50K = 10 × R$50K = R$500K/mês de ARR potencial perdido
```

### Passo 2 — Exploit (explorar com o que existe)

Antes de pedir headcount ou ferramenta, atacar o gargalo com recursos atuais. Lista de exploitations por estágio:

| Gargalo   | Exploitations sem $ novo                                                      |
| --------- | ----------------------------------------------------------------------------- |
| M1→M2     | Revisar critério LCA · ajustar tema das campanhas · melhorar enrichment       |
| M2→M3     | Refinar critério SDR · reduzir tempo MQA→Discovery · treinar Discovery skills |
| M3→M4     | Melhorar metodologia de quantificação · tempo em mapping de stakeholders      |
| M4→M5     | Revisar Pricing & Negotiation playbook · reduzir desconto via Value Selling   |
| M6→M7     | Estruturar Onboarding com TTFI claro · QBRs proativas D+30/D+60               |
| GRR baixo | Health Score precoce · intervenções preventivas · revisar fit                 |
| NRR baixo | Estruturar Expansion Plays · capacitar CSMs em vendas                         |

### Passo 3 — Subordinate (subordinar o resto)

Os outros estágios não devem rodar mais rápido que o gargalo absorve. Auditoria:

- Headcount alocado é proporcional à capacity necessária por estágio?
- Volume gerado em estágios anteriores está acima/abaixo da capacity do gargalo?

### Passo 4 — Elevate (elevar com $ novo)

Quando exploitation esgota:

- Mais headcount no estágio gargalo
- Ferramentas específicas (intent data, sales engagement, CS platform)
- Programas de capacitação intensiva
- Parcerias estratégicas

### Passo 5 — Repeat

Quando o gargalo move (resolveu), volte ao passo 1. Identifique o novo gargalo. **Sempre há um.**

## Anti-padrão clássico

Empresas que ignoram TOC tendem a otimizar o que é fácil otimizar (geralmente o topo do funil — gerar mais leads). Mas se o gargalo é SAL → Won, mais leads no topo só aumenta o pipeline morto.

**Frase âncora**: o gargalo do sistema determina o throughput total.
