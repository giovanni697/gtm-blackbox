# QA Prompt — GTM BlackBox

> Cole este prompt numa sessão de Claude Code com acesso ao repo e ao browser para executar o QA completo.

---

## Contexto

GTM BlackBox é uma plataforma Next.js 14 (App Router) hospedada em Vercel.

- **URL produção:** `https://gtm-blackbox.vercel.app`
- **Repo local:** `/Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox/`
- **Stack:** Next.js 14, Supabase, Tailwind, MDX, Resend, Zod

Execute cada seção abaixo em sequência. Registre ✅ / ❌ / ⚠️ para cada item.

---

## 1. Build & TypeScript

```bash
cd /Users/giovannisalvador/Desktop/GTMBLackBox/gtm-blackbox

# TypeScript — deve retornar 0 erros
npx tsc --noEmit 2>&1

# ESLint — deve retornar 0 erros críticos
npx next lint 2>&1

# Build completo
npm run build 2>&1 | tail -30
```

**Critérios:**

- [ ] `tsc --noEmit` sem erros
- [ ] `next lint` sem erros (warnings aceitáveis)
- [ ] Build completa sem falhas
- [ ] Nenhuma rota com erro de geração estática

---

## 2. Performance — Rotas críticas

Inspecione os arquivos para verificar:

```bash
# Verificar loading.tsx em todas as rotas de conteúdo
find src/app/\(app\) -name "loading.tsx" | sort

# Verificar ausência de queries sequenciais bloqueantes
grep -n "await supabase" src/app/\(app\)/hub/page.tsx
grep -n "await supabase" src/app/\(app\)/diagnostico/page.tsx
grep -n "await supabase" src/app/\(app\)/diagnostico/resultado/page.tsx
```

**Critérios:**

- [ ] `loading.tsx` existe em: `/ebook`, `/ebook/[slug]`, `/templates`, `/templates/[slug]`
- [ ] Hub page: queries não são puramente sequenciais
- [ ] Diagnostico page: queries paralelas onde possível
- [ ] Resultado page: sem waterfall desnecessário

---

## 3. Mobile Navigation

Abra `https://gtm-blackbox.vercel.app` no DevTools com viewport mobile (375px).

**Checklist:**

- [ ] Bottom tab bar aparece no rodapé com 5 ícones (Hub, Ebook, Diagnóstico, Templates, Forecast)
- [ ] Bottom tab bar é `fixed` — não sai da tela ao rolar
- [ ] Ícone da seção ativa está em azul (`#0030E8`)
- [ ] Top bar some ao rolar para baixo
- [ ] Top bar reaparece ao rolar para cima
- [ ] Nenhum conteúdo fica escondido atrás do bottom bar (padding correto)
- [ ] Desktop (>768px): bottom bar invisível, sidebar lateral visível

---

## 4. Navegação prev/next

**Ebook:**

```
Acesse: /ebook/[primeiro-capitulo]
```

- [ ] Footer tem cards "Próximo →" funcionando
- [ ] Primeiro capítulo: sem card "← Anterior"
- [ ] Último capítulo: sem card "Próximo →"
- [ ] Links navegam para o capítulo correto

**Templates:**

```
Acesse: /templates/[qualquer-template]
```

- [ ] Footer tem prev/next navigation igual ao ebook
- [ ] Links navegam para o template correto em ordem por `number`
- [ ] Primeiro template: sem "← Anterior"
- [ ] Último template: sem "Próximo →"

---

## 5. Fluxo de Auth

```
Abra: https://gtm-blackbox.vercel.app/login
```

- [ ] Formulário de login renderiza corretamente
- [ ] Email pessoal (@gmail, @hotmail) retorna erro amigável
- [ ] Email corporativo: funciona ou exibe mensagem correta
- [ ] Redirect após login vai para `/hub`
- [ ] Logout funciona e redireciona para `/login`
- [ ] Acesso direto a `/hub` sem login redireciona para `/login`

---

## 6. Diagnóstico (fluxo completo)

```
Logue com uma conta de teste e acesse /diagnostico
```

- [ ] Wizard inicia corretamente
- [ ] Perguntas navegam sem travamento
- [ ] Auto-save funciona (recarregar página mantém progresso)
- [ ] Resultado carrega com scores P1-P5
- [ ] Radar chart renderiza
- [ ] Roadmap 90 dias aparece
- [ ] Exportar PDF/prompt funciona
- [ ] `/diagnostico/roadmap` renderiza sem erro

