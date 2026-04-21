import z from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../preHandlers/authenticate";
import { TransactionCreateSchema, TransactionSchema, TransactionUpdateSchema } from "../schemas/transaction.schema";
import { checkTransactionAccess } from "../services/transactions.service";
import { ZodServer } from "../types/ZodServer";
import { checkUser } from "../preHandlers/checkUser";
import { notificationsQueue } from "../lib/bullmq";

export async function transactionRoutes(server: ZodServer) {
    server.post("/transactions", {
        schema: {
            tags: ["Transactions"],
            body: TransactionCreateSchema,
            response: {
                201: TransactionSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { type, amount, categoryId, description, tagsId } = request.body

        const transaction = await prisma.transaction.create({
            data: { type, amount, categoryId, description, userId: request.user.id, tags: {
                connect: tagsId.map(id => ({ id }))
            }},
            include: {
                tags: true,
                category: true
            }
        })

        if (type === "OUTCOME") {
            await notificationsQueue.add("budget-check", transaction)
        }
        return await reply.code(201).send(transaction)
    }),

    server.get("/transactions/:id", {
        schema: {
            tags: ["Transactions"],
            params: z.object({ id: z.string() }),
            response: {
                200: TransactionSchema
            }
        },
        preHandler: [authenticate]
    }, async (request, reply) => {
        const { id } = request.params

        const transaction = await checkTransactionAccess(reply, request.user.id, id)
        if (!transaction) return;

        return await reply.code(200).send(transaction)
    }),

    server.get("/transactions/user/:id", {
        schema: {
            tags: ["Transactions"],
            params: z.object({ id: z.string() }),
            response: {
                200: z.array(TransactionSchema),
                204: z.void()
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const transactions = await prisma.transaction.findMany({
            where: { userId: id },
            include: {
                tags: true,
                category: true
            }
        });

        if (transactions.length === 0) {
            return await reply.status(204).send()
        }

        return reply.status(200).send(transactions)
    }),

    server.patch("/transactions/:id", {
        schema: {
            tags: ["Transactions"],
            params: z.object({ id: z.string() }),
            body: TransactionUpdateSchema,
            response: {
                200: z.void(),
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const transaction = await checkTransactionAccess(reply, request.user.id, id)
        if (!transaction) return;

        const { amount, categoryId, description, tagsId } = request.body

        const category = await prisma.transaction.update({
            where: { id },
            data: { amount, categoryId, description, tags: {
                set: tagsId && tagsId?.map(tagId => ({ id: tagId }))
            }},
            include: {
                tags: true,
                category: true
            }
        })

        if (category.type === "OUTCOME") {
            await notificationsQueue.add("budget-check", { transaction })
        }
        return reply.status(200).send()
    }),

    server.delete("/transactions/:id", {
        schema: {
            tags: ["Transactions"],
            params: z.object({ id: z.string() }),
            response: {
                204: z.void()
            }
        },
        preHandler: [authenticate, checkUser]
    }, async (request, reply) => {
        const { id } = request.params

        const transaction = await checkTransactionAccess(reply, request.user.id, id)
        if (!transaction) return;

        await prisma.transaction.delete({
            where: { id }
        })

        return reply.status(204).send()
    })
}