import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { isAdmin } from "../services/users.service";

export async function adminOnly(request: FastifyRequest, reply: FastifyReply) {
    const hasAdminPerms = await isAdmin(request.user.id)

    if (!hasAdminPerms) {
        return await reply.code(403).send({ message: "You need admin persmissions for this operation!" })
    }
}