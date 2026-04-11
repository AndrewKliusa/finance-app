import { CategoryFromRedisSchema, CategorySchemaType } from "../../schemas/category.schema";
import { redis } from "./redis";

export async function cacheCategory(category: CategorySchemaType) {
    await writeCategoryHash(category)
    await redis.sadd(`user:${category.userId}:categories`, category.id)
}

export async function getCachedCategory(categoryId: string) {
    const categoryObject = await redis.hgetall(`category:${categoryId}`)
    if (Object.keys(categoryObject).length === 0) return null
    return CategoryFromRedisSchema.parse(categoryObject)
}

export async function getCachedCategoriesForUser(userId: string) {
    const userCategoriesIds = await redis.smembers(`user:${userId}:categories`)

    if (userCategoriesIds.length === 0) return [];

    const categories = await Promise.all(userCategoriesIds.map(getCachedCategory));

    return categories.filter(category => category !== null);
}

export async function editCategoryInCache(category: CategorySchemaType) {
    await redis.del(`category:${category.id}`)
    await writeCategoryHash(category)
}

async function writeCategoryHash(category: CategorySchemaType) {
    await redis.hset(`category:${category.id}`, {
        id: category.id,
        name: category.name,
        color: category.color,
        budget: category.budget,
        userId: category.userId
    })
}

export async function removeCategoryFromCache(category: CategorySchemaType) {
    await redis.del(`category:${category.id}`)
    await redis.srem(`users:${category.userId}:categories`, category.id)
}