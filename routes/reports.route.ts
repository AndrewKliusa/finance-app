import { reportQueue } from "../lib/bullmq"
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis/redis"
import { authenticate } from "../preHandlers/authenticate"
import { reportQuerySchema, ReportSchema } from "../schemas/report.schema"
import { ZodServer } from "../types/ZodServer"

export async function reportRoutes(server: ZodServer) {
    server.get("/report", {
        schema: {
            tags: ["Report"],
            querystring: reportQuerySchema,
            response: {
                200: ReportSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { year, month } = request.query

        const report = await prisma.report.findFirst({
            where: { year, month, userId: request.user.id}
        })

        if (report) {
            return await reply.status(200).send(report)
        }

        const jobId = `report:${request.user.id}:${year}:${month}`
        await reportQueue.add("report", { year, month, userId: request.user.id }, { jobId })
    })
}