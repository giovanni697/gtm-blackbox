'use server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { generateApiKey } from '@/lib/api/auth'
import { revalidatePath } from 'next/cache'

export async function createApiKey(name: string): Promise<{ plain: string } | { error: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { plain, hash, prefix } = generateApiKey()
  const service = createServiceClient()
  const { error } = await service.from('api_keys').insert({
    user_id: user.id,
    name,
    key_hash: hash,
    key_prefix: prefix,
  })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { plain } // show once
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  const service = createServiceClient()
  await service
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', user.id)
  revalidatePath('/settings')
}
