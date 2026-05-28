import { createServiceClient } from '@/lib/supabase/service'
import { createHash, timingSafeEqual } from 'crypto'
import { checkRateLimit } from './rate-limit'

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

/** Compara dois hashes SHA-256 em tempo constante para evitar timing attacks. */
function safeCompareHash(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/** Resultado discriminado para distinguir 401 (chave inválida) de 429 (rate limit) */
export type ApiKeyResult =
  | { status: 'ok'; userId: string; headers: Record<string, string> }
  | { status: 'rate_limited'; headers: Record<string, string> }
  | { status: 'unauthorized' }

export async function validateApiKey(key: string): Promise<ApiKeyResult> {
  if (!key || !key.startsWith('gtmb_')) return { status: 'unauthorized' }

  const incomingHash = hashApiKey(key)
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('api_keys')
    .select('user_id, key_hash, revoked_at')
    .eq('key_hash', incomingHash)
    .single()

  if (!data || data.revoked_at) return { status: 'unauthorized' }

  // Comparação em tempo constante (defesa contra timing attack via DB)
  if (!safeCompareHash(incomingHash, data.key_hash as string)) return { status: 'unauthorized' }

  // Rate limit por API key (60 req/min — fail-open se Upstash não estiver configurado)
  const rl = await checkRateLimit('api', incomingHash)
  if (!rl.allowed) return { status: 'rate_limited', headers: rl.headers }

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', incomingHash)
    .then(() => {})

  return { status: 'ok', userId: data.user_id as string, headers: rl.headers }
}
