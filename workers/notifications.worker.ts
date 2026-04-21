import { Worker } from "bullmq"
import { redis } from "../lib/redis/redis"
import { TransactionSchemaType } from "../schemas/transaction.schema"
import { prisma } from "../lib/prisma"
import { sendBudgetExceededNotification } from "../services/notifications.service"

new Worker<TransactionSchemaType, void, "budget-check">("notifications", async (job) => {
    if (job.name == "budget-check") {
        const transaction = job.data

        const categoryTransactions = await prisma.transaction.findMany({
            where: { categoryId: transaction.category?.id }
        })

        const categorySpendings = categoryTransactions.reduce((total, curTransaction) => total + curTransaction.amount, 0)
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
    }
}, {
    connection: redis
})