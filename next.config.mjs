/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Impede que o site seja embarcado em iframes de outros domínios (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Impede sniffing de MIME type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Força HTTPS por 1 ano (incluindo subdomínios)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Não vaza URL completa como Referer ao navegar para outros domínios
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desativa features de browser não usadas
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // CSP: permite apenas origens conhecidas
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts (nonce não configurado — usar unsafe-inline temporariamente)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Estilos inline do Tailwind + fontes Google
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fontes Google
      "font-src 'self' https://fonts.gstatic.com",
      // Imagens: self + data URIs (inline SVG)
      "img-src 'self' data: blob:",
      // Conexões: self + Supabase
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co"} https://api.resend.com`,
      // Sem frames externos
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  experimental: {
    typedRoutes: false,
  },
  // Garante que content/ é incluído no bundle de TODAS as serverless functions no Vercel
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },
  async headers() {
    return [
      {
        // Aplica em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
