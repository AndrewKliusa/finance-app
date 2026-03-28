import { z } from 'zod'

export const enviromentSchema = z.object({
    DATABASE_URL: z.url()
})