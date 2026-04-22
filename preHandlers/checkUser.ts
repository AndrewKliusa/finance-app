import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { isAdmin } from "../services/users.service";

export async function checkUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params

    const hasAdminPerms = await isAdmin(request.user.id)
    
    if (request.user.id !== id && !hasAdminPerms) {
        return await reply.code(403).send({ message: "You don't have permissions to edit this user!" })
    }
}