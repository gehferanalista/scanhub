import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.string().min(1).default('/api'),
  VITE_ENABLE_MOCKS: z.stringbool().default(false),
})

export const env = envSchema.parse(import.meta.env)
