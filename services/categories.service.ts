import { FastifyReply } from "fastify"
import { prisma } from "../lib/prisma"
import { cacheCategory, getCachedCategory } from "../lib/redis/categoriesCache"
import { isAdmin } from "./users.service"

export async function getCategory(categoryId: string) {
    const cachedCategory = await getCachedCategory(categoryId)

    if (cachedCategory) {
        return cachedCategory
    }

    const category = await prisma.category.findUnique({
        where: { id: categoryId }
    })
    if (category) {
        await cacheCategory(category)
    }

    return category
}

export async function checkCategoryAccess(reply: FastifyReply, userId: string, categoryId: string) {
    const category = await getCategory(categoryId);

    if (!category) {
        await reply.status(404).send({ message: "Category with this ID does not exist!" });
        return null;
    }

    if (category.userId !== userId) {
        const admin = await isAdmin(userId);
        if (!admin) {
            await reply.status(403).send({ message: "You don't have permissions for this category!" });
            return null;
        }
    }

    return category;
}