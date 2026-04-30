/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  experimental: {
    typedRoutes: false,
  },
  // Garante que content/ é incluído no bundle das serverless functions no Vercel
  outputFileTracingIncludes: {
    "/templates": ["./content/templates/**/*"],
    "/ebook": ["./content/ebook/**/*"],
    "/diagnostico": ["./content/diagnostico/**/*"],
  },
};

export default nextConfig;