---

## 7. Forecast (fluxo completo)

```
Acesse /forecast
```

- [ ] Wizard de inputs carrega
- [ ] Validação de campos funciona (erro ao deixar campo vazio)
- [ ] Resultado renderiza com projeção mês a mês
- [ ] Recharts gráficos carregam (dinamic import, client-side)
- [ ] Exportar funciona

---

## 8. Ebook

```
Acesse /ebook
```

- [ ] Lista de capítulos renderiza
- [ ] Cada capítulo abre sem erro 404
- [ ] MDX renderiza corretamente (headers, lists, tables)
- [ ] ProgressBar aparece no scroll
- [ ] ChapterNav funciona no mobile (abre/fecha)
- [ ] Busca no ChapterNav filtra capítulos

---

## 9. Templates

```
Acesse /templates
```

- [ ] Grid de templates renderiza
- [ ] Cada template abre sem erro 404
- [ ] Seções template/rubrica renderizam
- [ ] Link para capítulo do ebook relacionado funciona
- [ ] Link para diagnóstico funciona

---

## 10. Email Drip (verificação)

```bash
# Verificar estado atual da fila de emails
# Use a service role key do .env.local (SUPABASE_SERVICE_ROLE_KEY)
curl -s "https://aqohksffwzutqlorioxf.supabase.co/rest/v1/email_queue?select=status" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
counts = Counter(r['status'] for r in data)
for k,v in sorted(counts.items()): print(f'{k}: {v}')
print(f'Total: {len(data)}')
"
```

- [ ] Nenhum email em status `sending` (indicaria stuck row)
- [ ] Emails `sent` crescendo ao longo do tempo
- [ ] Razão `sent/(sent+queued)` coerente com dias desde ativação

---

## 11. API Routes (saúde)

```bash
# Testar webhook endpoint (deve retornar 400, não 500)
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://gtm-blackbox.vercel.app/api/webhooks/resend"

# Testar cron com auth errado (deve retornar 401)
curl -s -o /dev/null -w "%{http_code}" \
  "https://gtm-blackbox.vercel.app/api/cron/email-dispatcher"
```

- [ ] Webhook retorna 400 (sem body válido), não 500
- [ ] Cron sem auth retorna 401
- [ ] Nenhuma rota de API exposta sem proteção

---

## 12. Acessibilidade & UX mínimo

Inspecione manualmente:

- [ ] Todos os `<button>` têm `aria-label` quando só ícone
- [ ] Links de navegação têm texto descritivo
- [ ] Formulários têm `<label>` associado
- [ ] Tab order lógico na página de login
- [ ] Sem texto branco sobre fundo branco ou preto sobre preto

---

## 13. API Agent-Ready (Fase 2 — verificar após deploy)

```bash
# Testar endpoint de perguntas (deve retornar JSON com perguntas)
curl -s "https://gtm-blackbox.vercel.app/api/v1/questions" \
  -H "X-GTM-Key: SEU_API_KEY"

# Testar endpoint diagnóstico (deve retornar 400 sem body)
curl -s -o /dev/null -w "%{http_code}" -X POST \
  "https://gtm-blackbox.vercel.app/api/v1/diagnostic" \
  -H "X-GTM-Key: SEU_API_KEY"

# Testar MCP manifest
curl -s "https://gtm-blackbox.vercel.app/api/mcp" | head -100
```

- [ ] `/api/v1/questions` retorna array de perguntas sem autenticação → 401
- [ ] `/api/v1/questions` com API key válida → 200 com JSON
- [ ] `/api/v1/diagnostic` sem body → 400 (não 500)
- [ ] `/api/mcp` retorna manifest de tools MCP válido

---

## Resultado Final

| Seção           | Status | Notas |
| --------------- | ------ | ----- |
| 1. Build & TS   |        |       |
| 2. Performance  |        |       |
| 3. Mobile Nav   |        |       |
| 4. Prev/Next    |        |       |
| 5. Auth         |        |       |
| 6. Diagnóstico  |        |       |
| 7. Forecast     |        |       |
| 8. Ebook        |        |       |
| 9. Templates    |        |       |
| 10. Email Drip  |        |       |
| 11. API Routes  |        |       |
| 12. A11y        |        |       |
| 13. Agent-Ready |        |       |

**Score:** \_\_\_/13 seções sem ❌

---

_QA Prompt gerado em 2026-05-27 — GTM BlackBox v0.1_
