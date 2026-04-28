'use client'

import { useState } from 'react'
import { Copy, Check, Download } from 'lucide-react'

export function ExportClient({
  txt,
  prompt,
  empresa,
}: {
  txt: string
  prompt: string
  empresa: string
}) {
  const [copiedTxt, setCopiedTxt] = useState(false)
  const [copiedPrompt, setCopiedPrompt] = useState(false)

  async function copy(text: string, which: 'txt' | 'prompt') {
    try {
      await navigator.clipboard.writeText(text)
      if (which === 'txt') {
        setCopiedTxt(true)
        setTimeout(() => setCopiedTxt(false), 2000)
      } else {
        setCopiedPrompt(true)
        setTimeout(() => setCopiedPrompt(false), 2000)
      }
    } catch {
      alert('Falha ao copiar — selecione o texto e copie manualmente.')
    }
  }

  function download(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const safeEmpresa = empresa
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return (
    <div className="mt-10 flex flex-col gap-10">
      <Section
        title="(a) Roadmap em TXT"
        subtitle="Texto formatado pronto para colar em e-mail, doc ou Notion."
        text={txt}
        copied={copiedTxt}
        onCopy={() => copy(txt, 'txt')}
        onDownload={() => download(txt, `roadmap-gtm-${safeEmpresa || 'export'}.txt`)}
      />
      <Section
        title="(b) Prompt para Claude (gera HTML visual)"
        subtitle="Cole no Claude.ai e ele gera um plano visual com a identidade da sua empresa."
        text={prompt}
        copied={copiedPrompt}
        onCopy={() => copy(prompt, 'prompt')}
        onDownload={() => download(prompt, `prompt-claude-roadmap-${safeEmpresa || 'export'}.txt`)}
      />
    </div>
  )
}

function Section({
  title,
  subtitle,
  text,
  copied,
  onCopy,
  onDownload,
}: {
  title: string
  subtitle: string
  text: string
  copied: boolean
  onCopy: () => void
  onDownload: () => void
}) {
  return (
    <section>
      <p className="font-lexend text-3xs uppercase tracking-widest text-scient-primary">{title}</p>
      <p className="mt-1 font-sora text-xs text-scient-gray">{subtitle}</p>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 bg-scient-primary px-4 py-2 font-sora text-2xs uppercase tracking-widest text-white hover:bg-scient-primary-hover"
        >
          {copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center gap-1.5 border border-scient-divider px-4 py-2 font-sora text-2xs uppercase tracking-widest hover:border-scient-primary"
        >
          <Download size={12} strokeWidth={1.5} /> Download .txt
        </button>
      </div>

      <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap border border-scient-divider bg-white p-4 font-mono text-2xs leading-relaxed">
        {text}
      </pre>
    </section>
  )
}
