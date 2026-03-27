import { z } from 'zod'

export const UserSchema = z.object({
    name: z.string(),
    password: z.string().min(8)
})

export const UserResponseSchema = UserSchema.omit({ password: true })

export type UserType = z.infer<typeof UserSchema>