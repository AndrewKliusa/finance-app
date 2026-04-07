import z from "zod";
import { UserSchema } from "./user.schema";

export const CategorySchema = z.object({
    id: z.uuid(),
    name: z.string().trim().max(32),
    color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/),
    budget: z.number().int().positive(),
    user: UserSchema
})