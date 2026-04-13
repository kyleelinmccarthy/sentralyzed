import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Prefer unpooled URL for migrations (direct connection, avoids pooler limits)
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!,
  },
})
