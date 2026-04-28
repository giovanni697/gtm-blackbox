# Prompt — detectar e corrigir tabelas Markdown não-renderizadas em MDX

> **Cole este prompt em uma sessão Claude Code, dentro de qualquer projeto Next.js + MDX que renderize conteúdo via `next-mdx-remote/rsc` ou `@next/mdx`.**
> A IA vai identificar o sintoma, diagnosticar a causa-raiz e aplicar o fix completo.

---

## 1 · Contexto da plataforma

Você está auditando um projeto **Next.js 14 (App Router)** que renderiza conteúdo Markdown/MDX via `next-mdx-remote/rsc` ou `@next/mdx`. O conteúdo editorial vive em arquivos `.mdx` ou `.md` numa pasta como `content/` ou `posts/`.

---

## 2 · Sintoma a procurar

O usuário relata que **tabelas em formato pipe-style** estão aparecendo como **texto literal**, com os caracteres `|` visíveis e tudo numa única linha de parágrafo, em vez de renderizar como uma tabela HTML real.

**Exemplo do que o usuário vê (errado):**

```
| Etapa CRM | M | Critério de saída | |---|---|---| | Account | M1 | Está na LCA | | Engagement | M2 | MQA — engajamento qualificado |
```

**O que deveria aparecer (correto):**

| Etapa CRM  | M   | Critério de saída             |
| ---------- | --- | ----------------------------- |
| Account    | M1  | Está na LCA                   |
| Engagement | M2  | MQA — engajamento qualificado |

Outros sintomas que costumam aparecer junto:

- Listas de tarefas `- [ ]` aparecendo como bullets normais com o `[ ]` literal
- Strikethrough `~~texto~~` aparecendo como `~~texto~~` literal
- URLs auto-linkadas `https://exemplo.com` aparecendo como texto plain (não-clicável)

---

## 3 · Causa-raiz

**`remark-gfm` (GitHub Flavored Markdown) não está instalado ou não está plugado no MDXRemote.**

O parser MDX padrão **NÃO** suporta nativamente:

- Tabelas pipe-style
- Task lists `- [ ]`
- Strikethrough `~~text~~`
- Auto-link de URLs
- Footnotes `[^1]`

Todas essas extensões fazem parte do **GFM** (GitHub Flavored Markdown) — um superset do CommonMark que precisa ser explicitamente adicionado via plugin remark.

O frontmatter funciona, headings funcionam, parágrafos funcionam — só os recursos GFM ficam quebrados. Por isso o sintoma é parcial e confunde.

---

## 4 · Diagnóstico — execute estes comandos

```bash
# 1) Confirma que o plugin NÃO está instalado:
npm ls remark-gfm
# Esperado se o bug existir: `(empty)` ou "missing"

# 2) Encontra todos os usos de MDXRemote no projeto:
grep -rn "MDXRemote" src/ --include="*.tsx"
# Devem ser as páginas que renderizam conteúdo (ex: /ebook/[slug]/page.tsx, /templates/[slug]/page.tsx, /blog/[slug]/page.tsx)

# 3) Confirma que tem tabelas em arquivos .mdx ou .md (linhas começando com `|`):
grep -rlE "^\|" content/ posts/ 2>/dev/null
```

Se item 1 retorna `(empty)` E itens 2-3 retornam resultados → diagnóstico confirmado. Aplicar fix.

---

## 5 · Fix — aplicar em 3 passos

### Passo 1 — Instalar o plugin

```bash
npm install remark-gfm
```

(Versão atual no momento: `^4.0.x`. Compatível com Next.js 14+.)

### Passo 2 — Plugar em cada `MDXRemote`

Para **cada** arquivo encontrado no `grep` do Diagnóstico passo 2, adicionar:

```tsx
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'   // ← novo import

// Constante reusable (opcional, mas recomendado se chamar MDXRemote múltiplas vezes na mesma page):
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } }

// No JSX, em CADA <MDXRemote ...>:
<MDXRemote
  source={content}
  components={mdxComponents}
  options={mdxOptions}   // ← novo prop
/>
```

### Passo 3 — Restart fresh do dev server

```bash
# Mata dev rodando
pkill -f "next dev"
sleep 2

# Limpa .next (importante — manifesto cached pode reter parser antigo)
rm -rf .next

# Sobe dev
npm run dev
```

Hard refresh no browser (`⌘+Shift+R` no Mac, `Ctrl+Shift+R` no Linux/Windows).

---

## 6 · Validação pós-fix

1. Abrir página com tabela no browser → deve aparecer como tabela HTML real, não texto.
2. Inspecionar elemento na tabela → deve ter `<table><thead><tr><th>...` (não `<p>...|...|...</p>`).
3. Lint + build:
   ```bash
   npm run lint && npm run build
   ```
   Deve passar sem warnings novos.

---

## 7 · Plugins remark/rehype úteis (extras opcionais)

Se a plataforma precisa de mais features Markdown, considerar também:

| Plugin                                     | O que faz                                   | Quando usar                         |
| ------------------------------------------ | ------------------------------------------- | ----------------------------------- |
| `remark-gfm`                               | Tables, task lists, strikethrough, autolink | **Quase sempre**                    |
| `remark-breaks`                            | Hard line breaks (1 quebra = `<br>`)        | Se conteúdo vier de input multiline |
| `remark-frontmatter`                       | Aceita YAML frontmatter sem o gray-matter   | Se NÃO usar gray-matter já          |
| `rehype-slug`                              | Adiciona `id` automático em headings        | Para anchor links                   |
| `rehype-autolink-headings`                 | Links âncora visíveis em headings           | Docs/ebook longos                   |
| `rehype-pretty-code` ou `rehype-highlight` | Syntax highlighting de code blocks          | Conteúdo técnico com código         |

Cada um instala via npm e adiciona ao array correspondente:

```tsx
const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm, remarkBreaks],
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
}
```

---

## 8 · Por que isso acontece (fundamento)

`@next/mdx` e `next-mdx-remote` usam o parser **MDX 3** que segue **CommonMark estrito** por padrão. CommonMark NÃO inclui tabelas — elas vêm da extensão GFM proposta pelo GitHub para o `README.md` deles. Como GFM não é parte do spec oficial CommonMark, fica como plugin opt-in.

Decisão arquitetural defensável (parser pequeno e previsível por padrão), mas armadilha clássica para quem migra de Jekyll/Hugo/Docusaurus onde GFM já vem embutido.

---

## 9 · Como prevenir esse bug em futuros projetos

Adicionar ao **template de boilerplate** do projeto (ou ao README do skill `claude-code-guide`):

> Sempre que usar `next-mdx-remote/rsc` para renderizar conteúdo escrito por humanos, **adicionar `remark-gfm` desde a primeira commit**. O custo é zero (≈30kb gzipped) e o benefício é evitar 2-3 horas de debug quando alguém reportar "tabelas não funcionam".

---

## 10 · Output esperado da IA executando este prompt

A IA deve:

1. ✅ Rodar os comandos de diagnóstico (§4) e reportar resultados.
2. ✅ Confirmar que o sintoma se aplica.
3. ✅ Executar os 3 passos do fix (§5).
4. ✅ Restart fresh do dev server.
5. ✅ Reportar ao usuário com instrução de hard refresh.
6. ✅ Sugerir adicionar `remark-gfm` à lista de plugins-padrão do projeto via ADR.

Se houver múltiplas páginas usando `MDXRemote`, aplicar em **todas** — não apenas na primeira.
