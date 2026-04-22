import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace from monorepo root so workspace deps (@sentral/shared, @sentral/api) are bundled.
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  transpilePackages: ['@sentral/shared'],
  serverExternalPackages: ['argon2', '@sentral/api'],
  // Type-checking and linting run separately via turbo (`type-check` / `lint`).
  // Skipping them here avoids duplicate work and reduces build memory usage.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  turbopack: {
    root: path.join(__dirname, '..', '..'),
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  webpack: (config) => {
    // Resolve .js imports to .ts files for ESM TypeScript workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
    }
    return config
  },
}

export default nextConfig
