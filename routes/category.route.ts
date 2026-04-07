import { CategoryCreateSchema, CategoryResponseSchema } from "../schemas/category.schema";
import { ZodServer } from "../types/ZodServer";

export async function authRoutes(server: ZodServer) {
    server.post("/categories", {
        schema: {
            tags: ["Categories"],
            body: CategoryCreateSchema,
            response: {
                201: CategoryResponseSchema
            }
        }
    }, async (request, reply) => {
        
    })
}