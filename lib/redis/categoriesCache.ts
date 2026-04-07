import { CategorySchemaType } from "../../schemas/category.schema";
import { redis } from "./redis";

async function writeCategoryHash(category: CategorySchemaType) {
    await redis.hset(`category:${category.id}`, {
        id: category.id,
        name: category.name,
        color: category.color,
        budget: category.budget,
        userId: category.userId
    })
}

export async function cacheCategory(category: CategorySchemaType) {
    await writeCategoryHash(category)
    await redis.sadd(`user:${category.userId}:categories`, category.id)
}

export async function getCachedCategory(categoryId: string) {
    return await redis.hgetall(`category:${categoryId}`)
}

export async function getCachedCategoriesForUser(userId: string) {
    const userCategoriesIds = await redis.smembers(`user:${userId}:categories`)

    if (userCategoriesIds.length === 0) return [];

    const categories = await Promise.all(userCategoriesIds.map(getCachedCategory));

    return categories.filter(category => Object.keys(category).length > 0);
}

export async function editCategoryInCache(category: CategorySchemaType) {
    await redis.del(`category:${category.id}`)
    await writeCategoryHash(category)
}