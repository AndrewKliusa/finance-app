import z from "zod";
import { UserSchema } from "./user.schema";

export const TagSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().max(64),
    userId: z.uuid()
})