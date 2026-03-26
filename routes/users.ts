import { z } from 'zod'
import { UserSchema } from '../schemas/user'
import { ZodServer } from "../types/ZodServer"

const users: { name: string, password: string }[] = []

export async function userRoutes(server: ZodServer) {
    server.post('/users', {
        schema: {
            tags: ['Users'],
            body: UserSchema,
            response: {
                201: UserSchema
            }
        }
    }, async (request, reply) => {
        const { name, password } = request.body

        const newUser = { name: name, password: password }
        users.push(newUser)

        reply.code(201).send(newUser)
    })

    server.get('/users', {
        schema: {
            tags: ['Users'],
            response: {
                200: z.array(UserSchema)
            }
        }
    }, async (request, reply) => {
        return users
    })
}