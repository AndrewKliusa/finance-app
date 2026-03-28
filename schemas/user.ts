import { z } from 'zod'

export const UserSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(3).max(255),
    password: z.string().trim().min(8).max(255),
    createdAt: z.date()
})

export const UserCreateSchema = UserSchema.pick({ name: true, password: true })
export const UserResponseSchema = UserSchema.omit({ password: true })

export type UserType = z.infer<typeof UserSchema>
export type UserResponseType = z.infer<typeof UserResponseSchema>
export type UserCreateType = z.infer<typeof UserCreateSchema>