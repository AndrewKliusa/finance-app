import z from "zod";
import { UserSchema } from "./user.schema";
import { CategorySchema } from "./category.schema";

export const TranscationSchema = z.object({
    id: z.uuid(),
    amount: z.number().int().positive(),
    userId: z.uuid(),
    categoryId: z.uuid(),
    type: z.enum(["INCOME", "OUTCOME"]),
    description: z.string().trim().max(255)
})