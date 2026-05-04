import { z } from 'zod'

export const enviromentSchema = z.object({
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),

    JWT_ACCESS_SECRET: z.string().min(64),
    JWT_REFRESH_SECRET: z.string().min(64),
    JWT_NOTIFICATIONS_SECRET: z.string().min(64),

    ADMIN_PASSWORD: z.string(),

    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default("0.0.0.0"),
    
    // AI written line below. Used it to help me with CORS setup
    CORS_ORIGIN: z.string().default("*").transform(v => v === "*" ? "*" : v.split(",").map(o => o.trim()))
})