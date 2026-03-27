import { z } from 'zod'
import { UserResponseSchema, UserSchema } from '../schemas/user'
import { ZodServer } from "../types/ZodServer"
import { prisma } from '../database'
import argon2 from 'argon2';

export async function userRoutes(server: ZodServer) {
    server.post('/users', {
        schema: {
            tags: ['Users'],
            body: UserSchema,
            response: {
                201: z.object({ message: z.string(), username: z.string()})
            }
        }
    }, async (request, reply) => {
        const { name, password } = request.body

        const hashedPassword = await argon2.hash(password)
        await prisma.user.create({ data: { name, password: hashedPassword } })

        reply.code(201).send({
            message: "User has been successfully created!",
            username: name
        });
    })

    server.get('/users', {
        schema: {
            tags: ['Users'],
            response: {
                200: z.array(UserResponseSchema)
            }
        }
    }, async (_request, reply) => {
        reply.code(200).send(await prisma.user.findMany(
            { omit: { password: true }}
        ))
    })

    server.delete('/users/:id',  {
        schema: {
            tags: ['Users'],
            response: {
                200: UserResponseSchema,
                404: z.object({ message: z.string() })
            }
        }
    }, async (request, reply) => {
        const { id } = request.params as { id: string }

        const user = await prisma.user.findUnique({
            where: { id },
            omit: { password: true }
        })

        if (!user) {
            return reply.code(404).send({ message: "User with this ID does not exist!" })
        }

        reply.code(200).send(user);
    })
}