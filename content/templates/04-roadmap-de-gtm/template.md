---
slug: '04-roadmap-de-gtm'
---

## Roadmap GTM 90 dias — Now / Next / Later

### Now (0-30 dias) — Ataque ao gargalo principal

| Item                           | Owner    | Métrica          | Prazo    | Status        |
| ------------------------------ | -------- | ---------------- | -------- | ------------- |
| `{Ação principal no gargalo}`  | `{Nome}` | `{Antes → Alvo}` | `{Data}` | `{Andamento}` |
| `{Ação secundária no gargalo}` | `{Nome}` | `{Antes → Alvo}` | `{Data}` | `{Andamento}` |
| `{Quick win paralelo}`         | `{Nome}` | `{Antes → Alvo}` | `{Data}` | `{Andamento}` |

### Next (31-60 dias) — Ações dependentes do Now

| Item       | Owner    | Métrica          | Prazo    | Dependência    |
| ---------- | -------- | ---------------- | -------- | -------------- |
| `{Ação 1}` | `{Nome}` | `{Antes → Alvo}` | `{Data}` | `{Now item X}` |
| `{Ação 2}` | `{Nome}` | `{Antes → Alvo}` | `{Data}` | `{Now item Y}` |

### Later (61-90 dias) — Em fila

| Item     | Owner           | Justificativa para entrar na fila                    |
| -------- | --------------- | ---------------------------------------------------- |
| `{Ação}` | `{Nome ou TBD}` | `{Por que importa mas não bloqueia o gargalo atual}` |
| `{Ação}` | `{Nome ou TBD}` | `{Por que importa mas não bloqueia o gargalo atual}` |

## Card padrão por item do Roadmap

```
ITEM: {nome curto, &lt;80 chars}
PILAR: {1-5}
TIPO: {feature | processo | ferramenta | contratação | treinamento}

CONTEXTO
{Por que estamos fazendo isso? Conexão com gargalo identificado em qual MBR?}

HIPÓTESE
Se {fizermos X}, então {métrica Y vai mover de A para B} em {prazo}.

OWNER
{Nome único, não comitê}

PRÉ-REQUISITOS
- {Lista de condições necessárias}
- {Inclui dependências de outros times}

DEFINITION OF DONE
- {Critério objetivo}
- {Critério objetivo}

MÉTRICA DE VALIDAÇÃO
- Antes: {número}
- Alvo: {número} em {prazo}
- Source: {dashboard ou query}

CUSTO ESTIMADO
- Headcount: {N pessoas × N horas}
- Investimento financeiro: {R$X}
- Trade-off: {o que deixamos de fazer para fazer isso}

PRÓXIMO CHECKPOINT
- {Data} no MBR de {mês}
- Status esperado: {milestone parcial}
```

## Regras de movimentação

### Now → completo

Item entrega Definition of Done + métrica validada. Move para "completed log" — não some, fica registrado.

### Now → Next (deslizou)

Item não entregou DoD no prazo. Volta para Next se hipótese ainda válida; é arquivado se hipótese falhou.

### Next → Now

Quando um item do Now é completed, o próximo item do Next que tem prerequisito atendido vira Now.

### Later → Next

Quando uma prioridade muda no MBR (gargalo move, contexto novo), item do Later pode ser promovido.

### Anti-padrão

Roadmap que cresce indefinidamente é Roadmap morto. Limite total: ~10-15 itens em Now+Next+Later. Mais que isso é debate, não execução.
