import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../lib/prisma"
import { server, generateAdminToken } from "./helpers/helper"
import { reportsFunctionsBuilder } from "./helpers/reports.helper"

const { requestReport } = reportsFunctionsBuilder(server)

describe("Reports route", () => {
    it("Generates a report", async () => {
        const repRes = await requestReport("2026", (new Date().getMonth() + 1).toString())
        console.log(repRes.body)
        expect(repRes.statusCode).toBe(202)

        await new Promise(resolve => setTimeout(resolve, 3000))

        const repResTwo = await requestReport("2026", (new Date().getMonth() + 1).toString())
        expect(repResTwo.statusCode).toBe(200)

    })
})

beforeAll(async () => {
    await server.ready()
    await generateAdminToken()
    await prisma.user.deleteMany({
        where: { name: { not: 'admin' } }
    })
    await prisma.report.deleteMany()
    await prisma.category.deleteMany()
    const user = await prisma.user.findFirstOrThrow({
        where: { role: 'ADMIN' }
    })
    const category = await prisma.category.create({
        data: { name: "food", color: "#000000", budget: 200, user: { connect: user } }
    })

    await prisma.transaction.create({
        data: { amount: 100, type: "OUTCOME", user: { connect: user }, category: { connect: { id: category.id } }}
    })
    await prisma.transaction.create({
        data: { amount: 101, type: "OUTCOME", user: { connect: user }, category: { connect: { id: category.id } }}
    })
    await prisma.transaction.create({
        data: { amount: 50, type: "INCOME", user: { connect: user }}
    })
    await prisma.transaction.create({
        data: { amount: 100, type: "OUTCOME", user: { connect: user } }
    })
})

afterAll(async () => {
    await server.close()
    await prisma.report.deleteMany()
})