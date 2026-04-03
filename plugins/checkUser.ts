import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function checkUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    const isAdmin = await prisma.user.findFirst({
        where: { id: request.user.id, role: "ADMIN" }
    })

    if (request.user.id !== id && !isAdmin) {
        return await reply.code(401).send({ message: "You don't have permissions to edit this user!" })
    }
}