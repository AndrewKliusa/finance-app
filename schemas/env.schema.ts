import { z } from 'zod'

export const enviromentSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),

    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),
    JWT_NOTIFICATIONS_SECRET: z.string().min(64),

    ADMIN_PASSWORD: z.string()
})