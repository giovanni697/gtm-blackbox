'use client'

import { useRef, useState, useTransition } from 'react'
import { Check, Loader2, RotateCcw } from 'lucide-react'

interface Props {
  initialBody: string
  hasOverride: boolean
  onSave: (body: string) => Promise<{ ok: boolean; error?: string }>
  onRevert: () => Promise<{ ok: boolean; error?: string }>
}

export function MarkdownEditor({ initialBody, hasOverride, onSave, onRevert }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [body, setBody] = useState(initialBody)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  /** Insere markdown na posição do cursor, selecionando o texto inserido. */
  function insertAtCursor(prefix: string, suffix = '') {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = body.slice(start, end) || 'texto'
    const newBody = body.slice(0, start) + prefix + selected + suffix + body.slice(end)
    setBody(newBody)
    requestAnimationFrame(() => {
      el.focus()
      const selStart = start + prefix.length
      const selEnd = selStart + selected.length
      el.setSelectionRange(selStart, selEnd)
    })
  }

  function handleH2() {
    // Insere '## ' no início da linha atual
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const lineStart = body.lastIndexOf('\n', pos - 1) + 1
    const newBody = body.slice(0, lineStart) + '## ' + body.slice(lineStart)
    setBody(newBody)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos + 3, pos + 3)
    })
  }

  function handleH3() {
    const el = textareaRef.current
    if (!el) return
    const pos = el.selectionStart
    const lineStart = body.lastIndexOf('\n', pos - 1) + 1
    const newBody = body.slice(0, lineStart) + '### ' + body.slice(lineStart)
    setBody(newBody)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos + 4, pos + 4)
    })
  }

  function handleSave() {
    setSaveState('idle')
    setErrorMsg(null)
    startTransition(async () => {
      const result = await onSave(body)
      if (result.ok) {
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 3000)
      } else {
        setSaveState('error')
        setErrorMsg(result.error ?? 'Erro ao salvar')
      }
    })
  }

  function handleRevert() {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await onRevert()
      if (!result.ok) {
        setSaveState('error')
        setErrorMsg(result.error ?? 'Erro ao reverter')
      }
      // Após revert, o server component re-renderiza via router.refresh()
      // e o EditorWrapper recebe novo initialBody — o componente se reinicia via key
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border border-scient-divider bg-scient-bg px-3 py-2">
        <span className="mr-3 font-sora text-3xs uppercase tracking-widest text-scient-gray">
          Formatação
        </span>
        <ToolbarButton label="H2" title="Título secundário (##)" onClick={handleH2} />
        <ToolbarButton label="H3" title="Título terciário (###)" onClick={handleH3} />
        <ToolbarButton
          label="B"
          title="Negrito (**texto**)"
          bold
          onClick={() => insertAtCursor('**', '**')}
        />
        <div className="mx-2 h-4 w-px bg-scient-divider" />
        <span className="font-mono text-3xs text-scient-gray">
          {body.length.toLocaleString('pt-BR')} chars
        </span>
      </div>

      {/* Textarea principal */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          if (saveState !== 'idle') setSaveState('idle')
        }}
        className="min-h-[520px] w-full resize-y border border-scient-divider bg-white p-4 font-mono text-xs leading-relaxed text-scient-dark focus:border-scient-primary focus:outline-none"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* Mensagem de erro */}
      {errorMsg && <p className="font-sora text-xs text-red-600">{errorMsg}</p>}

      {/* Rodapé: status + botões */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 bg-scient-primary px-6 py-2.5 font-sora text-xs uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 size={12} className="animate-spin" />
          ) : saveState === 'saved' ? (
            <Check size={12} />
          ) : null}
          {isPending ? 'Salvando…' : saveState === 'saved' ? 'Salvo!' : 'Salvar'}
        </button>

        {hasOverride && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={isPending}
            className="flex items-center gap-1.5 font-sora text-xs text-scient-gray transition-colors hover:text-red-500 disabled:opacity-50"
            title="Remove o override e volta para o texto original do arquivo MDX"
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            Reverter para original
          </button>
        )}
      </div>

      {/* Hint syntax */}
      <div className="border border-scient-divider bg-scient-bg px-3 py-2">
        <p className="font-mono text-3xs text-scient-gray">
          <span className="mr-4">## Título H2</span>
          <span className="mr-4">### Título H3</span>
          <span className="mr-4">**negrito**</span>
          <span className="mr-4">*itálico*</span>
          <span>- item de lista</span>
        </p>
      </div>
    </div>
  )
}

function ToolbarButton({
  label,
  title,
  bold = false,
  onClick,
}: {
  label: string
  title: string
  bold?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 min-w-[2rem] items-center justify-center border border-scient-divider bg-white px-2 font-mono text-xs text-scient-dark transition-colors hover:bg-scient-bg"
      style={{ fontWeight: bold ? 700 : 500 }}
    >
      {label}
    </button>
  )
}
