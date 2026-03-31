import z from "zod";
import { prisma } from "../lib/prisma";
import { AuthRefreshResponseSchema, AuthResponseSchema, RefreshSchema } from "../schemas/auth.schema";
import { UserCreateSchema, UserResponseSchema } from "../schemas/user.schema";
import { generateTokenPair, revokeRefreshToken, rotateRefreshToken } from "../services/auth.service";
import { ZodServer } from "../types/ZodServer";
import argon2 from 'argon2'

export async function authRoutes(server: ZodServer) {
    server.post("/auth/register", {
        schema: {
            tags: ["Auth"],
            body: UserCreateSchema,
            response: {
                201: AuthResponseSchema
            }
        }
    }, async (request, reply) => {
        const { name, password } = request.body
        const passwordHash = await argon2.hash(password)
    
        const user = await prisma.user.create({
            data: { name, password: passwordHash },
            omit: { password: true }
        })
    
        const tokens = await generateTokenPair(user.id)
        return reply.code(201).send({ ...tokens, user })
    })

    server.post("/auth/login", {
        schema: {
            tags: ["Auth"],
            body: UserCreateSchema,
            response: {
                200: AuthResponseSchema,
                401: z.object({ message: z.string()})
            }
        }
    }, async (request, reply) => {
        const { name, password } = request.body

        const user = await prisma.user.findUnique({
            where: { name }
        })

        if (!user) {
            return reply.code(401).send({ message: "Invalid login credentials!" })
        }

        const isPasswordCorrect = await argon2.verify(user.password, password)

        if (!isPasswordCorrect) {
            return reply.code(401).send({ message: "Invalid login credentials!" })
        }
        
        const tokens = await generateTokenPair(user.id);

        const { password: _, ...userWithoutPassword } = user;
        return reply.code(200).send({ ...tokens, user: userWithoutPassword });
    })

    server.post("/auth/refresh", {
        schema: {
            tags: ["Auth"],
            body: RefreshSchema,
            response: {
                200: AuthRefreshResponseSchema,
                401: z.object({ message: z.string()})
            }
        }
    }, async (request, reply) => {
        const { refreshToken } = request.body

        try {
            const tokens = await rotateRefreshToken(refreshToken)
            return reply.code(200).send(tokens);
        } catch {
            return reply.code(401).send({ message: "Invalid refresh token!" })
        }
    })

    server.post("/auth/logout", {
        schema: {
            tags: ["Auth"],
            body: RefreshSchema,
            response: {
                204: z.void(),
                401: z.object({ message: z.string()})
            }
        }
    }, async (request, reply) => {
        const { refreshToken } = request.body

        try {
            await revokeRefreshToken(refreshToken)
            return reply.code(204).send()
        } catch {
            return reply.code(401).send({ message: "Invalid refresh token!" })
        }
    })
}