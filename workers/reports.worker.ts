import { config } from "dotenv"
config({ path: ".env.test" })

import { Worker } from "bullmq"
import { redis } from "../lib/redis/redis"
import { ReportJobQuerySchemaType, ReportSchema } from '../schemas/report.schema';
import { prisma } from "../lib/prisma";

const worker = new Worker<ReportJobQuerySchemaType, void, "report">("reports", async (job) => {
    const { year, month, userId } = job.data

    const reportDateRange = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
    }

    const totalIncomeQuery = await prisma.transaction.aggregate({
        where: { userId, type: "INCOME", createdAt: reportDateRange },
        _sum: { amount: true }
    })
    const totalIncome = totalIncomeQuery._sum.amount ?? 0

    const totalExpensesQuery = await prisma.transaction.aggregate({
        where: { userId, type: "OUTCOME", createdAt: reportDateRange },
        _sum: { amount: true }
    })
    const totalExpenses = totalExpensesQuery._sum.amount ?? 0

    const net = totalIncome - totalExpenses

    const transactionCount = await prisma.transaction.count({
        where: { userId, createdAt: reportDateRange }
    })
    const summary = { totalIncome, totalExpenses, net, transactionCount }

    const transactionsCategoriesIdsObject = await prisma.transaction.findMany({
        where: { userId, createdAt: reportDateRange },
        select: { categoryId: true },
        distinct: "categoryId",
    })

    const transactionsCategoriesIds = transactionsCategoriesIdsObject.map(transaction => transaction.categoryId).filter(Boolean) as string[]
    const transactionsCategories = await prisma.category.findMany({
        where: { id: { in: transactionsCategoriesIds }}
    })

    const categoriesBreakdownPromises = transactionsCategories.map(async (category) => {
        const totalSpentQuery = await prisma.transaction.aggregate({
            where: { userId, createdAt: reportDateRange, categoryId: category.id, type: "OUTCOME" },
            _sum: { amount: true }
        })
        const totalSpent = totalSpentQuery._sum.amount ?? 0
        
        const transactionCount = await prisma.transaction.count({
            where: { userId, createdAt: reportDateRange, categoryId: category.id }
        })

        return { categoryId: category.id, categoryName: category.name, totalSpent, transactionCount, budgetAmount: category.budget, isOverBudget: totalSpent > category.budget }
    })
    const categoriesBreakdown = await Promise.all(categoriesBreakdownPromises)

    // dailyTrend is written by AI. I was clueless how to implement it, so AI suggested just using
    // plain SQL query, which is a great solution
    const dailyTrend = await prisma.$queryRaw<
        { date: string; income: number; expenses: number }[]
    >`
    SELECT
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS date,
        SUM(CASE WHEN "type" = 'INCOME' THEN "amount" ELSE 0 END) AS income,
        SUM(CASE WHEN "type" = 'OUTCOME' THEN "amount" ELSE 0 END) AS expenses
    FROM "Transaction"
    WHERE "userId" = ${userId}
        AND "createdAt" >= ${reportDateRange.gte}
        AND "createdAt" < ${reportDateRange.lt}
    GROUP BY date
    ORDER BY date ASC
    `

    const topTransactionsQueryResult = await prisma.transaction.findMany({
        where: { userId, createdAt: reportDateRange },
        take: 5,
        orderBy: {
            amount: "desc"
        }
    })

    const topTransactionsPromises = topTransactionsQueryResult.map(async (transaction) => {
        const category = transaction.categoryId ?
            await prisma.category.findUnique({
                where: { id: transaction.categoryId },
                select: { name: true }
            }) : "Global Spendings"

        return {
            amount: transaction.amount,
            transactionId: transaction.id,
            categoryName: category,
            description: transaction.description,
            date: transaction.createdAt.toISOString()
        }
    })

    const topTransactions = await Promise.all(topTransactionsPromises)

    const report = ReportSchema.parse({ id: job.id, year, month, userId, data: {
        summary, categoriesBreakdown, dailyTrend, topTransactions
    }})

    await prisma.report.create({
        data: report
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