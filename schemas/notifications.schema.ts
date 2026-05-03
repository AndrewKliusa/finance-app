import z from "zod";

export const NotificationsQuerySchema = z.object({
    token: z.string().min(64)
})

export type NotificationsQuerySchemaType = z.infer<typeof NotificationsQuerySchema>