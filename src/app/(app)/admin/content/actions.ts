'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { requireAdmin } from '@/lib/email/admin-guard'
import { createServiceClient } from '@/lib/supabase/service'
import {
  VALID_CONTENT_TYPES,
  type ContentType,
  type ContentEditRecord,
} from '@/lib/content/getContentOverride'

export async function saveContentEdit(
  contentType: ContentType,
  slug: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin()

  if (!VALID_CONTENT_TYPES.includes(contentType)) {
    return { ok: false, error: 'Tipo de conteúdo inválido.' }
  }
  if (!slug?.trim() || !body?.trim()) {
    return { ok: false, error: 'Slug e body são obrigatórios.' }
  }

  const sb = createServiceClient()
  const { error } = await sb.from('content_edits').upsert(
    {
      content_type: contentType,
      slug: slug.trim(),
      body: body.trim(),
      updated_by: user.email!,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'content_type,slug' },
  )

  if (error) {
    console.error('[saveContentEdit] DB error:', error.message)
    return { ok: false, error: 'Erro ao salvar. Tente novamente.' }
  }

  // Bust ISR cache da página pública afetada
  if (contentType === 'ebook') {
    revalidatePath(`/ebook/${slug}`)
  } else {
    revalidatePath(`/templates/${slug}`)
  }
  revalidateTag('content-overrides')

  return { ok: true }
}

export async function revertContentEdit(
  contentType: ContentType,
  slug: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()

  const sb = createServiceClient()
  const { error } = await sb
    .from('content_edits')
    .delete()
    .eq('content_type', contentType)
    .eq('slug', slug)

  if (error) {
    console.error('[revertContentEdit] DB error:', error.message)
    return { ok: false, error: 'Erro ao reverter. Tente novamente.' }
  }

  if (contentType === 'ebook') {
    revalidatePath(`/ebook/${slug}`)
  } else {
    revalidatePath(`/templates/${slug}`)
  }
  revalidateTag('content-overrides')

  return { ok: true }
}

/** Lista todos os overrides ativos — para o badge "Editado" na listagem. */
export async function listContentEdits(): Promise<ContentEditRecord[]> {
  await requireAdmin()
  const sb = createServiceClient()
  const { data } = await sb
    .from('content_edits')
    .select('content_type, slug, updated_by, updated_at')
    .order('updated_at', { ascending: false })
  return (data ?? []) as ContentEditRecord[]
}
