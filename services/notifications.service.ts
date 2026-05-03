import { redis } from "../lib/redis/redis";
import { TransactionSchemaType } from "../schemas/transaction.schema";

export async function sendNotification(userId: string, message: string) {
    await redis.publish(`notifications:${userId}`,
        JSON.stringify({
            type: "BUDGET_EXCEEDED",
            payload: message
        })
    );
}

export async function sendBudgetExceededNotification(userId: string, transaction: TransactionSchemaType) {
    await sendNotification(userId, `Budget exceeded for ${transaction.category?.name} category.`)
}