import { z } from 'zod'

export const enviromentSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),

    ADMIN_PASSWORD: z.string()
})