import { z } from "zod"
import { GetUsersQuerySchema, NameAndPasswordSchema, PasswordChangeSchema, UserEditSchema, UserQueryResponseSchema, UserResponseSchema, UserSchema } from "../schemas/user.schema"
import { ZodServer } from "../types/ZodServer"
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis/redis";
import { authenticate } from "../plugins/authenticate";
import { checkUser } from "../plugins/checkUser";
import { adminOnly } from "../plugins/adminOnly";
import argon2 from "argon2"
import { invalidateUserPages, revokeUserTokens } from "../handlers/users";

export async function userRoutes(server: ZodServer) {
    server.get("/users", {
        schema: {
            tags: ["Users"],
            querystring: GetUsersQuerySchema,
            response: {
                200: UserQueryResponseSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { page, limit } = request.query
        const cacheKey = `users:page:${page}:limit:${limit}`

        const cachedPage = await redis.get(cacheKey)
        if (cachedPage) {
            return reply.code(200).send(JSON.parse(cachedPage))
        }

        const users = await prisma.user.findMany({
            take: limit,
            skip: (page - 1) * limit,
            omit: { password: true }
        })

        await redis.set(cacheKey, JSON.stringify(users), "EX", 60)

        return reply.code(200).send({ data: users, total: users.length, page, limit })
    })

    server.get("/users/:id", {
        schema: {
            tags: ["Users"],
            params: z.object({ id: z.uuid() }),
            response: {
                200: UserResponseSchema,
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params
        const cacheKey = `user:${id}`

        const cachedUser = await redis.get(cacheKey)
        if (cachedUser) {
            return reply.code(200).send(JSON.parse(cachedUser))
        }

        const user = await prisma.user.findUnique({
            where: { id: id },
            omit: { password: true }
        })
        if (!user) {
            return reply.code(404).send({ message: "User with this ID does not exist!" })
        }

        await redis.set(cacheKey, JSON.stringify(user), "EX", 60)
        return reply.code(200).send(user)
    })

    server.patch("/users/:id", {
        schema: {
            tags: ["Users"],
            body: UserEditSchema,
            params: z.object({ id: z.uuid() }),
            response: {
                200: UserResponseSchema,
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const user = await prisma.user.update({
            where: { id: id },
            omit: { password: true },
            data: request.body
        })

        await redis.set(`user:${id}`, JSON.stringify(user), "EX", 60)
        await invalidateUserPages()

        return reply.code(200).send(user)
    })

    server.patch("/users/:id/password", {
        schema: {
            tags: ["Users"],
            params: z.object({ id: z.uuid() }),
            body: PasswordChangeSchema,
            response: {
                204: z.void(),
                404: z.object({ message: z.string() }),
                400: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { oldPassword, newPassword } = request.body
        const { id } = request.params

        const user = await prisma.user.findUnique({
            where: { id }
        })
        if (!user) {
            return reply.code(404).send({ message: "User with this ID does not exist!" })
        }

        const isPasswordCorrect = await argon2.verify(user.password, oldPassword)
        if (!isPasswordCorrect) {
            return reply.code(400).send({ message: "Provided password is incorrect!" })
        }

        const passwordHash = await argon2.hash(newPassword)
        const updatedUser = await prisma.user.update({
            where: { id },
            omit: { password: true },
            data: { password: passwordHash }
        })

        await redis.set(`user:${id}`, JSON.stringify(updatedUser), "EX", 60)
        await invalidateUserPages()

        return reply.code(204).send()
    })

    server.delete("/users/:id",  {
        schema: {
            tags: ["Users"],
            params: z.object({ id: z.uuid() }),
            response: {
                204: z.void(),
                404: z.object({ message: z.string() })
            }
        },
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {
        const { id } = request.params

        await revokeUserTokens(id)
        await prisma.user.delete({
            where: { id: id },
            omit: { password: true },
        })

        await redis.del(`user:${id}`)

        return reply.code(204).send();
    })
}