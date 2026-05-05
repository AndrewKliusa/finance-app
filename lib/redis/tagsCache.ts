import { TagSchemaType, TagSchema } from "../../schemas/tag.schema";
import { redis } from "./redis";

export async function cacheTag(tag: TagSchemaType) {
    await writeTagHash(tag)
    await redis.sadd(`user:${tag.userId}:tags`, tag.id)
}

export async function getCachedTag(tagId: string) {
    const tagObject = await redis.hgetall(`tag:${tagId}`)
    if (Object.keys(tagObject).length === 0) return null
    return TagSchema.parse(tagObject)
}

export async function getCachedTagsForUser(userId: string) {
    const userTagsIds = await redis.smembers(`user:${userId}:tags`)
    if (userTagsIds.length === 0) return [];

    const tags = await Promise.all(userTagsIds.map(getCachedTag));
    return tags.filter(tag => tag !== null);
}

export async function editTagInCache(tag: TagSchemaType) {
    await redis.del(`tag:${tag.id}`)
    await writeTagHash(tag)
}

async function writeTagHash(tag: TagSchemaType) {
    await redis.hset(`tag:${tag.id}`, {
        id: tag.id,
        name: tag.name,
        userId: tag.userId
    })
}

export async function removeTagFromCache(tag: TagSchemaType) {
    await redis.del(`tag:${tag.id}`)
    await redis.srem(`user:${tag.userId}:tags`, tag.id)
}