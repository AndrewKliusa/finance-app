import { z } from 'zod'

export const UserSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(3).max(255),
    password: z.string().trim().min(8).max(255),
    createdAt: z.date(),
    role: z.enum(["USER", "ADMIN"]),
    globalLimit: z.number().int().nullable()
})

export const GetUsersQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
})

export const PasswordChangeSchema = z.object({
    oldPassword: z.string().trim(),
    newPassword: z.string().trim().min(8).max(255),
})


export const NameAndPasswordSchema = UserSchema.pick({ name: true, password: true })
export const UserResponseSchema = UserSchema.omit({ password: true })
export const UserEditSchema = UserSchema.pick({ name: true, globalLimit: true }).extend({ 
    name: z.string().trim().min(3).max(255).optional(),
    globalLimit: z.number().int().optional()
})

export const UserQueryResponseSchema = z.object({
    data: z.array(UserResponseSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number()
})

export type UserType = z.infer<typeof UserSchema>
export type UserResponseType = z.infer<typeof UserResponseSchema>
export type NameAndPasswordType = z.infer<typeof NameAndPasswordSchema>
export type UserEditType = z.infer<typeof UserEditSchema>
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>
export type PasswordChangeType = z.infer<typeof PasswordChangeSchema>