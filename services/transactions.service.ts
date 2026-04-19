import { FastifyReply } from "fastify";
import { prisma } from "../lib/prisma";
import { isAdmin } from "./users.service";
import { TransactionSchemaType } from "../schemas/transaction.schema";
import { notificationsQueue } from "../lib/bullmq";

export async function getTransaction(transactionId: string) {
    return await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
            tags: true,
            category: true
        }
    })
}

export async function checkTransactionAccess(reply: FastifyReply, userId: string, transactionId: string) {
    const transaction = await getTransaction(transactionId)

    if (!transaction) {
        await reply.status(404).send({ message: "Transaction with this ID does not exist!" });
        return null;
    }

    if (transaction.userId !== userId) {
        const admin = await isAdmin(userId);
        if (!admin) {
            await reply.status(403).send({ message: "You don't have permissions for this transactions!" });
            return null;
        }
    }

    return transaction
}