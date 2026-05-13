import { NotificationsQuerySchema } from "../schemas/notifications.schema"
import { ZodServer } from "../types/ZodServer"
import { checkNotificationsToken } from "../preHandlers/checkNotificationsToken"
import { redis } from "../lib/redis/redis"

export async function notificationsRoutes(server: ZodServer) {
    server.get("/notifications/stream", {
        schema: {
            tags: ["Notifications"],
            querystring: NotificationsQuerySchema
        },
        preHandler: [checkNotificationsToken]
    }, async (request, reply) => {
        reply.hijack()
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        })
        reply.raw.flushHeaders()
        reply.raw.write(': connected\n\n')

        const sub = redis.duplicate()

        await sub.subscribe(`notifications:${request.user.id}`)
        sub.on("message", (_, message) => {
            reply.raw.write(`data: ${message}\n\n`)
        })

        request.raw.on("close", () => {
            sub.unsubscribe()
            sub.quit()
        })
    })
}