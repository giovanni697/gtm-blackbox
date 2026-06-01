import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'

export type ContentType = 'ebook' | 'template_description' | 'template_body' | 'template_rubrica'

export const VALID_CONTENT_TYPES: ContentType[] = [
  'ebook',
  'template_description',
  'template_body',
  'template_rubrica',
]

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  ebook: 'Capítulo',
  template_description: 'Descrição',
  template_body: 'Template',
  template_rubrica: 'Rubrica',
}

/**
 * Retorna o body markdown do override ou null se não houver.
 * Usado pelos content readers públicos — nunca lança exceção.
 */
export async function getContentOverride(
  contentType: ContentType,
  slug: string,
): Promise<string | null> {
  try {
    const sb = createServiceClient()
    const { data } = await sb
      .from('content_edits')
      .select('body')
      .eq('content_type', contentType)
      .eq('slug', slug)
      .maybeSingle()
    return data?.body ?? null
  } catch {
    // Nunca quebrar as páginas públicas por falta de override
    return null
  }
}

export interface ContentEditRecord {
  content_type: ContentType
  slug: string
  updated_by: string
  updated_at: string
}
