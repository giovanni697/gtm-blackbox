/**
 * Lista canônica de domínios de e-mail PESSOAL bloqueados no signup.
 *
 * GTM BlackBox aceita apenas e-mails corporativos. Editar via PR.
 * Mantida ordenada alfabeticamente por categoria.
 */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  // Google
  'gmail.com',
  'googlemail.com',

  // Microsoft
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.com.br',
  'hotmail.es',
  'outlook.com',
  'outlook.com.br',
  'outlook.fr',
  'outlook.es',
  'live.com',
  'live.com.br',
  'live.fr',
  'msn.com',

  // Yahoo
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.fr',
  'yahoo.com.br',
  'yahoo.es',
  'ymail.com',
  'rocketmail.com',

  // Apple
  'icloud.com',
  'me.com',
  'mac.com',

  // AOL
  'aol.com',
  'aim.com',

  // Privacy-focused
  'protonmail.com',
  'proton.me',
  'pm.me',
  'tutanota.com',
  'tutanota.de',
  'tutamail.com',

  // German / EU
  'gmx.com',
  'gmx.de',
  'gmx.net',
  'gmx.at',
  'web.de',
  't-online.de',

  // Russian
  'yandex.com',
  'yandex.ru',
  'mail.ru',
  'inbox.ru',

  // Chinese
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'foxmail.com',

  // BR providers
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'ig.com.br',
  'r7.com',
  'oi.com.br',
  'globo.com',
  'globomail.com',

  // Outros
  'mail.com',
  'zoho.com',
  'fastmail.com',
  'fastmail.fm',
  'hey.com',
  'hushmail.com',
  'rediffmail.com',
  'naver.com',
  'daum.net',
])

/**
 * Retorna `true` se o e-mail usa um domínio pessoal/genérico.
 * Retorna `true` também para entradas malformadas (sem `@`).
 */
export function isPersonalEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split('@')[1]
  if (!domain) return true
  return PERSONAL_EMAIL_DOMAINS.has(domain)
}

/**
 * Retorna o domínio do e-mail (parte após `@`), em lowercase.
 * Retorna `null` se o e-mail não tiver `@` válido.
 */
export function getEmailDomain(email: string): string | null {
  const parts = email.toLowerCase().trim().split('@')
  if (parts.length !== 2) return null
  return parts[1] || null
}
