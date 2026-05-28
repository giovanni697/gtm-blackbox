/**
 * Rate limiter para rotas da API GTM BlackBox.
 *
 * Usa Upstash Redis (sliding window). Se as env vars não estiverem configuradas,
 * passa tudo sem limitar (fail-open) — sem quebrar o deploy atual.
 *
 * Para ativar:
 *   1. Crie um Redis gratuito em https://upstash.com
 *   2. Adicione em Vercel: UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN
 *
 * Limites:
 *   - "api"  → 60 req/min por API key (endpoints /api/v1/* e /api/mcp)
 *   - "auth" → 10 req/min por IP (futuro: login/signup)
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type LimiterId = 'api' | 'auth'

const limiters: Partial<Record<LimiterId, Ratelimit>> = {}

function getLimiter(id: LimiterId): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null // fail-open: sem Redis configurado

  if (!limiters[id]) {
    const redis = new Redis({ url, token })

    limiters[id] =
      id === 'api'
        ? new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 req/min por chave
            prefix: 'rl:api',
            analytics: false,
          })
        : new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min por IP
            prefix: 'rl:auth',
            analytics: false,
          })
  }

  return limiters[id]!
}

export interface RateLimitResult {
  allowed: boolean
  /** Cabeçalhos para incluir na resposta */
  headers: Record<string, string>
}

/**
 * Checa se o identificador está dentro do limite.
 * @param id       Qual limiter usar ('api' | 'auth')
 * @param key      Identificador único (API key hash, IP, etc.)
 */
export async function checkRateLimit(id: LimiterId, key: string): Promise<RateLimitResult> {
  const limiter = getLimiter(id)
  if (!limiter) return { allowed: true, headers: {} } // sem Redis = pass-through

  const { success, limit, remaining, reset } = await limiter.limit(key)

  return {
    allowed: success,
    headers: {
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(reset),
    },
  }
}
