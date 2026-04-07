import z from "zod";
import { UserSchema } from "./user.schema";

export const CategorySchema = z.object({
    id: z.uuid(),
    name: z.string().trim().max(32),
    color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
    budget: z.number().int().positive(),
    userId: z.uuid()
})

export const CategoryCreateSchema = CategorySchema.pick({ name: true, color: true, budget: true })
export const CategoryResponseSchema = CategorySchema.omit({ userId: true })

export type CategorySchemaType = z.infer<typeof CategorySchema>