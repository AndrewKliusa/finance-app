import { z } from 'zod'
import { UserResponseSchema } from './user.schema'

export const AuthResponseSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: UserResponseSchema
})

export const AuthRefreshResponseSchema = AuthResponseSchema.omit({ user: true })
export const RefreshSchema = AuthRefreshResponseSchema.pick({ refreshToken: true })

export type AuthReponseSchemaType = z.infer<typeof AuthResponseSchema>
export type AuthRefreshResponseType = z.infer<typeof AuthRefreshResponseSchema>
export type RefreshType = z.infer<typeof RefreshSchema>