import { FastifyReply } from "fastify"
import { prisma } from "../lib/prisma"
import { isAdmin } from "./users.service"
import { getCachedTag, cacheTag } from "../lib/redis/tagsCache"

export async function getTag(tagId: string) {
    const cachedTag = await getCachedTag(tagId)

    if (cachedTag) {
        return cachedTag
    }

    const tag = await prisma.tag.findUnique({
        where: { id: tagId }
    })
    if (tag) {
        await cacheTag(tag)
    }

    return tag
}

export async function checkTagAccess(reply: FastifyReply, userId: string, tagId: string) {
    const tag = await getTag(tagId);

    if (!tag) {
        await reply.status(404).send({ message: "Tag with this ID does not exist!" });
        return null;
    }

    if (tag.userId !== userId) {
        const admin = await isAdmin(userId);
        if (!admin) {
            await reply.status(403).send({ message: "You don't have permissions for this tag!" });
            return null;
        }
    }

    return tag;
}