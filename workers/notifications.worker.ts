import { config } from "dotenv"
config({ path: ".env" })

import { Worker } from "bullmq"
import { redis } from "../lib/redis/redis"
import { TransactionSchemaType } from "../schemas/transaction.schema"
import { prisma } from "../lib/prisma"
import { sendBudgetExceededNotification } from "../services/notifications.service"

const worker = new Worker<TransactionSchemaType, void, "budget-check">("notifications", async (job) => {
    const transaction = job.data

    const categoryOutcomeResult = await prisma.transaction.aggregate({
        where: { userId: transaction.userId, categoryId: transaction.category?.id, type: "OUTCOME" },
        _sum: { amount: true }
    })

    const categoryIncomeResult = await prisma.transaction.aggregate({
        where: { userId: transaction.userId, categoryId: transaction.category?.id, type: "INCOME" },
        _sum: { amount: true }
    })

    const categorySpendings = (categoryOutcomeResult._sum.amount ?? 0) - (categoryIncomeResult._sum.amount ?? 0)
    if (transaction.category) {
        if (categorySpendings > transaction.category?.budget) {
            await sendBudgetExceededNotification(transaction.userId, transaction)
        }
    } else {
        const transactionUser = await prisma.user.findUnique({
            where: { id: transaction.userId }
        })
        if (transactionUser?.globalLimit && categorySpendings > transactionUser?.globalLimit) {
            await sendBudgetExceededNotification(transaction.userId, transaction)
        }
    }
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