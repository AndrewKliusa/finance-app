import z from "zod";

export const ReportDataSchema = z.object({
    
})

export const ReportSchema = z.object({
    id: z.string(),
    year: z.number().max(4).min(4),
    month: z.number().nullable(),
    userId: z.uuid()
})