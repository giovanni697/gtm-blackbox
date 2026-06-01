'use client'

import { useRouter } from 'next/navigation'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import { saveContentEdit, revertContentEdit } from '../../actions'
import type { ContentType } from '@/lib/content/getContentOverride'

interface Props {
  contentType: ContentType
  slug: string
  currentBody: string
  hasOverride: boolean
}

export function EditorWrapper({ contentType, slug, currentBody, hasOverride }: Props) {
  const router = useRouter()

  async function handleSave(body: string) {
    return saveContentEdit(contentType, slug, body)
  }

  async function handleRevert() {
    const result = await revertContentEdit(contentType, slug)
    if (result.ok) {
      // Recarregar o server component — o editor recebe novo initialBody (filesystem original)
      router.refresh()
    }
    return result
  }

  return (
    <MarkdownEditor
      // key muda quando o override é removido → React remonta o editor com o body original
      key={hasOverride ? `override::${slug}` : `original::${slug}`}
      initialBody={currentBody}
      hasOverride={hasOverride}
      onSave={handleSave}
      onRevert={handleRevert}
    />
  )
}
