import { config } from "dotenv"
config({ path: ".env.test" })

import { Worker } from "bullmq"
import { redis } from "../lib/redis/redis"
import { ReportJobQuerySchemaType } from '../schemas/report.schema';
import { prisma } from "../lib/prisma";

const worker = new Worker<ReportJobQuerySchemaType, void, "report">("reports", async (job) => {
    const { year, month, userId } = job.data

    const totalIncomeQuery = await prisma.transaction.aggregate({
        where: { userId, type: "INCOME" },
        _sum: { amount: true }
    })
    const totalIncome = totalIncomeQuery._sum.amount ?? 0

    const totalExpensesQuery = await prisma.transaction.aggregate({
        where: { userId, type: "OUTCOME" },
        _sum: { amount: true }
    })
    const totalExpenses = totalExpensesQuery._sum.amount ?? 0

    const net = totalIncome - totalExpenses

    const transactionCountQuery = await prisma.transaction.count({
        where: {  }
    })

}, {
    connection: redis
})

worker.on("ready", () => {
  console.log("Notification worker is running")
})

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error)
})