import z from "zod";

export const CategorySchema = z.object({
    id: z.uuid(),
    name: z.string().trim().max(32),
    color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
    budget: z.number().int().positive(),
    userId: z.uuid()
})

export const CategoryCreateSchema = CategorySchema.pick({ name: true, color: true, budget: true })
export const CategoryResponseSchema = CategorySchema.omit({ userId: true })

export const CategoryFromRedisSchema = CategorySchema.extend({
    budget: z.coerce.number(),
});

export type CategorySchemaType = z.infer<typeof CategorySchema>
export type CategoryCreateSchemaType = z.infer<typeof CategoryCreateSchema>