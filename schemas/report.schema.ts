import z from "zod";

const ReportDataSchema = z.strictObject({
    summary: z.object({
        totalIncome: z.number(),
        totalExpenses: z.number(),
        net: z.number(),
        transactionCount: z.number().int()
    }),
    categoriesBreakdown: z.array(z.object({
        categoryId: z.uuid(),
        categoryName: z.string(),
        totalSpent: z.number(),
        transactionCount: z.number().int(),
        budgetAmount: z.number().nullable(),
        isOverBudget: z.boolean()
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
    year: z.number().int().min(2026),
    month: z.number().int().min(1).max(12),
    userId: z.uuid(),
    data: ReportDataSchema
})

export const ReportResponseSchema = ReportSchema.extend({
    data: z.any()
})

export const reportQuerySchema = z.object({
    year: z.coerce.number().positive().min(2026),
    month: z.coerce.number().positive().min(1).max(12)
})

export const reportJobQuerySchema = reportQuerySchema.extend({
    userId: ReportSchema.shape.userId
})

export type ReportData = z.infer<typeof ReportDataSchema>;
export type ReportJobQuerySchemaType = z.infer<typeof reportJobQuerySchema>