const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin workspace root so Next ignores any stray lockfiles in parent dirs
  outputFileTracingRoot: path.join(__dirname),
  // Build during M0-M5 tolerates lint issues in files scheduled for deletion/rewrite.
  // Re-enable in M9 (resume polish) once refactors land.
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'polymarket.com' },
      { protocol: 'https', hostname: '**.polymarket.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

module.exports = nextConfig
