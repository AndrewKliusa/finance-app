import { Queue } from "bullmq"
import { redis } from "./redis/redis"

export const notificationsQueue = new Queue("notifications", {
    connection: redis
})

export const reportQueue = new Queue("reports", {
    connection: { url: process.env.REDIS_URL }
})