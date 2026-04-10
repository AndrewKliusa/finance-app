import { prisma } from "../lib/prisma"
import { cacheCategory, getCachedCategory } from "../lib/redis/categoriesCache"

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