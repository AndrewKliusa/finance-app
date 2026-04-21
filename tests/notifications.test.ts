import { afterAll, beforeAll, describe, expect, it, beforeEach } from "vitest"
import { admin, generateAdminToken, server } from "./helpers/helper"
import { closeNotificationsStream, connectNotificationsStream, readNotificationsStream } from "./helpers/notificationsHelper"
import { authFunctionsBuilder } from "./helpers/authHelper"
import { userFunctionsBuilder } from "./helpers/usersHelper"
import { transactionsFunctionsBuilder } from "./helpers/transactionsHelper"
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis/redis"

let streamReader: ReadableStreamDefaultReader

const { patch } = userFunctionsBuilder(server)
const { create } = transactionsFunctionsBuilder(server)

describe("Notifications", () => {
    it("Sends a notification when budget is exceeded", async () => {
        await patch(admin.id, { globalLimit: 100 })

        await create({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: null })

        const notification = await readNotificationsStream(streamReader)

        expect(notification).toContain('BUDGET_EXCEEDED')
    })
})

beforeAll(async () => {
    await generateAdminToken()
    await server.listen({ port: 3000 })

    streamReader = await connectNotificationsStream()
})

afterAll(async () => {
    await closeNotificationsStream(streamReader)
    server.close()
})

beforeEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await redis.flushdb()
})