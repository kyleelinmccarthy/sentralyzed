import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@sentral/shared', '@sentral/api'],
  serverExternalPackages: ['argon2'],
  webpack: (config) => {
    // Resolve .js imports to .ts files for ESM TypeScript workspace packages
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
    }
    return config
  },
}

export default nextConfig
