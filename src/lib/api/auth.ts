import { createServiceClient } from '@/lib/supabase/service'
import { createHash } from 'crypto'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): { plain: string; hash: string; prefix: string } {
  // Use crypto.getRandomValues (Edge-compatible) for 32 random bytes
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const plain = `gtmb_${hex}`
  const hash = hashApiKey(plain)
  const prefix = plain.slice(0, 12) // "gtmb_" + first 7 chars
  return { plain, hash, prefix }
}

export async function validateApiKey(key: string): Promise<{ userId: string } | null> {
  if (!key || !key.startsWith('gtmb_')) return null
  const hash = hashApiKey(key)
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('api_keys')
    .select('user_id, revoked_at')
    .eq('key_hash', hash)
    .single()
  if (!data || data.revoked_at) return null
  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash)
    .then(() => {})
  return { userId: data.user_id }
}
