const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin workspace root so Next ignores any stray lockfiles in parent dirs
  outputFileTracingRoot: path.join(__dirname),
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
