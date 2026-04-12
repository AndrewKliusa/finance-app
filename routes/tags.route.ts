import z from "zod";
import { prisma } from "../lib/prisma";
import { TagCreateSchema, TagResponseSchema } from "../schemas/tag.schema";
import { ZodServer } from "../types/ZodServer";
import { authenticate } from "../plugins/authenticate";
import { checkUser } from "../plugins/checkUser";
import { cacheTag, editTagInCache, getCachedTagsForUser, removeTagFromCache } from "../lib/redis/tagsCache";
import { checkTagAccess } from "../services/tags.service";

export async function tagRoutes(server: ZodServer) {
    server.post("/tags", {
        schema: {
            tags: ["Tags"],
            body: TagCreateSchema,
            response: {
                201: TagResponseSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { name } = request.body

        const tag = await prisma.tag.create({
            data: { name, userId: request.user.id },
        })

        await cacheTag(tag)

        const { userId, ...response } = tag
        return await reply.code(201).send(response)
    })

    server.patch("/tags/:id", {
        schema: {
            tags: ["Tags"],
            params: z.object({ id: z.string() }),
            body: TagCreateSchema,
            response: {
                200: z.void(),
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const tag = await checkTagAccess(reply, request.user.id, id)
        if (!tag) return;

        const updatedTag = await prisma.tag.update({
            where: { id },
            data: request.body
        })

        await editTagInCache(updatedTag)
        return await reply.code(200).send()
    })

    server.get("/tags/:id", {
        schema: {
            tags: ["Tags"],
            params: z.object({ id: z.string() }),
            response: {
                200: TagResponseSchema,
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const tag = await checkTagAccess(reply, request.user.id, id)
        if (!tag) return;

        const { userId, ...response } = tag
        return reply.status(200).send(response)
    })

    server.get("/tags/user/:id", {
        schema: {
            tags: ["Tags"],
            params: z.object({ id: z.string() }),
            response: {
                200: z.array(TagResponseSchema)
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const cachedTags = await getCachedTagsForUser(id);

        if (cachedTags.length > 0) {
            return reply.status(200).send(cachedTags)
        }

        const tags = await prisma.tag.findMany({
            where: { userId: id }
        })

        await Promise.all(tags.map(cacheTag))

        return reply.status(200).send(tags)
    })

    server.delete("/tags/:id", {
        schema: {
            tags: ["Tags"],
            params: z.object({ id: z.string() }),
            response: {
                204: z.void(),
                403: z.object({ message: z.string() }),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const tag = await checkTagAccess(reply, request.user.id, id)
        if (!tag) return;

        await prisma.tag.delete({
            where: { id }
        })

        await removeTagFromCache(tag)

        return reply.status(204).send()
    })
}