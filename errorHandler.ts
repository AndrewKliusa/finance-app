import { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { Prisma } from './generated/prisma'
import { ZodError } from 'zod'

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const conflictingField = error.meta?.target ?? error.meta?.cause
        if (error.code === "P2002") {
            return reply.code(409).send({ message: `Object with this ${conflictingField} field already exists!`});
        } else if (error.code === "P2025") {
            return reply.code(404).send({   message: `Object with this ${conflictingField} field does not exist!`});

        }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return reply.code(503).send({ message: "Failed to connect to database!"})
    }

    if (error.statusCode === 400 && error.code === 'FST_ERR_VALIDATION') {
        return reply.code(400).send({
            message: 'Validation error',
            errors: error.validation
        })
    }

    console.error(error)
    return reply.code(500).send({ message: "Internal server error" })
}

export const emptyUUID = "00000000-0000-0000-0000-000000000000"