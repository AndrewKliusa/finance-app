import { z } from 'zod'
import { UserResponseSchema } from './user.schema'

export const AuthResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: UserResponseSchema
})

export const AuthRefreshResponseSchema = AuthResponseSchema.omit({ user: true })

export const RefreshSchema = z.object({
    refreshToken: z.string()
})

export type AuthReponseSchemaType = z.infer<typeof AuthResponseSchema>