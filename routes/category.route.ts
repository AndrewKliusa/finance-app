import z from "zod";
import { prisma } from "../lib/prisma";
import { cacheCategory, editCategoryInCache, getCachedCategoriesForUser, getCachedCategory } from "../lib/redis/categoriesCache";
import { CategoryCreateSchema, CategoryResponseSchema } from "../schemas/category.schema";
import { ZodServer } from "../types/ZodServer";
import { authenticate } from "../plugins/authenticate";
import { checkUser } from "../plugins/checkUser";
import { getCategory } from "../utils/categories";
import { isAdmin } from "../utils/users";

export async function authRoutes(server: ZodServer) {
    server.post("/categories", {
        schema: {
            tags: ["Categories"],
            body: CategoryCreateSchema,
            response: {
                201: CategoryResponseSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { name, color, budget } = request.body

        const category = await prisma.category.create({
            data: { name, color, budget, userId: request.user.id },
        })

        await cacheCategory(category)

        const { userId, ...response } = category
        return await reply.code(201).send(response)
    })

    server.patch("/categories/:id", {
        schema: {
            tags: ["Categories"],
            params: z.object({ id: z.string() }),
            body: CategoryCreateSchema,
            response: {
                200: z.void(),
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const category = await getCategory(id)
        if (!category) {
            return await reply.status(404).send({ message: "Category with this ID does not exist!" })
        } else if (category.userId !== id) {
            const hasAdminPerms = await isAdmin(request.user.id)
            if (!hasAdminPerms) {
                return await reply.status(403).send({ message: "You don't have permissions to edit this category!" })
            }
        }

        const updatedCategory = await prisma.category.update({
            where: { id },
            data: request.body
        })

        await editCategoryInCache(updatedCategory)
        return await reply.code(200).send()
    })

    server.get("/categories/:id", {
        schema: {
            tags: ["Categories"],
            params: z.object({ id: z.string() }),
            response: {
                201: CategoryResponseSchema,
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const category = await getCategory(id)
        if (!category) {
            return await reply.status(404).send({ message: "Category with this ID does not exist!" })
        } else if (category.userId !== id) {
            const hasAdminPerms = await isAdmin(request.user.id)
            if (!hasAdminPerms) {
                return await reply.status(403).send({ message: "You don't have permissions to edit this category!" })
            }
        }

        const { userId, ...response } = category
        return reply.status(201).send(response)
    })

    server.get("/categories/user/:id", {
        schema: {
            tags: ["Categories"],
            params: z.object({ id: z.string() }),
            response: {
                200: z.array(CategoryResponseSchema)
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const cachedCategories = await getCachedCategoriesForUser(id);

        if (cachedCategories.length > 0) {
            return reply.status(200).send(cachedCategories)
        }

        const categories = await prisma.category.findMany({
            where: { userId: id }
        })

        await Promise.all(categories.map(cacheCategory))

        return reply.status(200).send(categories)
    })
}