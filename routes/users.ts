import { z } from "zod"
import { GetUsersQuerySchema, UserCreateSchema, UserEditSchema, UserResponseSchema, UserSchema } from "../schemas/user"
import { ZodServer } from "../types/ZodServer"
import { prisma } from "../database"
import argon2 from "argon2";
import { redis } from "../redis";

export async function userRoutes(server: ZodServer) {
    server.post("/users", {
        schema: {
            tags: ["Users"],
            body: UserCreateSchema,
            response: {
                201: UserResponseSchema
            }
        }
    }, async (request, reply) => {
        const { name, password } = request.body

        const hashedPassword = await argon2.hash(password)
        const user = await prisma.user.create({ 
            data: { name, password: hashedPassword },
            omit: { password: true }
        })

        return reply.code(201).send(user);
    })

    server.get("/users", {
        schema: {
            tags: ["Users"],
            querystring: GetUsersQuerySchema,
            response: {
                200: z.array(UserResponseSchema)
            }
        }
    }, async (request, reply) => {
        const { page, limit } = request.query
        const cacheKey = `users:page:${page}:limit:${limit}`

        const cachedPage = await redis.get(cacheKey)
        if (cachedPage) {
            return reply.code(200).send(JSON.parse(cachedPage))
        }

        const users = await prisma.user.findMany({
            take: limit,
            skip: (page - 1) * limit
        })

        await redis.set(cacheKey, JSON.stringify(users), "EX", 60)

        return reply.code(200).send(users)
    })

    server.get("/users/:id", {
        schema: {
            tags: ["Users"],
            params: z.object({ id: z.uuid() }),
            response: {
                200: UserResponseSchema,
                404: z.object({ message: z.string() })
            }
        }
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
        }
    }, async (request, reply) => {
        const { id } = request.params

        const user = await prisma.user.update({
            where: { id: id },
            omit: { password: true },
            data: request.body
        })

        await redis.set(`user:${id}`, JSON.stringify(user), "EX", 60)

        const keys = await redis.keys('users:page:*')
        if (keys.length) await redis.del(...keys)

        return reply.code(200).send(user)
    })

    server.delete("/users/:id",  {
        schema: {
            tags: ["Users"],
            params: z.object({ id: z.uuid() }),
            response: {
                200: UserResponseSchema,
                404: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        const { id } = request.params

        const user = await prisma.user.delete({
            where: { id: id },
            omit: { password: true },
        })

        await redis.del(`user:${id}`)

        const keys = await redis.keys('users:page:*')
        if (keys.length) await redis.del(...keys)

        return reply.code(200).send(user);
    })
}