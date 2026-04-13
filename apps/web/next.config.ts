import type { NextConfig } from 'next'
import path from 'node:path'

const nextConfig: NextConfig = {
  transpilePackages: ['@sentral/shared', '@sentral/api'],
  serverExternalPackages: ['argon2'],
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
