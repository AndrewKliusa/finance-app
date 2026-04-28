import z from "zod";
import { JsonValue } from '../generated/prisma/internal/prismaNamespace';
import { expect } from 'vitest';

const ReportDataSchema = z.strictObject({
    summary: z.object({
        totalIncome: z.number(),
        totalExpenses: z.number(),
        net: z.number(),
        transactionCount: z.number().int(),
        savingsRate: z.number(),
    }),
    categoriesBreakdown: z.array(z.object({
        categoryId: z.uuid(),
        categoryName: z.string(),
        totalSpent: z.number(),
        transactionCount: z.number().int(),
        budgetAmount: z.number().nullable(),
        budgetUtilization: z.number().nullable(),
        isOverBudget: z.boolean(),
    })),
    dailyTrend: z.array(z.object({
        date: z.string(),
        income: z.number(),
        expenses: z.number(),
    })),
    topTransactions: z.array(z.object({
        transactionId: z.uuid(),
        amount: z.number(),
        categoryName: z.string(),
        description: z.string().nullable(),
        date: z.string(),
    })),
});

export const ReportSchema = z.object({
    id: z.string(),
    year: z.number().max(4).min(4),
    month: z.number().nullable(),
    userId: z.uuid(),
    data: z.any()
})

export const reportQuerySchema = z.object({
    year: z.number().positive().min(2026),
    month: z.number().positive().min(1).min(12)
})

export const reportJobQuerySchema = reportQuerySchema.extend({
    userId: ReportSchema.shape.userId
})

export type ReportData = z.infer<typeof ReportDataSchema>;
export type ReportJobQuerySchemaType = z.infer<typeof reportJobQuerySchema>