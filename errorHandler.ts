import { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientUnknownRequestError } from './generated/prisma/internal/prismaNamespace';

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof PrismaClientKnownRequestError) {
        const conflictingField = error.meta?.target
        if (error.code === "P2002") {
           return reply.code(409).send({ message: `Object with this ${conflictingField} field already exists!`});
        }    
    }

    if (error instanceof PrismaClientInitializationError) {
        return reply.code(503).send({ message: "Failed to connect to database!"})
    }

    return reply.code(500).send({ message: "Internal server error" })
}
