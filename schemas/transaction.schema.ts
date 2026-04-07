import z from "zod";
import { UserSchema } from "./user.schema";
import { CategorySchema } from "./category.schema";

export const TranscationSchema = z.object({
    id: z.uuid(),
    amount: z.number().int().positive(),
    user: UserSchema,
    category: CategorySchema,
    type: z.enum(["INCOME", "OUTCOME"]),
    description: z.string().trim().max(255)
})