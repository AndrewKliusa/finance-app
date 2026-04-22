import { FastifyRequest, FastifyReply } from "fastify";
import { NotificationsQuerySchemaType } from '../schemas/notifications';
import { verifyNotificationsToken } from "../services/auth.service";

export async function checkNotificationsToken(request: FastifyRequest<{ Querystring: NotificationsQuerySchemaType }>, reply: FastifyReply) {
    const { token } = request.query

    try {
        const payload = await verifyNotificationsToken(token)
        request.user = { id: payload.sub as string }
    } catch (error) {
        return await reply.status(401).send({ message: "Notifications stream token you provided is incorrect!" })
    }
}