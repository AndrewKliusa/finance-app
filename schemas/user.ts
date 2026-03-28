import { z } from 'zod'

export const UserSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(3).max(255),
    password: z.string().trim().min(8).max(255),
    createdAt: z.date()
})

export const GetUsersQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
})

export const UserCreateSchema = UserSchema.pick({ name: true, password: true })
export const UserResponseSchema = UserSchema.omit({ password: true })
export const UserEditSchema = UserSchema.pick({ name: true })

export type UserType = z.infer<typeof UserSchema>
export type UserResponseType = z.infer<typeof UserResponseSchema>
export type UserCreateType = z.infer<typeof UserCreateSchema>
export type UserEditType = z.infer<typeof UserEditSchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>