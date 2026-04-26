import { afterAll, beforeAll, describe, expect, it, beforeEach } from "vitest"
import { admin, emptyUUID, generateAdminToken, server } from "./helpers/helper.js"
import { closeNotificationsStream, connectNotificationsStream, readNotificationsStream } from "./helpers/notificationsHelper"
import { authFunctionsBuilder } from "./helpers/authHelper"
import { userFunctionsBuilder } from "./helpers/usersHelper"
import { transactionsFunctionsBuilder } from "./helpers/transactionsHelper"
import { prisma } from "../lib/prisma"
import { redis } from "../lib/redis/redis"
import { categoriesFunctionsBuilder } from "./helpers/categoriesHelper"

let streamReader: ReadableStreamDefaultReader

const { patch } = userFunctionsBuilder(server)
const { create: createTransaction } = transactionsFunctionsBuilder(server)
const { create: createCategory } = categoriesFunctionsBuilder(server)

describe("Notifications", () => {
    it("Sends a notification when budget is exceeded", async () => {
        await createTransaction({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: null })

        const notification = await readNotificationsStream(streamReader)

        expect(notification).toContain('BUDGET_EXCEEDED')
    })

    it("Sends two notifcations for two transactions that excceed the budget", async () => {
        await createTransaction({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: null })

        const notificationOne = await readNotificationsStream(streamReader)
        expect(notificationOne).toContain('BUDGET_EXCEEDED')

        await createTransaction({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: null })

        const notificationTwo = await readNotificationsStream(streamReader)
        expect(notificationTwo).toContain('BUDGET_EXCEEDED')
    })

    it("Sends a notification when category budget is exceeded", async () => {
        const categoryRes = await createCategory({ name: "Food", color: "#000000", budget: 100 })

        await createTransaction({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: categoryRes.json().id })

        const notificationOne = await readNotificationsStream(streamReader)
        expect(notificationOne).toContain('BUDGET_EXCEEDED')
    })

    it("Doesn't send a notification when budget is no longer exceeded", async () => {
        const categoryRes = await createCategory({ name: "Food", color: "#000000", budget: 100 })

        await createTransaction({ type: "OUTCOME", amount: 101, tagsId: [], description: null, categoryId: categoryRes.json().id })

        const notificationOne = await readNotificationsStream(streamReader)
        expect(notificationOne).toContain('BUDGET_EXCEEDED')

        await createTransaction({ type: "INCOME", amount: 101, tagsId: [], description: null, categoryId: categoryRes.json().id })
        await createTransaction({ type: "OUTCOME", amount: 50, tagsId: [], description: null, categoryId: categoryRes.json().id })
        
        await expect(readNotificationsStream(streamReader)).rejects.toThrow("Timed out!")
    })

    it("Tries to start a notifications stream with a wrong token", async () => {
        await expect(connectNotificationsStream("a".repeat(64))).rejects.toThrow("401")
    })
})

beforeAll(async () => {
    await generateAdminToken()
    await server.listen({ port: 3000 })
    await patch(admin.id, { globalLimit: 100 })
})

afterAll(async () => {
    await closeNotificationsStream(streamReader)
    server.close()
})

beforeEach(async () => {
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await prisma.transaction.deleteMany()
    await prisma.category.deleteMany()
    await redis.flushdb()
    streamReader = await connectNotificationsStream()
})