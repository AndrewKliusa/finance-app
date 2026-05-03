import { z } from 'zod'
import { UserResponseSchema } from './user.schema'

export const AuthResponseSchema = z.object({
    accessToken: z.string().min(64),
    refreshToken: z.string().min(64),
    notificationsToken: z.string().min(64),
    user: UserResponseSchema
})

export const AccessAndRefreshTokenSchema = AuthResponseSchema.omit({ user: true })
export const RefreshTokenSchema = AccessAndRefreshTokenSchema.pick({ refreshToken: true })

export type AuthReponseSchemaType = z.infer<typeof AuthResponseSchema>
export type AccessAndRefreshTokenType = z.infer<typeof AccessAndRefreshTokenSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>