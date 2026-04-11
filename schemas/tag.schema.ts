import z from "zod";

export const TagSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().max(64),
    userId: z.uuid()
})

export const TagCreateSchema = TagSchema.pick({ name: true })
export type TagCreateSchemaType = z.infer<typeof TagCreateSchema>
export type TagSchemaType = z.infer<typeof TagSchema>