import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";

export async function adminOnly(request: FastifyRequest, reply: FastifyReply) {
    const isAdmin = await prisma.user.findFirst({
        where: { id: request.user.id, role: "ADMIN" }
    })

    if (!isAdmin) {
        return await reply.code(403).send({ message: "You need admin persmissions for this operation!" })
    }
}