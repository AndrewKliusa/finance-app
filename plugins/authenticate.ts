import { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../services/auth.service";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
        return reply.code(401).send({ message: "No authorization header provided!" })
    }

    const token = authHeader.split(" ")[1]!

    try {
        const payload = await verifyAccessToken(token)
        request.user = { id: payload.sub as string }
    } catch {
        return reply.code(401).send({ message: "Invalid access token provided!"})
    }
}