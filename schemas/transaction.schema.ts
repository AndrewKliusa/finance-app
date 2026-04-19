import z from "zod";
import { TagSchema } from "./tag.schema";
import { CategorySchema } from "./category.schema";

export const TransactionSchema = z.object({
    id: z.uuid(),
    amount: z.number().int().positive(),
    userId: z.uuid(),
    category: CategorySchema.nullable(),
    tags: z.array(TagSchema),
    description: z.string().trim().max(255).nullable(),
    type: z.enum(["INCOME", "OUTCOME"])

})

export const TransactionCreateSchema = TransactionSchema.omit({ id: true, userId: true, tags: true, category: true }).extend({
    tagsId: z.array(z.uuid()).default([]),
    categoryId: z.uuid().nullable()
})

export const TransactionUpdateSchema = TransactionCreateSchema.omit({ type: true }).partial()

export type TransactionSchemaType = z.infer<typeof TransactionSchema>
export type TransactionCreateSchemaType = z.infer<typeof TransactionCreateSchema>