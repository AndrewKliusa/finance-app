import z from "zod";
import { prisma } from "../lib/prisma";
import { AccessAndRefreshTokenSchema, AuthResponseSchema, RefreshTokenSchema } from "../schemas/auth.schema";
import { NameAndPasswordSchema, UserResponseSchema } from "../schemas/user.schema";
import { generateTokenPair, revokeRefreshToken, rotateRefreshToken } from "../services/auth.service";
import { ZodServer } from "../types/ZodServer";
import argon2 from 'argon2'
import { adminOnly } from "../plugins/adminOnly";
import { authenticate } from "../plugins/authenticate";
import { revokeUserTokens } from "../handlers/users";

export async function authRoutes(server: ZodServer) {
    server.post("/auth/register", {
        schema: {
            tags: ["Auth"],
            body: NameAndPasswordSchema,
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
            body: NameAndPasswordSchema,
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
            body: RefreshTokenSchema,
            response: {
                200: AccessAndRefreshTokenSchema,
                401: z.object({ message: z.string()}),
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
            body: RefreshTokenSchema,
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

    server.post("/auth/promote-admin/:id", {
        schema: {
            tags: ["Auth"],
            params: z.object({ id: z.uuid() }),
            response: {
                200: UserResponseSchema
            }
        },
        preHandler: [authenticate, adminOnly]
    }, async (request, reply) => {   
        const { id } =  request.params
        
        const admin = await prisma.user.update({
            where: { id },
            data: { role: "ADMIN" },
            omit: { password: true }
        })
        
        await revokeUserTokens(id)
        return reply.code(200).send(admin)
    })
}