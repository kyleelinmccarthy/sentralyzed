import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .default('postgresql://sentral:devpassword123@localhost:5433/sentral_dev'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z.string().default('dev-session-secret-change-in-production'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:3001/auth/google/callback'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef'),
})

export const env = envSchema.parse(process.env)
